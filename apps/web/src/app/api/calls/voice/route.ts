import {
  TestCallConfigurationError,
  loadTestCallConfig,
  verifyVoiceSessionToken,
} from "@/lib/server/test-call";
import {
  sealVoiceState,
  voiceActionUrl,
  voiceGatherTwiml,
} from "@/lib/server/voice-conversation";

const CALL_SID_PATTERN = /^CA[0-9a-fA-F]{32}$/;

function twimlResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/xml; charset=utf-8",
    },
  });
}

export function GET() {
  return new Response("AfterCare voice webhook is ready.", {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export async function POST(request: Request) {
  try {
    const config = loadTestCallConfig(process.env);
    const session = new URL(request.url).searchParams.get("session") ?? "";
    if (!verifyVoiceSessionToken(session, config.apiKeySecret)) {
      return new Response("Forbidden", { status: 403 });
    }

    const form = await request.formData();
    const callSid = String(form.get("CallSid") ?? "");
    if (!CALL_SID_PATTERN.test(callSid)) {
      return new Response("Invalid call", { status: 400 });
    }

    const state = sealVoiceState({
      version: 1,
      callSid,
      expiresAt: Date.now() + 30 * 60_000,
      turns: [],
    }, config.apiKeySecret);

    return twimlResponse(voiceGatherTwiml(
      "Hello, this is AfterCare, an AI healthcare navigation prototype. I can answer general questions and help you prepare for care, but I cannot diagnose you or book a real appointment. What would you like help with?",
      voiceActionUrl(state),
    ));
  } catch (error) {
    const status = error instanceof TestCallConfigurationError ? 503 : 500;
    return new Response("Voice assistant unavailable", { status });
  }
}
