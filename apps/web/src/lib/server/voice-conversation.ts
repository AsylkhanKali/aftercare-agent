import { Buffer } from "node:buffer";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

export type VoiceTurn = {
  role: "user" | "assistant";
  content: string;
};

export type VoiceConversationState = {
  version: 1;
  callSid: string;
  expiresAt: number;
  turns: VoiceTurn[];
};

type Environment = Record<string, string | undefined>;
type Fetcher = typeof fetch;

const CALL_SID_PATTERN = /^CA[0-9a-fA-F]{32}$/;
const MAX_STORED_TURNS = 6;
const MAX_TURN_CHARACTERS = 420;
const MAX_REPLY_CHARACTERS = 520;

const VOICE_SYSTEM_PROMPT = `You are AfterCare, a supervised hackathon voice assistant for healthcare navigation.
Keep each spoken reply under 45 words and ask at most one question at a time.
You may explain general care options and help someone prepare questions for a clinician.
Never diagnose, prescribe, claim that a clinic was contacted, or claim that an appointment was booked.
Do not ask for a full name, government ID, payment details, insurance number, or exact home address.
If the caller describes possible immediate danger, tell them to call local emergency services now.
Be clear that this is an AI prototype. Use plain conversational English with no markdown or URLs.`;

function stateKey(secret: string) {
  return createHash("sha256")
    .update("aftercare-voice-state\0")
    .update(secret)
    .digest();
}

function normalizeTurnContent(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_TURN_CHARACTERS);
}

export function trimVoiceTurns(turns: VoiceTurn[]) {
  return turns
    .filter((turn) => turn.role === "user" || turn.role === "assistant")
    .map((turn) => ({ ...turn, content: normalizeTurnContent(turn.content) }))
    .filter((turn) => turn.content.length > 0)
    .slice(-MAX_STORED_TURNS);
}

export function sealVoiceState(state: VoiceConversationState, secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", stateKey(secret), iv);
  const plaintext = Buffer.from(JSON.stringify({ ...state, turns: trimVoiceTurns(state.turns) }));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64url");
}

export function openVoiceState(token: string, secret: string, now = Date.now()) {
  try {
    const payload = Buffer.from(token, "base64url");
    if (payload.toString("base64url") !== token) return null;
    if (payload.length < 29) return null;
    const iv = payload.subarray(0, 12);
    const tag = payload.subarray(12, 28);
    const ciphertext = payload.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", stateKey(secret), iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
    const parsed = JSON.parse(plaintext) as Partial<VoiceConversationState>;
    if (parsed.version !== 1 || typeof parsed.callSid !== "string") return null;
    if (!CALL_SID_PATTERN.test(parsed.callSid)) return null;
    if (typeof parsed.expiresAt !== "number" || parsed.expiresAt < now) return null;
    if (!Array.isArray(parsed.turns)) return null;
    return {
      version: 1 as const,
      callSid: parsed.callSid,
      expiresAt: parsed.expiresAt,
      turns: trimVoiceTurns(parsed.turns as VoiceTurn[]),
    };
  } catch {
    return null;
  }
}

export function escapeVoiceXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function voiceGatherTwiml(prompt: string, actionUrl: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${escapeVoiceXml(actionUrl)}" method="POST" language="en-US" speechTimeout="auto" timeout="6" actionOnEmptyResult="true">
    <Say voice="alice" language="en-US">${escapeVoiceXml(prompt)}</Say>
  </Gather>
</Response>`;
}

export function voiceHangupTwiml(message: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">${escapeVoiceXml(message)}</Say>
  <Hangup/>
</Response>`;
}

export function voiceActionUrl(stateToken: string) {
  return `/api/calls/conversation?state=${encodeURIComponent(stateToken)}`;
}

export function isVoiceEndIntent(value: string) {
  return /\b(goodbye|bye|hang up|stop the call|that's all|that is all)\b/i.test(value)
    || /до свидания|пока|заверши звонок|закончи звонок/i.test(value);
}

function speechFriendly(value: string) {
  return value
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[*_`#]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_REPLY_CHARACTERS);
}

function openRouterModel(environment: Environment) {
  const configured = environment.MODEL?.trim() || "openai/gpt-5-nano";
  return configured.startsWith("openrouter:")
    ? configured.slice("openrouter:".length)
    : configured;
}

export async function generateVoiceReply(
  turns: VoiceTurn[],
  environment: Environment,
  fetcher: Fetcher = fetch,
) {
  const apiKey = environment.OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error("OpenRouter is not configured.");

  const response = await fetcher("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": environment.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${environment.VERCEL_PROJECT_PRODUCTION_URL}`
        : "https://aftercare-agent.vercel.app",
      "X-OpenRouter-Title": "AfterCare voice demo",
    },
    body: JSON.stringify({
      model: openRouterModel(environment),
      messages: [
        { role: "system", content: VOICE_SYSTEM_PROMPT },
        ...trimVoiceTurns(turns),
      ],
      max_tokens: 220,
      temperature: 0.2,
      reasoning: { effort: "minimal", exclude: true },
    }),
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) throw new Error("OpenRouter rejected the voice reply request.");
  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  const text = typeof content === "string"
    ? content
    : Array.isArray(content)
      ? content
        .map((part) => part && typeof part === "object" && "text" in part ? String(part.text) : "")
        .join(" ")
      : "";
  const reply = speechFriendly(text);
  if (!reply) throw new Error("OpenRouter returned an empty voice reply.");
  return reply;
}
