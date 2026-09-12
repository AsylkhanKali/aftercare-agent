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

The fixed-number call requires the Twilio variables documented in the root `.env.example`, including a Restricted API key with only `/twilio/voice/calls/create` permission. On Vercel, Twilio uses speech gathering and OpenRouter to run a short multi-turn voice conversation; local calls use Twilio's built-in fallback until a public webhook exists. Website intake data is never sent into the call, but speech said during the call is transcribed by Twilio and sent to OpenRouter to generate a reply. Conversation history is encrypted, carried only between the active Twilio webhooks, capped at six recent turns, and expires after 30 minutes. The call is protected by a private demo PIN, signed short-lived voice URL, fixed destination, same-origin check, and one-minute server cooldown. Keep it disabled on a public deployment except during a supervised demo.

This prototype must not be represented as a diagnosis, medical image analysis, a real clinic call, or a confirmed real appointment. The real call goes only to the configured team test phone.
