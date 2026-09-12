import { NextResponse } from "next/server";
import {
  TestCallConfigurationError,
  TestCallProviderError,
  createTwilioTestCall,
  isAllowedTestCallOrigin,
  loadTestCallConfig,
  matchesDemoPin,
  parseTestCallDetails,
} from "@/lib/server/test-call";

const CALL_COOLDOWN_MS = 60_000;
let nextCallAllowedAt = 0;

function response(body: Record<string, unknown>, status: number, headers?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

export async function POST(request: Request) {
  if (!isAllowedTestCallOrigin(request, process.env)) {
    return response({ error: "Test calls require a same-origin browser request." }, 403);
  }

  try {
    const config = loadTestCallConfig(process.env);
    const demoPin = request.headers.get("x-aftercare-demo-pin") ?? "";
    if (!matchesDemoPin(demoPin, config.demoPin)) {
      return response({ error: "The demo call PIN is incorrect." }, 403);
    }

    const now = Date.now();
    if (now < nextCallAllowedAt) {
      const retryAfter = Math.ceil((nextCallAllowedAt - now) / 1000);
      return response(
        { error: `Please wait ${retryAfter} seconds before another test call.` },
        429,
        { "Retry-After": String(retryAfter) },
      );
    }

    let input: unknown;
    try {
      input = await request.json();
    } catch {
      return response({ error: "The test call request must be valid JSON." }, 400);
    }
    const details = parseTestCallDetails(input);
    nextCallAllowedAt = now + CALL_COOLDOWN_MS;
    let call: Awaited<ReturnType<typeof createTwilioTestCall>>;
    try {
      call = await createTwilioTestCall(config, details);
    } catch (error) {
      nextCallAllowedAt = 0;
      throw error;
    }
    return response({ mode: "twilio", status: call.status }, 202);
  } catch (error) {
    if (error instanceof TestCallConfigurationError) {
      return response({ error: "Real test calling is not configured on this server." }, 503);
    }
    if (error instanceof TestCallProviderError) {
      return response({ error: error.message }, 502);
    }
    return response({ error: "The real test call could not be started." }, 500);
  }
}
