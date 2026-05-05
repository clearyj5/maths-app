# TODO — Demo Milestone (Vercel-only)

Goal: a clickable, Vercel-hosted demo with dummy questions by topic, a mock AI chat per question, the production data format locked in, and a polished UI. Designed so migrating to AWS later is a clean swap — not a rewrite.

**Out of scope**: AWS infrastructure, Terraform, real Lambdas, DynamoDB, authentication, real Bedrock calls, full test coverage.

**Architectural guarantee**: every abstraction in this list (repository, AI provider, session store) is designed to swap cleanly to AWS in the Post-Demo phase without touching UI or business logic.

---

## 1. Repository & Tooling

- [ ] Initialise single Next.js 14 app at repo root with `create-next-app` (App Router, TypeScript, Tailwind, ESLint)
- [ ] Verify `tsconfig.json` has `strict: true`
- [ ] Add Prettier config alongside create-next-app's ESLint
- [ ] Add Husky + lint-staged pre-commit hook (lint staged files only)
- [ ] Confirm `nvm use` picks v20 (`.nvmrc` already committed)
- [ ] Install runtime deps: `zustand`, `katex`, `react-katex`, `zod`, `clsx`, `lucide-react`
- [ ] Install dev deps: `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `prettier`, `husky`, `lint-staged`
- [ ] Configure app-wide font via `next/font` (Inter)
- [ ] Import `katex/dist/katex.min.css` in root layout

## 2. Dummy Question Data

Questions are organised first by **level** (Higher / Ordinary), then by **topic**. No `paper` or `difficulty` fields — those were dropped as too prescriptive / too subjective.

- [ ] Author **8 trigonometry** questions (4 Higher, 4 Ordinary) in `data/questions/<level>/trigonometry/*.json` — sine rule, cosine rule, unit circle, identities
- [ ] Author **8 calculus** questions (4 Higher, 4 Ordinary) in `data/questions/<level>/calculus/*.json` — differentiation, integration, limits, related rates
- [ ] Author **6 algebra** questions (3 Higher, 3 Ordinary) in `data/questions/<level>/algebra/*.json` — quadratics, sequences, logs, complex numbers
- [ ] Every question includes: `questionId`, `level` (`higher` or `ordinary`), `topic`, `subtopic`, `year` (2018–2024), `questionText` (LaTeX), `markingScheme` (LaTeX), `solutionSteps`
- [ ] Questions must be clearly fictional (no impersonation of the State Examinations Commission)
- [ ] Add `data/questions/README.md` documenting the schema — this is the contract future real-data imports will follow

## 3. Shared Schemas & Abstractions

This is where the "safe to migrate later" guarantee lives. Get these right and the AWS port is mechanical.

- [ ] `schemas/question.ts` — Zod schema matching the PLAN.md DynamoDB item shape exactly
- [ ] `schemas/chat.ts` — Zod schemas for chat request and assistant message shapes
- [ ] `shared/types.ts` — TypeScript types inferred from Zod schemas via `z.infer`
- [ ] `repositories/question-repository.ts` — define the `QuestionRepository` interface (`getTopics(level)`, `getQuestionsByTopic(level, topic, filters)`, `getQuestion(level, questionId)`). All methods take a `level` argument — HL and OL question banks are never mixed.
- [ ] `repositories/local-json.ts` — `LocalJsonRepository` reading bundled JSON via dynamic imports
- [ ] `repositories/index.ts` — factory returning the configured repo (currently always `LocalJsonRepository`; post-migration will branch on env var)
- [ ] `providers/ai-provider.ts` — define `AIProvider` interface (`streamResponse(prompt): AsyncIterable<string>`)
- [ ] `providers/mock.ts` — `MockProvider` with three branches:
  - [ ] "hint" keyword → single-step guidance from `solutionSteps[0]`
  - [ ] "solution"/"answer" → stream all `solutionSteps` with simulated delays
  - [ ] Otherwise → Socratic question referencing the problem context
- [ ] `providers/bedrock.ts` — stub class that throws `'not implemented'`
- [ ] `providers/index.ts` — `getAIProvider(name)` factory reading `AI_PROVIDER` env (default `mock`)
- [ ] `lib/prompt.ts` — pure function: `(question, history, userMessage) => promptString`
- [ ] `lib/session.ts` — pure functions for conversation truncation (10-turn cap)
- [ ] `lib/sanitise.ts` — strip `---`, `System:`, `<instruction>` from user messages

## 4. Next.js API Routes (Mock AI Backend)

Handlers are **thin wrappers** — all logic lives in `lib/` and `repositories/`. When we migrate to Lambda, these files become 10-line Lambda handlers reusing the same modules.

- [ ] `app/api/[level]/topics/route.ts` — GET → `repository.getTopics(level)`
- [ ] `app/api/[level]/topics/[topic]/questions/route.ts` — GET (optional `?year` filter)
- [ ] `app/api/[level]/chat/[questionId]/route.ts` — POST body `{ sessionId, message, history }`
  - [ ] Validate body with Zod
  - [ ] Sanitise user message via `lib/sanitise.ts`
  - [ ] Fetch question (including `solutionSteps`) server-side via the repository — never trust the client to supply solution context
  - [ ] Build prompt via `lib/prompt.ts`
  - [ ] Return `new Response(readableStream)` piping `provider.streamResponse()` (Web Standards — works in both Next.js and Lambda Response Streaming later)
- [ ] All routes: Zod validation, structured JSON logging, proper HTTP status codes
- [ ] Runtime: `export const runtime = 'nodejs'` for parity with future Lambda Node 20

The `app/api/[level]/questions/[id]/route.ts` route from the previous design is removed — the topic page renders question bodies via the repository directly, and the chat handler fetches `solutionSteps` server-side.

## 5. Shared UI Primitives

- [ ] `<MathRenderer />` — splits on `$...$` / `$$...$$`, renders via `react-katex`, error boundary falls back to raw LaTeX
- [ ] `<Button />`, `<Badge />`, `<Card />` — base primitives with Tailwind variants
- [ ] `<Skeleton />` — shimmer loading placeholder
- [ ] `<Select />`, `<SearchInput />` — filter controls

## 6. Frontend: Landing & Browse

- [ ] `/` page — hero + `<LevelChooser />` (two large cards: Higher Level / Ordinary Level)
- [ ] `/[level]` page — topic grid for the chosen level
- [ ] `<TopicGrid />` — responsive grid of topic cards with name, question count (scoped to level), icon
- [ ] Empty states and loading skeletons on landing and level pages

The topic page (`/[level]/topics/[topic]`) is covered in §7, which renders the full question set inline — there is no separate question-list preview page in this design.

## 7. Frontend: Topic Page (Inline Questions)

The topic page renders the topic's full question set inline, ordered by year descending. There is no separate question-detail page.

- [ ] Rewrite `/[level]/topics/[topic]/page.tsx` — Server Component fetches all questions for `(level, topic)` via `getQuestionRepository().getQuestionsByTopic()` and sorts by `year` descending. Each question renders as a `<QuestionCard />`.
- [ ] Drop the year filter and the `?year=` URL plumbing introduced in the prior design — questions are always ordered newest first
- [ ] Remove the now-unused `<QuestionList />` and `<YearFilter />` components and their imports
- [ ] `<QuestionCard />` — always-visible question body via `<MathRenderer />`, year badge, and two stacked accordions underneath
- [ ] Accordion behaviour: "Marking Scheme" and "AI Helper" are mutually exclusive within a card (opening one closes the other); both default closed; opening one card's accordion does not affect any other card
- [ ] `<MarkingSchemePanel />` — renders `markingScheme` LaTeX inside the Marking Scheme accordion. `solutionSteps` is **never** shown to the student — it is server-side context for the AI helper only and must not be sent to the browser
- [ ] Topic page Server Component must include `questionText` + `markingScheme` per question, and must NOT include `solutionSteps` in its serialised output
- [ ] Empty state: if a topic has no questions for the chosen level, show a friendly placeholder instead of an empty page

## 8. Frontend: Chat Panel (AI Helper Accordion)

`<ChatPanel />` lives inside each `<QuestionCard />`'s "AI Helper" accordion. Multiple `<ChatPanel />` instances coexist on a topic page — one per question — each isolated by `questionId`.

- [ ] Zustand store `store/chat.ts` keyed by `questionId` — each card has independent message history and streaming state
- [ ] `sessionId` UUIDv4 persisted in `sessionStorage` per question (key includes `questionId`)
- [ ] Client-side message history only — no server persistence for demo
- [ ] `<ChatPanel />` renders message list + input + send button inside a fixed-height container (~3 user/assistant pairs visible)
- [ ] Internal scroll within the chat panel; outer page scroll is unaffected
- [ ] Auto-scroll the chat to the latest message during streaming; "scroll to latest" affordance only if the user scrolled up mid-stream
- [ ] POST to `/api/[level]/chat/[questionId]` with `{ sessionId, message, history }`
- [ ] Stream response via `Response.body.getReader()`, append chunks to the latest assistant message
- [ ] Render all messages through `<MathRenderer />`
- [ ] Typing indicator during streaming
- [ ] Quick-action buttons: "Give me a hint", "Walk me through the solution"
- [ ] Inline error state with retry; conversation history preserved on failure
- [ ] Opening the AI Helper accordion closes the Marking Scheme accordion on the same card (and vice versa)

## 9. UI Polish & Aesthetic

- [ ] Design pass: consistent spacing, typography hierarchy, WCAG AA colour contrast
- [ ] Dark mode via Tailwind `dark:` classes + system preference detection
- [ ] Smooth transitions on panel toggles, hover states, focus rings
- [ ] Loading skeletons on every async boundary
- [ ] Favicon, `app/icon.tsx`, OG image for share links
- [ ] Responsive testing at 375 / 768 / 1280 / 1920
- [ ] Full keyboard navigation (Enter submits, Esc clears, tab order sensible)

## 10. Smoke Tests

- [ ] Vitest: `MockProvider` hint / solution / generic branches
- [ ] Vitest: `lib/prompt.ts` variable interpolation
- [ ] Vitest: `lib/session.ts` 10-turn truncation
- [ ] Vitest: `LocalJsonRepository` topic-list ordering and not-found handling
- [ ] Vitest: `lib/sanitise.ts` strips injection markers
- [ ] Vitest: topic-page Server Component output excludes `solutionSteps` from any serialised props
- [ ] Manual walkthrough: pick level → pick topic → see all questions in descending year order → open Marking Scheme on a card → open AI Helper on the same card (Marking Scheme should close) → send a chat message and watch the streamed response
- [ ] Run the walkthrough both locally (`pnpm dev`) and against the Vercel preview URL

## 11. Vercel Deployment

User actions (I can't do these for you):

- [ ] Sign up at [vercel.com](https://vercel.com) with your GitHub account — choose the **Hobby** plan (free, sufficient for this demo)
- [ ] Install the **Vercel for GitHub** app and grant access to `clearyj5/maths-app`
- [ ] In the Vercel dashboard: **Add New → Project** → import `clearyj5/maths-app`
- [ ] Accept Vercel's auto-detection (Framework: Next.js, root directory `/`, no overrides needed)
- [ ] No environment variables required — the mock provider has no secrets
- [ ] Click **Deploy**

Post-deployment:

- [ ] Visit the auto-generated `*.vercel.app` URL, confirm the demo loads
- [ ] Verify: every push to `main` auto-deploys to production
- [ ] Verify: opening a PR creates a unique preview URL
- [ ] (Optional, later) Add a custom domain in **Project Settings → Domains**

## 12. Demo Prep

- [ ] Record a short screen capture of the full demo flow
- [ ] Write `DEMO.md` with local dev instructions, production URL, and a list of features to try
- [ ] Share the Vercel URL with stakeholders

---

## Definition of Done (Demo)

A stakeholder can, from a link you send them:

1. Land on the platform and pick Higher or Ordinary level
2. See three topics with question counts
3. Pick any topic and see every question for that topic, ordered newest year first, with LaTeX rendering correctly
4. Open the Marking Scheme accordion under any question to read the official marking scheme
5. Open the AI Helper accordion to ask a contextual question and see a streamed response (opening AI Helper closes Marking Scheme automatically, and vice versa)
6. Click "Give me a hint" → single guided step; "Walk me through the solution" → step-by-step walkthrough
7. Use it comfortably on their phone

---

# Post-Demo: AWS Migration

Once the demo is validated, migrate backend to AWS following `PLAN.md` Phases 1–6. The migration is **wiring, not redesign** — all business logic, UI, schemas, and abstractions carry over unchanged.

## Migration Checklist (Summary)

- [ ] AWS Account Bootstrap — IAM user confirmed, create S3 state bucket `maths-app-terraform-state-531472034878`, create DynamoDB lock table `maths-app-terraform-lock`
- [ ] Terraform modules: `dynamodb`, `lambda`, `api_gateway`, `iam` (see `PLAN.md` §1.3)
- [ ] Implement `DynamoDBRepository` class satisfying the `QuestionRepository` interface
- [ ] Build seed script that writes the same JSON files to the DynamoDB `Questions` table
- [ ] Port each Next.js route handler to a Lambda — wrapper is new, business logic is reused from `lib/` and `repositories/`
- [ ] Add `ChatSessions` persistence to chat Lambda (currently client-side only)
- [ ] Swap repository binding via env var (`DATA_SOURCE=dynamodb`)
- [ ] Update frontend `lib/api.ts` base URL to API Gateway
- [ ] Smoke test end-to-end against AWS `dev` environment
- [ ] Add CloudWatch log retention, error alarms, review Budgets
- [ ] Once stable, decommission the Next.js API route handlers

Full detail in `PLAN.md` Phases 1–6.

---

# Future: Bedrock Activation & Auth

See `PLAN.md` "Future Phase" sections — unchanged from prior plan, triggered when the product is ready for live AI and authenticated users.
