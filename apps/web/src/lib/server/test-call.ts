import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";

export type TestCallDetails = {
  clinicName: string;
  specialty: string;
  location: string;
  preferredTime: string;
  payment: string;
};

export type TestCallConfig = {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  toNumber: string;
  demoPin: string;
};

type Environment = Record<string, string | undefined>;
type Fetcher = typeof fetch;

export class TestCallConfigurationError extends Error {}
export class TestCallProviderError extends Error {}

const E164_PATTERN = /^\+[1-9]\d{7,14}$/;
const ACCOUNT_SID_PATTERN = /^AC[0-9a-fA-F]{32}$/;
const CALL_SID_PATTERN = /^CA[0-9a-fA-F]{32}$/;

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
  const authToken = required(environment.TWILIO_AUTH_TOKEN, "TWILIO_AUTH_TOKEN");
  const fromNumber = required(environment.TWILIO_FROM_NUMBER, "TWILIO_FROM_NUMBER");
  const toNumber = required(environment.TWILIO_TEST_TO_NUMBER, "TWILIO_TEST_TO_NUMBER");
  const demoPin = required(environment.AFTERCARE_DEMO_CALL_PIN, "AFTERCARE_DEMO_CALL_PIN");

  if (!ACCOUNT_SID_PATTERN.test(accountSid)) {
    throw new TestCallConfigurationError("TWILIO_ACCOUNT_SID has an invalid format.");
  }
  if (!E164_PATTERN.test(fromNumber) || !E164_PATTERN.test(toNumber)) {
    throw new TestCallConfigurationError("Twilio phone numbers must use E.164 format.");
  }
  if (demoPin.length < 6) {
    throw new TestCallConfigurationError("AFTERCARE_DEMO_CALL_PIN must be at least 6 characters.");
  }

  return { accountSid, authToken, fromNumber, toNumber, demoPin };
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

  return allowedOrigins.has(incomingOrigin);
}

function conciseText(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const text = value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.slice(0, 100) : fallback;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function parseTestCallDetails(value: unknown): TestCallDetails {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    clinicName: conciseText(input.clinicName, "the selected clinic"),
    specialty: conciseText(input.specialty, "general care"),
    location: conciseText(input.location, "the selected area"),
    preferredTime: conciseText(input.preferredTime, "the first available time"),
    payment: conciseText(input.payment, "payment to be confirmed"),
  };
}

export function buildTestCallTwiml(details: TestCallDetails) {
  const message = [
    "Hello. This is a real test call from AfterCare for a hackathon demonstration.",
    `The demo user selected ${details.clinicName} while looking for ${details.specialty} in ${details.location}.`,
    `Their preferred time is ${details.preferredTime}, with ${details.payment}.`,
    "No symptoms, image, identity, or payment details were shared.",
    "This call confirms that outbound calling works. No real appointment is being requested. Thank you.",
  ].map(escapeXml).join(" ");

  return `<Response><Say voice="alice" language="en-US">${message}</Say></Response>`;
}

export async function createTwilioTestCall(
  config: TestCallConfig,
  details: TestCallDetails,
  fetcher: Fetcher = fetch,
) {
  const body = new URLSearchParams({
    To: config.toNumber,
    From: config.fromNumber,
    Twiml: buildTestCallTwiml(details),
    Timeout: "20",
  });
  const response = await fetcher(
    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Calls.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}`,
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
