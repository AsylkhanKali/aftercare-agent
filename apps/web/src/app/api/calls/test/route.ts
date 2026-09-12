import { NextResponse } from "next/server";
import {
  TestCallConfigurationError,
  TestCallProviderError,
  createTwilioTestCall,
  isAllowedTestCallOrigin,
  loadTestCallConfig,
  matchesDemoPin,
} from "@/lib/server/test-call";
import { parseVoiceCallBrief } from "@/lib/server/voice-conversation";

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

    const brief = parseVoiceCallBrief(await request.json().catch(() => null));
    if (!brief) {
      return response({ error: "The clinic call brief is incomplete." }, 400);
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

    nextCallAllowedAt = now + CALL_COOLDOWN_MS;
    let call: Awaited<ReturnType<typeof createTwilioTestCall>>;
    try {
      call = await createTwilioTestCall(config, brief);
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
