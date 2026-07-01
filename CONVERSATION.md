# Conversation Log — Maths AI Tutor Demo Build

A narrative transcript of the planning + build sessions that produced the `demo-1` branch. User messages preserved verbatim; assistant responses preserved as text content. Tool calls and their raw outputs are noted briefly rather than reproduced — the outcomes live in git history and the committed files.

---

## Phase 1 — Planning

### User

> You are a Senior Full-Stack Engineer specialising in building Ed-Tech Web Applications. The README.md file describes an application that you need to build. Create a plan to get this application production ready, following all of the guidelines in the README.md file. If you need clarification from me on any details, ask me. The plan should be output as a PLAN.md file

### Assistant

Read README.md, drafted a comprehensive PLAN.md covering tech stack, DynamoDB data model, six delivery phases (Foundation, Question Bank, AI Tutor, Auth & Security, Testing, Observability), and listed five open questions before Phase 1 could start:

1. Question data — ready or needs collection pipeline?
2. AWS account — existing or fresh?
3. Authentication — MVP or post-launch?
4. Bedrock — model access granted?
5. IaC tooling — CDK or Terraform?

### User

> To answer the open questions:

(message cut off)

### Assistant

Pointed out the message got cut off mid-sentence and asked for the answers.

### User

> 1. Past exam questions and marking schemes are not ready. For now create dummy data and don't worry about data collection / pipelines, this can be a later task. 2. I have just created an AWS account for this project but that is all. No infrastructure has been created as of yet, the account is completely empty. Preferred region is eu-west-1 as this app will only be used in Ireland for now. 3. Ship unauthenticated first and add this later. 4. Bedrock has not yet been set up, this will need to be requested at a later stage. To keep costs down I only want to start using the models when I have a viable application ready for testing. 5. Terraform should be used for IaC

### Assistant

Updated PLAN.md to reflect all five answers: removed CDK references, replaced with Terraform; deferred auth/Clerk to a future phase; added a `MockProvider`/`BedrockProvider` abstraction with `AI_PROVIDER` env var so live AI activates as a one-line config change; specified `eu-west-1` throughout; locked in dummy-data-only for now with a Zod-validated seed pattern.

### User

> Okay I have changed the approach and installed node using nvm. I now have both v25 and v20 installed, so you will need to use a .nvmrc file to use v20 for this project. Update CLAUDE.md to ensure that the correct version of node is used when working with node in this directory

### Assistant

Created `.nvmrc` containing `20`. Added a standing decision to CLAUDE.md instructing all sessions to run `nvm use` before any `pnpm`/`node`/build command, and to never use Node 25 for this project. Added an `nvm use` line to the top of the Commands section.

### User

> Back to our to-do list - summarize what is left to do now, I have created the IAM user and added the identity to my config. Check all outstanding items and summarize what is remaining before beginning work on building the project

### Assistant

Verified profile + identity (`claude-cli-access` in account `531472034878`, region `eu-west-1`), Node 20 via `.nvmrc`, git repo + remote OK. Flagged that the IAM user lacked `budgets:ViewBudget` and asked which managed policy was attached. Asked whether to commit the staged files or hold off.

### User

> List all of the AWS services that you will need access to so I can scope the access correctly. Also, I already initialized this repository so it should now be a git repo, tell me if this is not the case. I have installed git v2.51.2, Node v25.6.1, pnpm v10.33.2, terraform v1.14.9, and for AWS CLI: aws-cli/2.31.32 Python/3.13.9 Darwin/25.4.0. AWS account ID is 531472034878. Tell me if I need anything else before we start building

### Assistant

Confirmed git repo (despite the stale "false" in initial environment), flagged Node 25 as ahead of Lambda runtime and recommended `nvm use 20`. Listed AWS services in two tiers — demo scope (IAM, S3, DynamoDB, Lambda, API Gateway, CloudWatch Logs, STS) and full-plan scope (Bedrock, Route 53, ACM, SNS, AWS Budgets, Secrets Manager). Flagged that AWS credentials needed configuring as profile `maths-app-dev` and that the existing default profile had expired tokens.

### User

> I have added an 'aws-access-policy.json' file, which outlines all of the permissions I have provided the IAM user. Review these and tell me if anything is missing, if somethign needs to be added provide rationale for why it's needed

### Assistant

Reviewed the policy. Found two blockers:

