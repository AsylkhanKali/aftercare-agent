import { loadTestCallConfig } from "@/lib/server/test-call";
import {
  generateVoiceReply,
  isVoiceEndIntent,
  openVoiceState,
  sealVoiceState,
  trimVoiceTurns,
  voiceActionUrl,
  voiceGatherTwiml,
  voiceHangupTwiml,
} from "@/lib/server/voice-conversation";

function twimlResponse(body: string) {
  return new Response(body, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/xml; charset=utf-8",
    },
  });
}

export async function POST(request: Request) {
  try {
    const config = loadTestCallConfig(process.env);
    const token = new URL(request.url).searchParams.get("state") ?? "";
    const state = openVoiceState(token, config.apiKeySecret);
    const form = await request.formData();
    const callSid = String(form.get("CallSid") ?? "");

    if (!state || state.callSid !== callSid) {
      return twimlResponse(voiceHangupTwiml(
        "I could not verify this demo conversation. Please restart the call from the AfterCare website.",
      ));
    }

    const speech = String(form.get("SpeechResult") ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 600);
    if (!speech) {
      return twimlResponse(voiceGatherTwiml(
        "I did not hear a response. Could you repeat that, please?",
        voiceActionUrl(token),
      ));
    }

    if (isVoiceEndIntent(speech)) {
      return twimlResponse(voiceHangupTwiml("Thank you for your time. Goodbye."));
    }

    const withUser = trimVoiceTurns([...state.turns, { role: "user", content: speech }]);
    let reply: string;
    try {
      reply = await generateVoiceReply(withUser, state.brief, process.env);
    } catch {
      reply = "I could not process that response. Could you repeat the appointment information briefly?";
    }

    const turns = trimVoiceTurns([...withUser, { role: "assistant", content: reply }]);
    const nextToken = sealVoiceState({ ...state, turns }, config.apiKeySecret);
    return twimlResponse(voiceGatherTwiml(reply, voiceActionUrl(nextToken)));
  } catch {
    return twimlResponse(voiceHangupTwiml(
      "The AfterCare voice demo is unavailable right now. Please try again from the website later.",
    ));
  }
}
