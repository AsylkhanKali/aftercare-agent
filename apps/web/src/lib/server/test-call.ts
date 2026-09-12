import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";

export type TestCallConfig = {
  accountSid: string;
  apiKeySid: string;
  apiKeySecret: string;
  fromNumber: string;
  toNumber: string;
  demoPin: string;
  voiceUrl: string;
};

type Environment = Record<string, string | undefined>;
type Fetcher = typeof fetch;

export class TestCallConfigurationError extends Error {}
export class TestCallProviderError extends Error {}

const E164_PATTERN = /^\+[1-9]\d{7,14}$/;
const ACCOUNT_SID_PATTERN = /^AC[0-9a-fA-F]{32}$/;
const API_KEY_SID_PATTERN = /^SK[0-9a-fA-F]{32}$/;
const CALL_SID_PATTERN = /^CA[0-9a-fA-F]{32}$/;
export const TWILIO_TRIAL_VOICE_TEMPLATE_URL =
  "https://webhooks.twilio.com/v1/Voice/Template/voice_speech_recognition";

function required(value: string | undefined, name: string) {
  const trimmed = value?.trim();
  if (!trimmed) throw new TestCallConfigurationError(`${name} is not configured.`);
  return trimmed;
}

export function loadTestCallConfig(environment: Environment): TestCallConfig {
  if (environment.ENABLE_REAL_TEST_CALLS !== "true") {
    throw new TestCallConfigurationError("Real test calling is disabled.");
  }

  const accountSid = required(environment.TWILIO_ACCOUNT_SID, "TWILIO_ACCOUNT_SID");
  const apiKeySid = required(environment.TWILIO_API_KEY_SID, "TWILIO_API_KEY_SID");
  const apiKeySecret = required(environment.TWILIO_API_KEY_SECRET, "TWILIO_API_KEY_SECRET");
  const fromNumber = required(environment.TWILIO_FROM_NUMBER, "TWILIO_FROM_NUMBER");
  const toNumber = required(environment.TWILIO_TEST_TO_NUMBER, "TWILIO_TEST_TO_NUMBER");
  const demoPin = required(environment.AFTERCARE_DEMO_CALL_PIN, "AFTERCARE_DEMO_CALL_PIN");
  const deployedHost = environment.VERCEL_URL?.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  const explicitVoiceUrl = environment.AFTERCARE_VOICE_WEBHOOK_URL?.trim();
  const voiceUrl = explicitVoiceUrl
    || (deployedHost ? `https://${deployedHost}/api/calls/voice` : TWILIO_TRIAL_VOICE_TEMPLATE_URL);

  if (!ACCOUNT_SID_PATTERN.test(accountSid)) {
    throw new TestCallConfigurationError("TWILIO_ACCOUNT_SID has an invalid format.");
  }
  if (!API_KEY_SID_PATTERN.test(apiKeySid)) {
    throw new TestCallConfigurationError("TWILIO_API_KEY_SID has an invalid format.");
  }
  if (!E164_PATTERN.test(fromNumber) || !E164_PATTERN.test(toNumber)) {
    throw new TestCallConfigurationError("Twilio phone numbers must use E.164 format.");
  }
  if (demoPin.length < 6) {
    throw new TestCallConfigurationError("AFTERCARE_DEMO_CALL_PIN must be at least 6 characters.");
  }
  if (!voiceUrl.startsWith("https://")) {
    throw new TestCallConfigurationError("The Twilio voice webhook must use HTTPS.");
  }

  return { accountSid, apiKeySid, apiKeySecret, fromNumber, toNumber, demoPin, voiceUrl };
}

export function matchesDemoPin(provided: string, expected: string) {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return (
    providedBuffer.length === expectedBuffer.length
    && timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

export function isAllowedTestCallOrigin(request: Request, environment: Environment) {
  const incomingOrigin = request.headers.get("origin");
  if (!incomingOrigin) return false;

  const requestUrl = new URL(request.url);
  const actualUrl = new URL(requestUrl);
  actualUrl.host = request.headers.get("host") || requestUrl.host;
  const allowedOrigins = new Set<string>();

  if (["localhost", "127.0.0.1", "[::1]"].includes(actualUrl.hostname)) {
    allowedOrigins.add(actualUrl.origin);
  }

  const configuredOrigin = environment.AFTERCARE_ALLOWED_ORIGIN?.trim().replace(/\/$/, "");
  if (configuredOrigin) allowedOrigins.add(configuredOrigin);

  const vercelHost = environment.VERCEL_URL?.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (vercelHost) allowedOrigins.add(`https://${vercelHost}`);

  const productionHost = environment.VERCEL_PROJECT_PRODUCTION_URL
    ?.trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  if (productionHost) allowedOrigins.add(`https://${productionHost}`);

  return allowedOrigins.has(incomingOrigin);
}

export async function createTwilioTestCall(
  config: TestCallConfig,
  fetcher: Fetcher = fetch,
) {
  const body = new URLSearchParams({
    To: config.toNumber,
    From: config.fromNumber,
    Url: config.voiceUrl,
  });
  const response = await fetcher(
    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Calls.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.apiKeySid}:${config.apiKeySecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  if (!response.ok) {
    throw new TestCallProviderError("Twilio rejected the test call request.");
  }

  const payload = await response.json() as { sid?: unknown; status?: unknown };
  if (typeof payload.sid !== "string" || !CALL_SID_PATTERN.test(payload.sid)) {
    throw new TestCallProviderError("Twilio returned an invalid call response.");
  }

  return {
    callId: payload.sid,
    status: typeof payload.status === "string" ? payload.status : "queued",
  };
}