1. IAM `Resource` patterns restricted role/policy creation to `claude-*` only — would deny creation of Lambda execution roles named `maths-app-*`. Recommended widening to include `arn:aws:iam::*:role/maths-app-*`.
2. DynamoDB allow scoped to `maths-app-*` tables wouldn't cover the planned state-lock table named `terraform-state-lock`. Recommended renaming to `maths-app-terraform-lock`.

Three nice-to-adds: `logs:DeleteLogGroup`, `logs:TagResource`/`UntagResource`, `s3:GetBucketVersioning`. Provided unified diff.

### User

> Yes, apply the edits

### Assistant

Applied the policy edits and renamed the state-lock table reference in TODO.md.

### User

> Why would I need to add the budget constraint? I am on a free-tier plan in AWS so it shouldn't cost anything I thought?

### Assistant

Explained that AWS Free Tier has caveats: DynamoDB on-demand is _not_ free-tier eligible (only provisioned), S3 + API Gateway free tiers expire after 12 months, Bedrock is never free-tier. AWS Budgets itself is free for the first two budgets. Made the case that a $5/month alert is cheap insurance against runaway bugs and the upcoming Bedrock activation, which removes free-tier protection entirely.

### User

> How do I add this?

### Assistant

Walked through the AWS Console steps: Billing and Cost Management → Budgets → use the "Monthly cost budget" template, $5 budget, email alerts at 85% / 100% / 100% forecasted.

### User

> I have created this now - anything else left to do before we start?

### Assistant

