# TODO — Demo Milestone

Goal: a clickable, end-to-end demo with dummy questions by topic, a mock AI chat per question, the production data format locked in, and a polished UI. Aligns with `PLAN.md` Phases 1–3.

**Out of scope for this list**: authentication, real Bedrock calls, full test coverage, load testing, production CloudWatch alarms, custom domain. These come later.

---

## 1. Repository & Tooling

- [ ] Initialise `pnpm` workspaces with `apps/*`, `lambdas/*`, `shared/*`
- [ ] Configure root `tsconfig.base.json` with strict mode; per-package `tsconfig.json` extends it
- [ ] Add ESLint (typescript-eslint, next, react) + Prettier + shared config
- [ ] Add Husky + lint-staged pre-commit hook (lint + type-check staged files)
- [ ] Add `.gitignore` covering `node_modules/`, `.next/`, `.env*`, `*.tfstate*`, `cdk.out`, `.DS_Store`
- [ ] Add `.nvmrc` pinning Node 20
- [ ] Create `shared/types.ts` for cross-package types (Question, ChatMessage, etc.)

## 2. AWS Account Bootstrap (one-time, manual)

- [ ] Create IAM user `maths-app-terraform` with programmatic access in `eu-west-1`
- [ ] Attach least-privilege policy (DynamoDB, Lambda, API Gateway, IAM, CloudWatch Logs, S3 for state)
- [ ] Create S3 bucket `maths-app-terraform-state-<account-id>` with versioning enabled
- [ ] Create DynamoDB table `maths-app-terraform-lock` (PK `LockID` string)
- [ ] Store AWS access key in GitHub Actions repo secrets
- [ ] Store AWS credentials locally in `~/.aws/credentials` profile `maths-app-dev`

## 3. Terraform Infrastructure

- [ ] Set up `infra/` with `modules/` and `environments/{dev,prod}/`
- [ ] Configure S3 remote backend + DynamoDB state locking in `environments/dev/backend.tf`
- [ ] Write `modules/dynamodb/` creating `Questions` (with GSI1) and `ChatSessions` (with TTL) tables
- [ ] Write `modules/lambda/` wrapping a Lambda function + CloudWatch log group + env vars
- [ ] Write `modules/iam/` producing least-privilege execution roles per function
- [ ] Write `modules/api_gateway/` creating REST API, CORS, usage plan, API key
- [ ] Wire everything together in `environments/dev/main.tf`
- [ ] Run `terraform init && terraform apply` and confirm all resources exist in `eu-west-1`

## 4. Dummy Question Data

- [ ] Define Zod schema for a Question in `shared/schemas/question.ts`
- [ ] Author **8 trigonometry** questions in `data/questions/trigonometry/*.json` (sine rule, cosine rule, unit circle, identities)
- [ ] Author **8 calculus** questions in `data/questions/calculus/*.json` (differentiation, integration, limits, related rates)
- [ ] Author **6 algebra** questions in `data/questions/algebra/*.json` (quadratics, sequences, logs, complex numbers)
- [ ] Each question includes: `questionId`, `topic`, `subtopic`, `year`, `paper`, `difficulty`, `questionText` (LaTeX), `markingScheme` (LaTeX), `solutionSteps` (array)
- [ ] Ensure questions are clearly fictional (no impersonation of the State Examinations Commission)
- [ ] Add `data/questions/README.md` documenting the schema for future real-data work

## 5. Seed Script

- [ ] Implement `scripts/seed.ts` that reads all JSON files and validates with Zod
- [ ] Use `BatchWriteItem` to seed `Questions` table; derive `PK`/`SK`/`GSI1PK` from JSON fields
- [ ] Make the script idempotent — safe to re-run
- [ ] Print a summary on exit: counts per topic, any validation failures
- [ ] Add `pnpm seed` script at repo root

## 6. Lambda: Questions API

