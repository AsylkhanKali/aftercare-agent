# CareCall web app

This is the primary CareCall surface: a Next.js app with CopilotKit context/tools, an Exa clinic-search endpoint, and a clearly labeled test-call simulation.

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
npm run build --workspace carecall-web
```

This prototype must not be represented as a diagnosis, medical image analysis, a real clinic call, or a confirmed real appointment.