Two loose ends. Blocker: confirm the updated `aws-access-policy.json` had been applied to the IAM user in the AWS console (file edit alone wasn't enough). Housekeeping: commit the four pending files (`.nvmrc`, `CLAUDE.md`, `TODO.md`, `aws-access-policy.json`).

### User

> Updated IAM policy has been applied in the console, and yes commit all changes in one commit with message 'Setup for Demo build'

### Assistant

Committed as `237f590 Setup for Demo build`.

### User

> Push this to the remote

### Assistant

Pushed to `origin master`.

### User

> I want to change to use 'main' as the default branch. It is already defined as default in github. Merge all code from 'master' into 'main' and delete the master branch to avoid any confusion. End state should be one 'main' branch, which is the default branch, and contains all of the files

### Assistant

Initially assumed `origin/main` and `origin/master` were identical (both showed the same commit in `git log --all --graph` output). Deleted local `master` and remote `master`. Then realised the histories were unrelated — `origin/main` only had a single GitHub-created `Initial commit` with a `.gitignore`, while my work lived on the now-orphaned `master`. Verified my commits were still reachable in the reflog (`d67f9e6` and `237f590`), then cherry-picked them on top of `main`, preserving GitHub's `.gitignore`. Force-pushed the consolidated history. Acknowledged the misread of `git log --all --graph` and noted I'd verify common ancestry with `git merge-base` before declaring branches identical in future.

### User

> Before starting, explain why pnpm is being used in this project? Are there better options for getting this application production ready as soon as possible?

### Assistant

Honest take: pnpm gives strict dependency isolation and slightly faster installs, but at this project's size the win is marginal. npm workspaces would work identically. Bun is faster but introduces unproven Next.js edge cases.

The bigger question was "what would actually speed up production" — recommended skipping the AWS backend for the demo entirely and shipping a pure Next.js app on Vercel with mock AI in API routes. Estimated 1-2 days vs 1-2 weeks for full AWS scaffolding.

### User

> Speed to demo is most important to me right now. However, I also want to ensure that it will not create more problems later if I drop the AWS backend now.

### Assistant

Walked through what would actually be wasted if we dropped AWS for demo (about 5-10% of plumbing — Terraform setup, mostly) vs what carries over (UI, components, schemas, repository pattern, mock provider, seed data). Identified three abstractions that would make migration trivial:

1. Repository pattern (`QuestionRepository` interface; `LocalJsonRepository` now, `DynamoDBRepository` later)
2. AI provider abstraction (already planned)
3. Pure business logic in `lib/`, thin handlers

One real gotcha: streaming API differences between Next.js, Vercel Edge, and Lambda Response Streaming. Mitigatable by using Web Standards `new Response(readableStream)` everywhere.

Concluded with a 2-3 day demo plan and the explicit point that nothing already done (AWS account, IAM, policy, budget, plan docs) would be wasted.

### User

> Yes, update the TODO.md as described above. Also, if there is anything specific I need to do in Vercel to get this demo live, tell me what I need to do

### Assistant

Rewrote TODO.md into 12 demo sections + a "Post-Demo: AWS Migration" section + a "Future" pointer. Listed Vercel signup steps (Hobby plan, install Vercel for GitHub, import the repo, no env vars needed) and gotchas (10s function timeout on Hobby is fine for the mock provider).

### User

> Commit the changes to TODO.md with message 'Updated plan for demo app'

### Assistant

Committed as `61995d3 Updated plan for demo app`.

### User

> Yes

### Assistant

Pushed.

---

## Phase 2 — Build (§1 through §6)

### User

> Start §1 of the new plan. Use a separate branch in the repo for all of these changes called 'demo-1'

### Assistant — §1 Repository & Tooling

Created branch `demo-1`. Backed up existing docs out of the working tree (create-next-app refused to scaffold over them), ran `pnpm create next-app@latest` which installed Next.js **16.2.4** (not 14 as PLAN.md had referenced — same App Router APIs, forward-compatible). Restored the docs.

Installed runtime deps: `zustand`, `katex`, `react-katex`, `zod`, `clsx`, `lucide-react`. Installed dev deps: `vitest`, testing-library, `jsdom`, `prettier`, `husky`, `lint-staged`.

Configured Prettier (`.prettierrc`, `.prettierignore`), wired Husky pre-commit hook running `lint-staged` — initially failed because the hook didn't have nvm in PATH; fixed by sourcing `$NVM_DIR/nvm.sh` inside the hook.

Swapped Geist font for Inter + JetBrains Mono via `next/font/google`. Imported KaTeX CSS in the root layout. Set app metadata.

Build passed clean. Committed as `612e23c Scaffold Next.js app and tooling (TODO §1)`.

### User

> Is this app testable yet? As in can I run it locally and view it on localhost or is there nothing to view yet

### Assistant

Yes — `pnpm dev` works, but you'd see Next.js's default starter page until §6 replaces it. Listed what the dev server confirmed: Tailwind v4, Inter/JetBrains Mono fonts, KaTeX CSS bundled, TypeScript strict compiles, hot reload.

### User

> Are there any prereqs before starting §2?

### Assistant

Asked five content decisions to avoid iteration: (1) follow LC paper convention or mix freely? (2) difficulty distribution? (3) year range? (4) self-review pass with flags? (5) higher-level only or both?

### User

> 1. Don't track by 'paper'… 2. No need to segregate by 'difficulty'… 3. 2018-2024 is fine for now. 4. Yes do a self-review and remind me to check the maths problems when you have finished §2 entirely. 5. Include both higher and ordinary level questions… Higher and Ordinary level questions should be displayed different pages so that Higher level students can view one set of questions, and Ordinary level students can view another.

### Assistant — §2 Dummy Question Data

Updated PLAN.md and TODO.md schemas first: removed `paper` and `difficulty`, added `level` (`higher` | `ordinary`), updated DynamoDB PK to `LEVEL#<level>#TOPIC#<topicSlug>`, restructured frontend routes under `/[level]/...`.

Authored 22 dummy questions in `data/questions/<level>/<topic>/`:

- 8 trigonometry (4 HL + 4 OL): cosine rule, trig equations, double-angle proof, periodic modelling (HL); SOHCAHTOA, area formula, sine rule, exact values (OL)
- 8 calculus (4 HL + 4 OL): product rule, integration by substitution, limits, related rates (HL); power rule, tangent line, definite integral, stationary points (OL)
- 6 algebra (3 HL + 3 OL): complex numbers + De Moivre, log equation with domain check, geometric series (HL); quadratic factoring, arithmetic sequence, log laws (OL)

Authored `data/questions/README.md` documenting the schema as the contract for future real-data imports. All 22 JSONs validated. Self-reviewed every question for mathematical correctness — all checked out. Flagged six representative questions to spot-check before declaring §2 done.

Committed as `b52b54e Add 22 dummy questions + schema docs (TODO §2)`.

### User

> Continue to §3

### Assistant — §3 Schemas & Abstractions

Built the abstraction layer that makes AWS migration mechanical:

- `schemas/question.ts` — Zod schemas for `Level`, `Topic`, `Question`, `QuestionSummary`, `TopicSummary`, `QuestionFilters`
- `schemas/chat.ts` — `ChatRole`, `ChatMessage`, `ChatRequest`
- `shared/types.ts` — TypeScript types via `z.infer`
- `repositories/question-repository.ts` — `QuestionRepository` interface; every method scoped to `level` so HL/OL never mix
- `repositories/local-json.ts` — `LocalJsonRepository` reading bundled JSON with Zod validation, in-memory cache
- `repositories/index.ts` — factory keyed on `DATA_SOURCE` env (default `local-json`; `dynamodb` throws pending migration)
- `providers/ai-provider.ts` — `AIProvider` interface using structured `PromptContext`, not raw string
- `providers/mock.ts` — `MockProvider` with three branches (hint / solution / generic), word-by-word streaming with 30ms delays
- `providers/bedrock.ts` — stub that throws clearly
- `providers/index.ts` — factory keyed on `AI_PROVIDER` env (default `mock`)
- `lib/prompt.ts`, `lib/session.ts`, `lib/sanitise.ts` — pure utilities
- `next.config.ts` — `outputFileTracingIncludes` so `data/questions/**/*.json` ships with serverless functions on Vercel

Build passed under TypeScript strict. Committed as `2d21871 Add schemas, repository, AI provider, and lib utilities (TODO §3)`.

### User

> Explain what the 'Zod schemas' are for

### Assistant

Explained Zod as TypeScript-first runtime validation: TypeScript types are erased at compile time, so anything crossing a system boundary (JSON files, API request bodies, future DynamoDB items) is unsafe without runtime checks. Walked through four uses in this project:

1. Source of truth for shapes — Zod schema + `z.infer` gives runtime validation AND compile-time types from one declaration
2. Validates question JSON at load — typo like `"level": "higherr"` fails at startup with a clear error
3. Validates API inputs (§4) — invalid bodies get 400 with Zod's issue details
4. Future real-data contract — the same schemas validate any imported real content

Concrete payoff: silent data bugs become loud, fail-fast errors with file/field-level precision.

### User

> Okay, continue with §4

### Assistant — §4 Next.js API Routes

Read Next.js 16 route handler docs first (AGENTS.md flagged breaking changes). Confirmed `params` is now a Promise, handlers use Web `Request`/`Response`, and there's a new `RouteContext<'/path/[id]'>` type helper.

Built four routes under `app/api/[level]/...`:

- `GET /api/[level]/topics`
- `GET /api/[level]/topics/[topic]/questions` (with `?year` filter)
- `GET /api/[level]/questions/[id]` (with `?includeSolution=true` gating)
- `POST /api/[level]/chat/[questionId]` (streaming via `new Response(readableStream)`)

Added `lib/api.ts` (jsonResponse, errorResponse, parseOrError, randomRequestId) and `lib/log.ts` (structured JSON logger).

Hit a TypeScript conflict: my `log()` helper had `level` as a severity field, which collided with the maths-app `level` (higher/ordinary) when passed to a log call. Renamed the log severity field to `severity`. Caught by the build — confirmation that strict mode is paying off.

Smoke-tested every route with curl: topics counts correct, year filter narrows to a single question, solution gating works, 404 for unknown id, 400 with Zod issue details for malformed bodies, streaming chat returns hint vs full solution based on user message. Committed as `095c277 Add Next.js API routes for topics, questions, and streaming chat (TODO §4)`.

### User

> Give me instructions to test the backend server

### Assistant

Wrote a copy-pasteable test script: dev server start, install jq, four GET examples, three streaming POST examples, error-case tests, server log inspection, server stop. Listed the four routes in a quick reference table.

### User

(Hit a zsh paste issue — backslash line continuations didn't survive paste.)

> jack.cleary@... -d ... command not found …

### Assistant

Diagnosed the paste/zsh issue: zsh is strict about no trailing whitespace after `\`, which often gets stripped when pasting from formatted markdown. Provided one-liner versions of each curl command + parenthesised multi-line versions + a heredoc alternative for the JSON body.

### User

> Go §5

### Assistant — §5 Shared UI Primitives

Built the UI primitives in `components/` and `components/ui/`:

- `MathRenderer` — splits text on `$...$` (inline) and `$$...$$` (block), renders via `react-katex` with `renderError` falling back to red-tinted inline code. Also handles `**bold**` so chat step headings render without a full markdown dependency.
- `lib/math.ts` — pure `splitMath` helper for unit testing in §10
- `Button` — 4 variants (primary/secondary/ghost/outline) × 3 sizes (sm/md/lg)
- `Badge` — default/higher/ordinary/year/subtle variants
- `Card` + `CardHeader` + `CardTitle` + `CardDescription` with optional `interactive` prop
- `Skeleton` — animate-pulse placeholder
- `Select` and `SearchInput` — labelled, lucide-iconified, accessible

Added `@types/react-katex`. Created a temporary `/ui-preview` route showcasing every primitive (will be removed in §9 polish). Build passed. Committed as `908c990 Add shared UI primitives… (TODO §5)`.

### User

> §6 go

### Assistant — §6 Landing & Browse

Built three pages and three new components:

- `/` — hero + `<LevelChooser />` (two large cards for Higher / Ordinary)
- `/[level]` — `<TopicGrid />` with topic-specific lucide icons (Sigma for trig, Calculator for calculus, Variable for algebra)
- `/[level]/topics/[topic]` — `<QuestionList />` + `<YearFilter />` (client component using `useRouter` + `useSearchParams` so filter state is in the URL)

Server Components fetch directly from `getQuestionRepository()` for zero localhost round-trips. Invalid level/topic resolves to 404 via `next/navigation`'s `notFound()`. Empty filter state shows a friendly dashed-border placeholder.

Smoke-tested: `/` → level chooser, `/higher` → 3 topics, `/higher/topics/calculus` → 4 questions, `?year=2022` → single question, `/nonsense` → 404.

Committed as `4649ba3 Add landing, topic grid, and question list pages (TODO §6)`.

### User

> When I view the app locally I get this error: ## Error Type
> Console Error
>
> ## Error Message
>
> In HTML, <div> cannot be a descendant of <p>.
> This will cause a hydration error.
>
> [stack trace showing CardDescription → p → MathRenderer → div]

### Assistant

Diagnosed: `CardDescription` renders `<p>`; `MathRenderer`'s outer was `<div>`. Browsers auto-close `<p>` before nested `<div>` starts, producing a server/client DOM mismatch.

Two complementary fixes:

1. `MathRenderer` root changed from `<div>` to `<span style={{display: 'block'}}>`. `<span>` is always valid inside `<p>`; `display: block` keeps the visual layout.
2. `QuestionList` swapped `CardDescription` for a plain `<div>` — a question preview with block math isn't really paragraph content, so a semantic win on top of the fix.

Committed as `b48ffc5 Fix hydration error by making MathRenderer valid inside a <p>`.

---

## Branch state at end of session

`demo-1` is seven commits deep:

```
b48ffc5 Fix hydration error by making MathRenderer valid inside a <p>
4649ba3 Add landing, topic grid, and question list pages (TODO §6)
908c990 Add shared UI primitives… (TODO §5)
095c277 Add Next.js API routes for topics, questions, and streaming chat (TODO §4)
2d21871 Add schemas, repository, AI provider, and lib utilities (TODO §3)
b52b54e Add 22 dummy questions + schema docs (TODO §2)
612e23c Scaffold Next.js app and tooling (TODO §1)
```

`main` remains at `61995d3 Updated plan for demo app` (the demo plan rewrite). `demo-1` has not been pushed to `origin`.

## Standing decisions captured during the conversation

These are repeated in `CLAUDE.md` so future Claude sessions enforce them automatically:

1. Terraform, not CDK
2. AWS region `eu-west-1` only
3. MVP ships unauthenticated; auth (Clerk) is a deferred future phase
4. Bedrock is deferred — `MockProvider` is the default until activation
5. Dummy data only — no real exam-question scraping
6. DynamoDB partition key `LEVEL#<level>#TOPIC#<topic>` (compound)
7. Serverless-only — no EC2, ECS, RDS, or any long-lived compute
8. Node 20 pinned via `.nvmrc`; never use Node 25 for this project

## Architectural conventions also captured

- AI provider abstraction via `AI_PROVIDER` env var (mock/bedrock)
- Repository abstraction via `DATA_SOURCE` env var (local-json/dynamodb)
- LaTeX always rendered through `<MathRenderer />` with error-boundary fallback
- User input sanitised in chat handler before prompt interpolation
- Zod validation at every system boundary (JSON load, API input)
- Structured JSON logging (`{severity, route, requestId, durationMs, ...}`)
- Pure business logic in `lib/`, thin handlers everywhere

## Outstanding before demo ships

- §7 — Question page (two-column layout, solution panel, chat panel placement)
- §8 — Chat panel (Zustand store, sessionStorage, streaming consumer, quick-action buttons)
- §9 — UI polish (dark mode tweaks, transitions, OG image, responsive testing)
- §10 — Smoke tests (Vitest unit tests, manual Playwright walkthrough)
- §11 — Vercel deployment (your manual steps; auto-deploys after that)
- §12 — Demo prep (screen capture, DEMO.md)

## User-side action items still pending

- Spot-check a sample of the 22 dummy questions for mathematical correctness (six were flagged as representatives)
- Vercel signup + repo import (only blocks public hosting; demo runs locally without it)
- Review the level + topic split visually once §7 lands
