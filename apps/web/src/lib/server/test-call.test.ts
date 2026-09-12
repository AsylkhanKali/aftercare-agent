import assert from "node:assert/strict";
import test from "node:test";
import {
  TestCallConfigurationError,
  TestCallProviderError,
  buildTestCallTwiml,
  createTwilioTestCall,
  isAllowedTestCallOrigin,
  loadTestCallConfig,
  matchesDemoPin,
  parseTestCallDetails,
} from "./test-call";

const config = {
  accountSid: `AC${"a".repeat(32)}`,
  authToken: "secret-token",
  fromNumber: "+15550001111",
  toNumber: "+15550002222",
  demoPin: "246810",
};

test("loads an explicitly enabled fixed-number test-call configuration", () => {
  assert.deepEqual(loadTestCallConfig({
    ENABLE_REAL_TEST_CALLS: "true",
    TWILIO_ACCOUNT_SID: config.accountSid,
    TWILIO_AUTH_TOKEN: config.authToken,
    TWILIO_FROM_NUMBER: config.fromNumber,
    TWILIO_TEST_TO_NUMBER: config.toNumber,
    AFTERCARE_DEMO_CALL_PIN: config.demoPin,
  }), config);
});

test("rejects disabled, malformed, or weak test-call configuration", () => {
  assert.throws(() => loadTestCallConfig({}), TestCallConfigurationError);
  assert.throws(() => loadTestCallConfig({
    ENABLE_REAL_TEST_CALLS: "true",
    TWILIO_ACCOUNT_SID: "invalid",
    TWILIO_AUTH_TOKEN: "secret",
    TWILIO_FROM_NUMBER: config.fromNumber,
    TWILIO_TEST_TO_NUMBER: config.toNumber,
    AFTERCARE_DEMO_CALL_PIN: config.demoPin,
  }), TestCallConfigurationError);
});

test("compares the demo PIN without accepting different lengths", () => {
  assert.equal(matchesDemoPin("246810", "246810"), true);
  assert.equal(matchesDemoPin("246811", "246810"), false);
  assert.equal(matchesDemoPin("24681", "246810"), false);
});

test("accepts the exact local or configured deployment origin only", () => {
  const local = new Request("http://localhost:3100/api/calls/test", {
    headers: { host: "127.0.0.1:3100", origin: "http://127.0.0.1:3100" },
  });
  assert.equal(isAllowedTestCallOrigin(local, {}), true);

  const deployment = new Request("http://localhost:3000/api/calls/test", {
    headers: { origin: "https://aftercare.example" },
  });
  assert.equal(isAllowedTestCallOrigin(deployment, {
    AFTERCARE_ALLOWED_ORIGIN: "https://aftercare.example/",
  }), true);
  assert.equal(isAllowedTestCallOrigin(deployment, {
    AFTERCARE_ALLOWED_ORIGIN: "https://other.example",
  }), false);
});

test("sanitizes untrusted fields and escapes them before building TwiML", () => {
  const details = parseTestCallDetails({
    clinicName: "  Test & <Clinic>  ",
    specialty: "Dermatology\u0000",
    location: "Abu   Dhabi",
    preferredTime: "Tomorrow",
    payment: "Self-pay",
  });
  const twiml = buildTestCallTwiml(details);
  assert.match(twiml, /Test &amp; &lt;Clinic&gt;/);
  assert.doesNotMatch(twiml, /\u0000/);
  assert.doesNotMatch(twiml, /<Clinic>/);
  assert.match(twiml, /No symptoms, image, identity, or payment details were shared/);
});

test("creates a Twilio call to only the configured fixed destination", async () => {
  let requestedUrl = "";
  let requestedBody = "";
  const fetcher = async (input: string | URL | Request, init?: RequestInit) => {
    requestedUrl = String(input);
    requestedBody = String(init?.body);
    return new Response(JSON.stringify({
      sid: `CA${"b".repeat(32)}`,
      status: "queued",
    }), { status: 201, headers: { "Content-Type": "application/json" } });
  };

  const result = await createTwilioTestCall(
    config,
    parseTestCallDetails({ clinicName: "Demo Clinic" }),
    fetcher as typeof fetch,
  );

  assert.match(requestedUrl, new RegExp(config.accountSid));
  assert.match(requestedBody, new RegExp(`To=${encodeURIComponent(config.toNumber)}`));
  assert.doesNotMatch(requestedBody, /user-provided-number/);
  assert.equal(result.status, "queued");
});

test("turns provider failures and malformed responses into controlled errors", async () => {
  const rejected = async () => new Response("denied", { status: 401 });
  await assert.rejects(
    createTwilioTestCall(config, parseTestCallDetails({}), rejected as typeof fetch),
    TestCallProviderError,
  );

  const malformed = async () => new Response(JSON.stringify({ sid: "wrong" }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
  await assert.rejects(
    createTwilioTestCall(config, parseTestCallDetails({}), malformed as typeof fetch),
    TestCallProviderError,
  );
});
