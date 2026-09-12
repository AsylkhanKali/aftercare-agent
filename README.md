# AfterCare Agent

AfterCare is a hackathon prototype that helps a person turn a symptom description into a safer next step, find relevant nearby clinics, and explicitly approve a call to a fixed team test number.

It is a care-navigation demo, not a medical device: it does not diagnose, prescribe, interpret uploaded images, or contact a real clinic. Emergency warning phrases stop the routine booking flow and direct the user to local emergency services.

## What the demo does

1. The user describes symptoms, area, payment preference, and availability.
2. AfterCare suggests the type and urgency of care without diagnosing.
3. Exa finds possible clinics and returns source links. With no Exa key, clearly labeled sample clinics keep the demo runnable.
4. CopilotKit gives the assistant access to the current page context and renders care/clinic cards.
5. The user selects a clinic and must approve before a real call goes to a fixed, verified team test number. The selected clinic is never called.

## Run locally

Requirements: Node.js 22 or newer.

```bash
npm ci
cp .env.example .env
npm run dev:web
```

Open <http://127.0.0.1:3100>.

For the chat assistant, add an OpenRouter key and choose any model on your account that supports tool calling. Add an Exa key for live web search. Without Exa, the page falls back to sample clinics; without OpenRouter, the form workflow still runs but chat does not.

```dotenv
MODEL_PROVIDER=openrouter
OPENROUTER_API_KEY=your-openrouter-key
MODEL=openai/gpt-5-nano
EXA_API_KEY=your-exa-key
EXA_SEARCH_TYPE=fast

# Optional supervised real-call demo
ENABLE_REAL_TEST_CALLS=true
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_FROM_NUMBER=your-twilio-trial-number
TWILIO_TEST_TO_NUMBER=your-verified-team-number
AFTERCARE_DEMO_CALL_PIN=choose-a-private-pin
# Set this only when using a custom deployment domain.
AFTERCARE_ALLOWED_ORIGIN=https://your-domain.example
```

The default is a small tool-capable model routed through OpenRouter. It is intentionally inexpensive, but it is not free and current OpenRouter pricing still applies. Never commit `.env`. Any API key pasted into chat or a screenshot should be revoked and regenerated before use.

## Verify

```bash
npm run verify
npm run build --workspace aftercare-web
```

The automated checks do not call sponsors or place phone calls. Before recording a demo, run one Exa-backed search and confirm its links manually.

## Safety and privacy boundaries

- Image files are previewed locally and never uploaded by this prototype.
- The model sees only the minimum text fields shown in the page context.
- Clinic pages are treated as untrusted search results, not as medical advice.
- No contact happens before an explicit user click.
- Twilio can place a real call only to the fixed verified team test number after explicit approval and a private demo PIN.
- The call shares the selected clinic name, specialty, city, availability, and payment preference. It never shares symptoms, photos, identity, or the user's phone number.
- A one-minute server cooldown limits repeated calls. Keep the integration disabled outside supervised demos; this is not production-grade authentication or abuse prevention.
- The selected clinic is never called and no real appointment is created.

## Stack

- Next.js and React for the web experience
- CopilotKit for page-aware chat, frontend tools, generative UI, and approval
- OpenRouter for the language model
- Exa for grounded clinic discovery
- Twilio Trial for the optional fixed-number outbound call

The project began from CopilotKit's `agents-everywhere-starter-kit`. The infrastructure, runtime, and provider adapters are inherited; the AfterCare workflow, visual design, safety boundary, clinic search route, and fixed-number call integration were created for the hackathon. See [SUBMISSION.md](SUBMISSION.md) for the demo checklist.

## Important files

- `apps/web/src/app/page.tsx` — complete user flow
- `apps/web/src/lib/care.ts` — deterministic triage guardrail and sample data
- `apps/web/src/app/api/clinics/search/route.ts` — Exa-backed clinic discovery
- `apps/web/src/app/api/calls/test/route.ts` — guarded Twilio test-call endpoint
- `apps/web/src/components/app-control.tsx` — page context and agent tools
- `apps/web/src/components/generative-ui.tsx` — agent-rendered cards and approval
- `packages/agent-core/src/prompt.ts` — AfterCare agent policy

MIT licensed. See [LICENSE](LICENSE).
