import assert from "node:assert/strict";
import test from "node:test";
import {
  generateVoiceReply,
  isVoiceEndIntent,
  openVoiceState,
  sealVoiceState,
  trimVoiceTurns,
  voiceActionUrl,
  voiceGatherTwiml,
  voiceHangupTwiml,
  type VoiceConversationState,
} from "./voice-conversation";

const secret = "restricted-api-key-secret";
const now = Date.UTC(2026, 8, 12, 12);
const callSid = `CA${"a".repeat(32)}`;

test("voice conversation state is encrypted, authenticated, and expires", () => {
  const state: VoiceConversationState = {
    version: 1,
    callSid,
    expiresAt: now + 60_000,
    turns: [{ role: "user", content: "  What   should I ask?  " }],
  };
  const token = sealVoiceState(state, secret);

  assert.doesNotMatch(token, /What/);
  assert.deepEqual(openVoiceState(token, secret, now)?.turns, [
    { role: "user", content: "What should I ask?" },
  ]);
  assert.equal(openVoiceState(`${token}x`, secret, now), null);
  assert.equal(openVoiceState(token, "wrong-secret", now), null);
  assert.equal(openVoiceState(token, secret, now + 61_000), null);
});

test("voice history stays short and keeps the latest turns", () => {
  const turns = Array.from({ length: 8 }, (_, index) => ({
    role: index % 2 === 0 ? "user" as const : "assistant" as const,
    content: `turn ${index}`,
  }));
  assert.deepEqual(trimVoiceTurns(turns).map((turn) => turn.content), [
    "turn 2",
    "turn 3",
    "turn 4",
    "turn 5",
    "turn 6",
    "turn 7",
  ]);
});

test("TwiML escapes prompts and continues through the encrypted action URL", () => {
  const action = voiceActionUrl("encrypted-token");
  const gather = voiceGatherTwiml("Ask <one> & listen", action);
  const hangup = voiceHangupTwiml("Goodbye & thanks");

  assert.match(gather, /input="speech"/);
  assert.match(gather, /actionOnEmptyResult="true"/);
  assert.match(gather, /Ask &lt;one&gt; &amp; listen/);
  assert.match(gather, /\/api\/calls\/conversation\?state=encrypted-token/);
  assert.match(hangup, /Goodbye &amp; thanks/);
  assert.match(hangup, /<Hangup\/>/);
});

test("voice end phrases are recognized without matching ordinary questions", () => {
  assert.equal(isVoiceEndIntent("That's all, goodbye"), true);
  assert.equal(isVoiceEndIntent("Please explain primary care"), false);
});

test("OpenRouter replies are short and speech friendly", async () => {
  let requestBody = "";
  const fetcher = async (_input: string | URL | Request, init?: RequestInit) => {
    requestBody = String(init?.body);
    return new Response(JSON.stringify({
      choices: [{ message: { content: "**Ask:** [your clinician](https://example.com) about timing." } }],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  const reply = await generateVoiceReply(
    [{ role: "user", content: "What should I ask?" }],
    { OPENROUTER_API_KEY: "test-key", MODEL: "openai/gpt-5-nano" },
    fetcher as typeof fetch,
  );

  assert.equal(reply, "Ask: your clinician about timing.");
  assert.match(requestBody, /healthcare navigation/);
  assert.match(requestBody, /What should I ask/);
});

test("OpenRouter failures remain controlled", async () => {
  const rejected = async () => new Response("denied", { status: 401 });
  await assert.rejects(
    generateVoiceReply(
      [{ role: "user", content: "Hello" }],
      { OPENROUTER_API_KEY: "test-key" },
      rejected as typeof fetch,
    ),
  );
});
