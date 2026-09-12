# AfterCare web app

This is the primary AfterCare surface: a Next.js app with CopilotKit context/tools, an Exa clinic-search endpoint, and an optional real Twilio Trial call to one fixed verified team number.

From the repository root:

```bash
npm ci
cp .env.example .env
npm run dev:web
```

Open <http://127.0.0.1:3100>. The form and sample-clinic flow work without credentials. OpenRouter enables the chat assistant; Exa enables live clinic discovery.

Verification:

```bash
npm run typecheck
npm test
npm run build --workspace aftercare-web
```

The fixed-number call requires the Twilio variables documented in the root `.env.example`, including a Restricted API key with only `/twilio/voice/calls/create` permission. On Vercel, Twilio uses speech gathering and OpenRouter to run a short multi-turn appointment-request conversation with the team member acting as a clinic receptionist; local calls use Twilio's built-in fallback until a public webhook exists. The approved clinic, specialty, symptom summary, location, payment type, and preferred time enter the call, but the uploaded photo and identity do not. The brief and conversation history are encrypted between active Twilio webhooks, history is capped at six recent turns, and state expires after 30 minutes. The call is protected by a private demo PIN, signed short-lived voice URL, fixed destination, same-origin check, and one-minute server cooldown. Keep it disabled on a public deployment except during a supervised demo.

This prototype must not be represented as a diagnosis, medical image analysis, a real clinic call, or a confirmed real appointment. The real call goes only to the configured team test phone.
