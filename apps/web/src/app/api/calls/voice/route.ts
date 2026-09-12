const AFTERCARE_VOICE_TWIML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">Hello. This is AfterCare. You are receiving a supervised hackathon test call. Outbound voice automation is working. No symptoms, identity, or private health information were shared. No clinic was contacted and no appointment is being created. Thank you.</Say>
</Response>`;

function voiceResponse() {
  return new Response(AFTERCARE_VOICE_TWIML, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "text/xml; charset=utf-8",
    },
  });
}

export function GET() {
  return voiceResponse();
}

export function POST() {
  return voiceResponse();
}
