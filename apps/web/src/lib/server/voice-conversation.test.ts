import assert from "node:assert/strict";
import test from "node:test";
import {
  generateVoiceReply,
  isVoiceEndIntent,
  openVoiceBrief,
  openVoiceState,
  parseVoiceCallBrief,
  sealVoiceBrief,
  sealVoiceState,
  trimVoiceTurns,
  voiceActionUrl,
  voiceGatherTwiml,
  voiceHangupTwiml,
  voiceOpeningPrompt,
  type VoiceCallBrief,
  type VoiceConversationState,
} from "./voice-conversation";

const secret = "restricted-api-key-secret";
const now = Date.UTC(2026, 8, 12, 12);
const callSid = `CA${"a".repeat(32)}`;
const brief: VoiceCallBrief = {
  clinicName: "Harbor Family Clinic",
  specialty: "Primary care",
  symptoms: "A persistent cough for four days",
  location: "Abu Dhabi",
  insurance: "Self-pay",
  availability: "Weekday afternoon",
};

test("voice conversation state is encrypted, authenticated, and expires", () => {
  const state: VoiceConversationState = {
    version: 1,
    callSid,
    expiresAt: now + 60_000,
    brief,
    turns: [{ role: "user", content: "  What   should I ask?  " }],
  };
  const token = sealVoiceState(state, secret);

  assert.doesNotMatch(token, /What/);
  assert.deepEqual(openVoiceState(token, secret, now)?.turns, [
    { role: "user", content: "What should I ask?" },
  ]);
  assert.deepEqual(openVoiceState(token, secret, now)?.brief, brief);
  assert.equal(openVoiceState(`${token}x`, secret, now), null);
  assert.equal(openVoiceState(token, "wrong-secret", now), null);
  assert.equal(openVoiceState(token, secret, now + 61_000), null);
});

test("call briefs are validated and encrypted before entering the voice URL", () => {
  assert.deepEqual(parseVoiceCallBrief(brief), brief);
  assert.equal(parseVoiceCallBrief({ ...brief, symptoms: "" }), null);
  assert.equal(parseVoiceCallBrief({ ...brief, availability: null }), null);

  const token = sealVoiceBrief(brief, secret);
  assert.doesNotMatch(token, /persistent/);
  assert.deepEqual(openVoiceBrief(token, secret), brief);
  assert.equal(openVoiceBrief(`${token}x`, secret), null);
});

test("the opening is a concise professional request to the clinic", () => {
  const opening = voiceOpeningPrompt(brief);
  assert.match(opening, /automated assistant calling on behalf of a patient/i);
  assert.match(opening, /Harbor Family Clinic/);
  assert.match(opening, /persistent cough/);
  assert.match(opening, /next available appointment/i);
  assert.doesNotMatch(opening, /Twilio|OpenRouter|website|technical/i);
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
    brief,
    { OPENROUTER_API_KEY: "test-key", MODEL: "openai/gpt-5-nano" },
    fetcher as typeof fetch,
  );

  assert.equal(reply, "Ask: your clinician about timing.");
  assert.match(requestBody, /outbound appointment coordinator/);
  assert.match(requestBody, /Harbor Family Clinic/);
  assert.match(requestBody, /What should I ask/);
});

test("voice replies repair a common spoken grammar error", async () => {
  const fetcher = async () => new Response(JSON.stringify({
    choices: [{ message: { content: "Is any documents or preparation required?" } }],
  }), { status: 200, headers: { "Content-Type": "application/json" } });

  const reply = await generateVoiceReply(
    [{ role: "user", content: "Tuesday at three thirty is available." }],
    brief,
    { OPENROUTER_API_KEY: "test-key" },
    fetcher as typeof fetch,
  );

  assert.equal(reply, "Are any documents or preparation required?");
});

test("OpenRouter failures remain controlled", async () => {
  const rejected = async () => new Response("denied", { status: 401 });
  await assert.rejects(
    generateVoiceReply(
      [{ role: "user", content: "Hello" }],
      brief,
      { OPENROUTER_API_KEY: "test-key" },
      rejected as typeof fetch,
    ),
  );
});