- [ ] `lambdas/get-topics/` — returns `[{ slug, label, questionCount }]` for all topics
- [ ] `lambdas/get-questions/` — queries `TOPIC#<topic>` partition; supports `?year`, `?paper`, `?difficulty`
- [ ] `lambdas/get-question/` — `GetItem` by `questionId`; gates `solutionSteps` behind `?includeSolution=true`
- [ ] Each handler: Zod input validation, structured JSON logging, typed response
- [ ] Package Lambdas with esbuild (single-file bundle, tree-shaken, no AWS SDK bundled since it's in runtime)

## 7. Lambda: Chat with Mock AI Provider

- [ ] Define `AIProvider` interface (`streamResponse(prompt): AsyncIterable<string>`)
- [ ] Implement `MockProvider` in `lambdas/chat/providers/mock.ts`
  - [ ] Branch on user message: "hint" → single step from `solutionSteps[0]`
  - [ ] Branch on "solution"/"answer" → stream all `solutionSteps` with delays
  - [ ] Otherwise → Socratic question referencing the question's topic/subtopic
  - [ ] Simulate streaming with `setTimeout` between chunks (~30ms per word)
- [ ] Stub `BedrockProvider` in `lambdas/chat/providers/bedrock.ts` with `throw new Error('not implemented')`
- [ ] Implement `getAIProvider(name)` factory reading from `AI_PROVIDER` env var (defaults to `mock`)
- [ ] Implement `POST /questions/{questionId}/chat` handler:
  - [ ] Validate body `{ sessionId, message }` with Zod (message max 2000 chars)
  - [ ] Sanitise user message (strip `---`, `System:`, `<instruction>`, etc.)
  - [ ] Fetch question + last 10 session messages from DynamoDB
  - [ ] Build prompt per `PLAN.md` §3.4 (even for mock — keeps prompt logic testable)
  - [ ] Persist user message to `ChatSessions`
  - [ ] Stream provider response back via Lambda Response Streaming
  - [ ] Persist assembled assistant response to `ChatSessions`
- [ ] Deploy chat Lambda via Terraform with `AI_PROVIDER=mock`

## 8. Next.js Frontend Scaffolding

- [ ] Bootstrap `apps/web/` with `create-next-app` (App Router, TypeScript, Tailwind, ESLint)
- [ ] Configure Tailwind with a design-token theme: colours, typography scale, spacing, radius
- [ ] Install `zustand`, `react-katex`, `katex` (CSS), `zod`, `clsx`, `lucide-react` (icons)
- [ ] Add `lib/api.ts` — typed fetch wrappers around the four API Gateway endpoints
- [ ] Add `.env.local` with `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_API_KEY`
- [ ] Import `katex/dist/katex.min.css` in the root layout
- [ ] Configure app-wide font (Inter or similar) via `next/font`

## 9. Shared UI Primitives

- [ ] `<MathRenderer />` — splits text on `$...$` / `$$...$$`, renders via `react-katex`, wraps in error boundary that falls back to raw LaTeX
- [ ] `<Button />`, `<Badge />`, `<Card />` — base primitives with Tailwind variants
- [ ] `<Skeleton />` — loading placeholder with shimmer animation
- [ ] `<Select />`, `<SearchInput />` — filter controls

## 10. Frontend: Landing & Browse

- [ ] `/` page — hero section explaining the platform + `<TopicGrid />`
- [ ] `<TopicGrid />` — responsive grid of topic cards (name, question count, icon, short description)
- [ ] `/topics/[topic]` page — header with topic name + `<QuestionList />` with filter controls
- [ ] `<QuestionList />` — card per question showing year, paper, difficulty badges, and a truncated preview
- [ ] Filter controls for year / paper / difficulty with URL state persistence (`useSearchParams`)
- [ ] Empty states and loading skeletons for both pages

## 11. Frontend: Question Page

- [ ] `/questions/[questionId]` page — Server Component fetches question metadata
- [ ] Two-column layout on desktop: `<QuestionViewer />` left, `<ChatPanel />` right
- [ ] Stacked single-column layout on mobile with tab switcher (Question / Chat / Solution)
- [ ] `<QuestionViewer />` — renders `questionText` via `<MathRenderer />`, shows metadata badges
- [ ] `<SolutionPanel />` — collapsible toggle; reveals `solutionSteps` (numbered) and `markingScheme`
- [ ] Each step has an "Explain this step" button that pre-fills and submits the chat

## 12. Frontend: Chat Panel

- [ ] Zustand store `store/chat.ts` keyed by `questionId` (switching questions resets state cleanly)
- [ ] `sessionId` generated client-side (UUID v4), persisted in `sessionStorage` per question
- [ ] `<ChatPanel />` renders message list + input + send button
- [ ] Stream response via `Response.body.getReader()`, append chunks to the latest assistant message
- [ ] Typing indicator (animated dots) while streaming
- [ ] Quick-action buttons: "Give me a hint", "Walk me through the solution"
- [ ] Render all messages through `<MathRenderer />` so LaTeX in replies displays correctly
- [ ] Graceful error state if the chat endpoint fails (inline retry, conversation preserved)
- [ ] Auto-scroll to bottom on new message, with "scroll to latest" button if user scrolled up

## 13. UI Polish & Aesthetic

- [ ] Final design pass: consistent spacing, typography hierarchy, colour contrast (WCAG AA minimum)
- [ ] Dark mode support via Tailwind `dark:` classes + system preference detection
- [ ] Smooth transitions on panel toggles, hover states, focus rings
- [ ] Loading skeletons on every async boundary
- [ ] Favicon, `app/icon.tsx`, and OG image
- [ ] Responsive testing at 375px / 768px / 1280px / 1920px
- [ ] Keyboard navigation works for topic grid, question list, chat (Enter submits, Esc clears)

## 14. Smoke Tests & Demo Prep

- [ ] Vitest smoke test on `MockProvider` covering hint / solution / generic branches
- [ ] Vitest smoke test on prompt-construction logic
- [ ] Playwright smoke test: browse → pick question → LaTeX renders → send chat → streamed reply appears → toggle solution
- [ ] `pnpm dev` works end-to-end against deployed `dev` API
- [ ] Record a short screen capture of the demo flow (for stakeholder review)
- [ ] Write a short `DEMO.md` explaining how to run the demo locally and what to click

---

## Definition of Done

The demo is complete when a stakeholder can, from a fresh machine:

1. Clone the repo and run `pnpm install && pnpm dev`
2. Open the landing page and see three topics with question counts
3. Pick any topic, filter by year/difficulty, open a question
4. See the question rendered with proper LaTeX
5. Ask the AI tutor a question and see a streamed, contextual response
6. Click "Give me a hint" and see a single guided step
7. Toggle the solution panel and click "Explain this step" — chat responds in context
8. Browse on a phone and have a comparable experience
