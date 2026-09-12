import assert from "node:assert/strict";
import test from "node:test";
import {
  TestCallConfigurationError,
  TestCallProviderError,
  createTwilioTestCall,
  isAllowedTestCallOrigin,
  loadTestCallConfig,
  matchesDemoPin,
} from "./test-call";

const config = {
  accountSid: `AC${"a".repeat(32)}`,
  apiKeySid: `SK${"c".repeat(32)}`,
  apiKeySecret: "secret-token",
  fromNumber: "+15550001111",
  toNumber: "+15550002222",
  demoPin: "246810",
  voiceUrl: "https://aftercare.example/api/calls/voice",
};

test("loads an explicitly enabled fixed-number test-call configuration", () => {
  assert.deepEqual(loadTestCallConfig({
    ENABLE_REAL_TEST_CALLS: "true",
    TWILIO_ACCOUNT_SID: config.accountSid,
    TWILIO_API_KEY_SID: config.apiKeySid,
    TWILIO_API_KEY_SECRET: config.apiKeySecret,
    TWILIO_FROM_NUMBER: config.fromNumber,
    TWILIO_TEST_TO_NUMBER: config.toNumber,
    AFTERCARE_DEMO_CALL_PIN: config.demoPin,
    VERCEL_URL: "aftercare.example",
  }), config);
});

test("rejects disabled, malformed, or weak test-call configuration", () => {
  assert.throws(() => loadTestCallConfig({}), TestCallConfigurationError);
  assert.throws(() => loadTestCallConfig({
    ENABLE_REAL_TEST_CALLS: "true",
    TWILIO_ACCOUNT_SID: "invalid",
    TWILIO_API_KEY_SID: config.apiKeySid,
    TWILIO_API_KEY_SECRET: "secret",
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

  assert.equal(isAllowedTestCallOrigin(deployment, {
    VERCEL_PROJECT_PRODUCTION_URL: "aftercare.example",
  }), true);
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

  const result = await createTwilioTestCall(config, fetcher as typeof fetch);

  assert.match(requestedUrl, new RegExp(config.accountSid));
  assert.match(requestedBody, new RegExp(`To=${encodeURIComponent(config.toNumber)}`));
  assert.doesNotMatch(requestedBody, /user-provided-number/);
  assert.match(requestedBody, /aftercare\.example/);
  assert.doesNotMatch(requestedBody, /Twiml=/);
  assert.equal(result.status, "queued");
});

test("turns provider failures and malformed responses into controlled errors", async () => {
  const rejected = async () => new Response("denied", { status: 401 });
  await assert.rejects(
    createTwilioTestCall(config, rejected as typeof fetch),
    TestCallProviderError,
  );

  const malformed = async () => new Response(JSON.stringify({ sid: "wrong" }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
  await assert.rejects(
    createTwilioTestCall(config, malformed as typeof fetch),
    TestCallProviderError,
  );
});
