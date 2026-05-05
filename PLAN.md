# Maths AI Tutor — Production Plan

## Overview

An AI-assisted Leaving Certificate Maths exam preparation platform. Students browse past exam questions by topic, interact with a context-aware AI tutor per question, and toggle full solutions and marking schemes.

**Agreed decisions:**

- Question data: dummy seed data for now; real content import is a future task
- AWS: fresh account, region `eu-west-1`
- Auth: deferred — ship unauthenticated first
- Bedrock: deferred — mock AI provider used until the app is ready for live testing
- IaC: Terraform

---

## Tech Stack

| Layer              | Technology                         | Rationale                                                                             |
| ------------------ | ---------------------------------- | ------------------------------------------------------------------------------------- |
| Frontend framework | Next.js 14 (App Router)            | SSR/SSG for SEO + fast initial load                                                   |
| Styling            | Tailwind CSS                       | Utility-first, consistent with component-driven architecture                          |
| State management   | Zustand                            | Minimal boilerplate, supports per-question chat state isolation                       |
| Math rendering     | KaTeX                              | Faster than MathJax, React-friendly, sufficient for Leaving Cert notation             |
| Backend compute    | AWS Lambda (Node.js 20)            | Serverless, auto-scaling                                                              |
| API layer          | Amazon API Gateway (REST)          | Lambda proxy integration; supports rate limiting and usage plans                      |
| Database           | Amazon DynamoDB                    | High-throughput, low-latency reads; fits question-lookup and session-storage patterns |
| AI provider (MVP)  | Mock provider                      | Deterministic streaming responses; zero cost; swappable via env var                   |
| AI provider (live) | Amazon Bedrock — Claude 3.5 Sonnet | Activated in a dedicated future phase once the app is viable                          |
| Auth               | Deferred — Clerk (planned)         | Added post-MVP                                                                        |
| IaC                | Terraform                          | Declarative, state-managed AWS provisioning                                           |
| CI/CD              | GitHub Actions                     | Lint/test on PR; Terraform apply + Vercel deploy on merge to `main`                   |
| Hosting (frontend) | Vercel                             | Zero-config Next.js deployment; preview deployments per PR                            |
| Monitoring         | AWS CloudWatch + Sentry            | Lambda metrics and logs; frontend error tracking                                      |

---

## DynamoDB Data Model

### Table: `Questions`

| Attribute       | Type   | Description                                           |
| --------------- | ------ | ----------------------------------------------------- |
| `PK`            | String | `LEVEL#<level>#TOPIC#<topicSlug>`                     |
| `SK`            | String | `QUESTION#<questionId>`                               |
| `questionId`    | String | UUID                                                  |
| `level`         | String | `higher` or `ordinary`                                |
| `topic`         | String | e.g. `trigonometry`                                   |
| `subtopic`      | String | e.g. `sine-rule`                                      |
| `year`          | Number | e.g. `2023`                                           |
| `questionText`  | String | LaTeX-formatted question body                         |
| `markingScheme` | String | LaTeX-formatted marking scheme                        |
| `solutionSteps` | List   | Array of ordered step objects `{ step, explanation }` |
| `GSI1PK`        | String | `YEAR#<year>` (GSI for year-based browsing)           |

Partition key compounds level and topic so a single DynamoDB `Query` serves the primary UI flow ("browse all HL Trigonometry questions"). Level must be chosen before a student sees topics; it is never mixed in a single list.

### Table: `ChatSessions`

| Attribute    | Type   | Description                                 |
| ------------ | ------ | ------------------------------------------- |
| `PK`         | String | `SESSION#<sessionId>`                       |
| `SK`         | String | `MSG#<timestamp>#<msgId>`                   |
| `questionId` | String | Foreign key to Questions table              |
| `role`       | String | `user` or `assistant`                       |
| `content`    | String | Message content                             |
| `ttl`        | Number | Unix epoch — sessions expire after 24 hours |

---

## Phase 1 — Foundation (Week 1–2)

### 1.1 Repository & Tooling Setup

Initialise monorepo structure:

```
/
├── apps/
│   └── web/          # Next.js frontend
├── infra/            # Terraform root
│   ├── modules/
│   │   ├── dynamodb/
│   │   ├── lambda/
│   │   ├── api_gateway/
│   │   └── iam/
│   └── environments/
│       ├── dev/
│       └── prod/
├── lambdas/          # Lambda function source
│   ├── get-topics/
│   ├── get-questions/
│   ├── get-question/
│   └── chat/
├── data/             # Dummy seed JSON
│   └── questions/
│       ├── trigonometry/
│       ├── calculus/
│       └── algebra/
├── scripts/
│   └── seed.ts       # DynamoDB seeder
└── .github/
    └── workflows/
        ├── ci.yml
        ├── deploy-infra.yml
        └── deploy-web.yml
```

- Configure `pnpm` workspaces
- ESLint + Prettier + Husky pre-commit hooks
- TypeScript strict mode in `apps/web` and `lambdas/`

### 1.2 AWS Account Bootstrap

Before Terraform can manage state, run these steps once manually:

1. Create an S3 bucket for Terraform remote state: `maths-app-terraform-state-<account-id>` in `eu-west-1`
2. Create a DynamoDB table for state locking: `terraform-state-lock`
3. Create an IAM user with programmatic access and attach least-privilege policies for the resources Terraform will manage; store credentials in GitHub Actions secrets (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)

### 1.3 Terraform Infrastructure

**`infra/modules/dynamodb/`**

- `Questions` table: partition key `PK` (String), sort key `SK` (String)
- GSI `GSI1`: partition key `GSI1PK`, sort key `SK`
- `ChatSessions` table: partition key `PK`, sort key `SK`; TTL attribute `ttl`
- Both tables: on-demand billing, point-in-time recovery enabled

**`infra/modules/api_gateway/`**

- REST API with proxy resources for each Lambda route
- Usage plan: 500 RPM on question endpoints, 100 RPM on `/chat`
- API key required (passed as `x-api-key` header from frontend — unauthenticated but rate-limited)
- CORS enabled for Vercel preview and production origins

**`infra/modules/lambda/`**

- One module instance per function; wires IAM role, CloudWatch log group, and API Gateway integration
- Node.js 20 runtime, `eu-west-1`
- Environment variables injected via `aws_lambda_function` resource (table names, region, `AI_PROVIDER`)

**`infra/modules/iam/`**

- Per-function execution roles with least-privilege policies
- Questions Lambdas: `dynamodb:GetItem`, `dynamodb:Query` on `Questions` table
- Chat Lambda: above + `dynamodb:PutItem`, `dynamodb:Query` on `ChatSessions`; `bedrock:InvokeModelWithResponseStream` (inactive until Bedrock phase)

**`infra/environments/dev/` and `prod/`**

- Separate `terraform.tfvars` per environment
- `dev` uses shorter TTLs and lower rate limits

### 1.4 CI/CD Pipelines

**`ci.yml`** — triggers on every PR:

- Lint and type-check (`apps/web`, `lambdas/`)
- Unit tests (Vitest)
- `terraform fmt --check` and `terraform validate`

**`deploy-infra.yml`** — triggers on merge to `main`:

- `terraform plan` then `terraform apply -auto-approve` against `dev` environment
- Manual workflow dispatch targets `prod`

**`deploy-web.yml`** — Vercel handles automatically on push; this workflow just sets required env vars

---

## Phase 2 — Question Bank (Week 3–4)

### 2.1 Dummy Seed Data

Create realistic LaTeX-formatted dummy questions across three topics, sufficient to exercise all UI states:

**Topics and question counts:**

- `trigonometry` — 8 questions (sine rule, cosine rule, unit circle, identities)
- `calculus` — 8 questions (differentiation, integration, limits, related rates)
- `algebra` — 6 questions (quadratics, sequences, logs, complex numbers)

**JSON structure per question file** (`data/questions/<topic>/<questionId>.json`):

```json
{
  "questionId": "uuid",
  "topic": "trigonometry",
  "subtopic": "cosine-rule",
  "year": 2022,
  "paper": "P2",
  "difficulty": "medium",
  "questionText": "In triangle $ABC$, $a = 7$, $b = 5$, and $C = 52°$. Find the length of side $c$, correct to two decimal places.",
  "markingScheme": "Applying the cosine rule: $c^2 = a^2 + b^2 - 2ab\\cos C$ **(3 marks)**\\n$c^2 = 49 + 25 - 70\\cos(52°)$ **(2 marks)**\\n$c \\approx 5.59$ **(1 mark)**",
  "solutionSteps": [
    {
      "step": "Identify the formula",
      "explanation": "Use the cosine rule: $c^2 = a^2 + b^2 - 2ab\\cos C$"
    },
    {
      "step": "Substitute values",
      "explanation": "$c^2 = 7^2 + 5^2 - 2(7)(5)\\cos(52°) = 49 + 25 - 70\\cos(52°)$"
    },
    { "step": "Evaluate", "explanation": "$c^2 \\approx 74 - 43.08 = 30.92$, so $c \\approx 5.56$" }
  ]
}
```

**Seed script** (`scripts/seed.ts`):

- Reads all JSON files from `data/questions/`
- Validates each against a Zod schema
- Batch-writes to DynamoDB `Questions` table using `BatchWriteItem`
- Idempotent — safe to re-run (overwrites existing items)
- Logs a summary: topics seeded, questions per topic, any validation errors

### 2.2 Questions Lambda Functions

**`GET /topics`**

- Scans for distinct `PK` prefixes or reads from a hardcoded topic registry
- Returns: `[{ slug, label, questionCount }]`
- API Gateway response caching: 5-minute TTL

**`GET /topics/{topic}/questions`**

- Queries `LEVEL#<level>#TOPIC#<topic>` partition
- Optional query param: `?year=`
- Returns the full question set including `questionText` and `markingScheme`. **Never** returns `solutionSteps` — that field is server-only and used by the chat Lambda.

There is no `GET /questions/{questionId}` Lambda. The topic page renders questions inline, and the chat Lambda fetches `solutionSteps` directly from DynamoDB.

All handlers: Zod input validation, structured error responses (`{ error, code }`), structured JSON logs.

### 2.3 Frontend — Browse & Tutor

**Pages:**

- `/` — Level chooser (Higher Level / Ordinary Level) + brief platform description
- `/[level]` — Topic grid for the selected level (`level` is `higher` or `ordinary`)
- `/[level]/topics/[topic]` — All questions for that topic rendered inline in descending year order, each with its own marking scheme and AI helper accordions

Level is a required URL segment for any question-browsing route. Students pick their level on the landing page and that choice is encoded in the URL going forward; there is no global toggle. This keeps HL and OL question banks fully segregated.

Browsing and tutoring share a single page. There is no separate question-detail route — once a student picks a topic, every question in that topic is on screen, with the marking scheme and AI helper available per question.

**Components:**

`<LevelChooser />` — Two large cards on the landing page: Higher Level and Ordinary Level. Each links to `/[level]`.

`<TopicGrid />` — Grid of topic cards; each shows topic name, question count (scoped to the current level), and a representative icon. Links to `/[level]/topics/[topic]`.

`<QuestionList />` — Renders the full set of questions for a topic in descending year order. Each entry is a `<QuestionCard />`.

`<QuestionCard />` — Always-visible question body via `<MathRenderer />` plus a year badge. Underneath, two stacked accordions: "Marking Scheme" and "AI Helper". Only one accordion may be open per card at a time; both default closed.

`<MarkingSchemePanel />` — Inside the "Marking Scheme" accordion. Renders `markingScheme` LaTeX. `solutionSteps` is **not** shown to the student — it is private context for the AI helper only.

`<ChatPanel />` — Inside the "AI Helper" accordion. Fixed visible height showing roughly three message exchanges with internal scroll; auto-scrolls to the latest message. State is isolated per `questionId`.

`<MathRenderer />` — Splits text on `$...$` and `$$...$$` delimiters; renders math segments via `react-katex`; wraps in an error boundary to display raw LaTeX on parse failure.

**Data fetching:** Next.js Server Components fetch the topic's full question set (including `markingScheme`) directly via `getQuestionRepository()`. `solutionSteps` is never serialised to the browser — the chat API route fetches it server-side per request to ground the AI helper's responses. Chat interactions are otherwise client-side only.

---

## Phase 3 — AI Tutor with Mock Provider (Week 5–6)

### 3.1 AI Provider Abstraction

The chat Lambda resolves its AI provider from the `AI_PROVIDER` environment variable. This keeps Bedrock activation a one-line config change later.

```typescript
// lambdas/chat/providers/index.ts
export function getAIProvider(name: string): AIProvider {
  if (name === 'bedrock') return new BedrockProvider();
  return new MockProvider();
}

interface AIProvider {
  streamResponse(prompt: Prompt): AsyncIterable<string>;
}
```

### 3.2 Mock Provider

`MockProvider` returns a deterministic, realistic streaming response without calling any external service. It simulates streaming by chunking a pre-written response with small delays.

Behaviour:

- If the user message contains "hint" → returns a single-step hint based on `solutionSteps[0]`
- If the user message contains "solution" or "answer" → streams all `solutionSteps` one by one
- Otherwise → returns a Socratic question referencing the question topic

This allows the full end-to-end UX (streaming tokens, conversation history, "explain this step" buttons) to be built and tested at zero cost.

### 3.3 Chat Lambda: `POST /questions/{questionId}/chat`

Flow:

1. Validate request body: `{ sessionId: string, message: string }` (Zod; max 2000 chars)
2. Strip prompt-injection patterns from `message` (`---`, `System:`, `<instruction>`, etc.)
3. Fetch last 10 messages from `ChatSessions` for this `sessionId`
4. Fetch question, `markingScheme`, and `solutionSteps` from `Questions`
5. Construct prompt (see §3.4)
6. Persist user message to `ChatSessions`
7. Call `provider.streamResponse(prompt)` and stream chunks back via Lambda Response Streaming
8. Persist assembled assistant response to `ChatSessions`

### 3.4 Prompt Template

```
System:
You are an expert Leaving Certificate Maths tutor. Guide students using the Socratic
method — ask leading questions, provide hints, and explain reasoning. Do NOT give away
full solutions unless explicitly asked.

You have access to the following context for this problem only. Do not answer questions
outside this context.

--- QUESTION ---
{questionText}

--- MARKING SCHEME ---
{markingScheme}

--- SOLUTION STEPS ---
{solutionSteps}
---

Rules:
- Respond in structured steps when explaining a process
- For hints: give one step of guidance only, not the full solution
- For full solutions: walk through solution steps one at a time
- For unrelated questions: politely redirect the student
- Use LaTeX for all mathematical expressions (e.g. \frac{1}{2}, \sin\theta)

Conversation history:
{priorMessages}

Student: {userMessage}
Tutor:
```

### 3.5 Context Window Management

- Cap conversation history at 10 turns (5 user + 5 assistant); drop oldest pair when exceeded
- Always preserve system prompt context in full
- If total estimated tokens approach model limit: truncate `solutionSteps` to step headings only

### 3.6 Chat UI Component

**`<ChatPanel />`**

- Lives inside each `<QuestionCard />`'s "AI Helper" accordion — multiple chat panels coexist on a topic page, one per question
- Isolated Zustand slice keyed by `questionId` — every card has its own independent chat history
- `sessionId` UUIDv4 persisted in `sessionStorage` per `questionId`
- Sends `POST /questions/{questionId}/chat` with `{ sessionId, message, history }`
- Reads response as `ReadableStream`, appends chunks to the latest assistant message in state
- Renders each message through `<MathRenderer />` so LaTeX in responses renders correctly
- Shows typing indicator (animated ellipsis) while streaming
- Fixed visible height showing roughly three user/assistant pairs; internal scroll; auto-scrolls to the latest message
- Quick-action buttons: "Give me a hint", "Walk me through the solution"
- Opening the AI Helper accordion closes the Marking Scheme accordion on the same card (and vice versa)

---

## Phase 4 — Security & Performance (Week 7)

### 4.1 Rate Limiting & Input Guardrails

- API Gateway usage plans already enforce 100 RPM on `/chat`, 500 RPM on question endpoints
- All Lambda handlers reject oversized payloads: question list max 50 results per page, message max 2000 chars
- Prompt injection sanitisation in chat Lambda (strip known injection markers before constructing prompt)
- CORS origin allowlist: Vercel production URL + preview wildcard

### 4.2 Caching Strategy

- API Gateway response caching on `GET /topics` and `GET /topics/{topic}/questions` (5-minute TTL)
- Next.js `fetch` cache with `revalidate: 3600` on question detail pages (questions don't change)
- Lambda: AWS SDK client instances created at module level (reused across warm invocations)

### 4.3 Response Streaming

- Lambda Response Streaming (`RESPONSE_STREAM` invoke mode) for the chat Lambda
- API Gateway configured with chunked transfer encoding on `/chat` route
- Frontend `<ChatPanel />` uses `Response.body.getReader()` to process chunks incrementally

### 4.4 Error Handling & Resilience

- Lambda retries disabled on API Gateway integrations (user-facing; retrying a chat request would produce duplicate messages)
- DynamoDB conditional writes to prevent duplicate session messages
- Frontend: exponential backoff on question fetch failures; chat errors displayed inline without losing conversation history

---

## Phase 5 — Testing (Week 8)

### Unit Tests (Vitest)

- Prompt construction logic (variable injection, step truncation)
- Context truncation algorithm (10-turn cap)
- `<MathRenderer />` text splitter (inline vs block, error cases)
- Zustand chat store (message append, streaming state, reset on question change)
- Zod schemas for question seed data and Lambda request bodies

### Integration Tests (Vitest + `aws-sdk-client-mock`)

- `get-topics` Lambda: DynamoDB scan, response shape
- `get-questions` Lambda: query with and without filters
- `get-question` Lambda: found / not found / solution gating
- `chat` Lambda: mock provider path, session persistence, prompt injection rejection

### End-to-End Tests (Playwright)

- Pick a level → pick a topic → questions render inline in descending year order with LaTeX visible (no raw markup)
- Open the Marking Scheme accordion on a question → official marking scheme appears
- Open the AI Helper accordion on the same card → Marking Scheme closes automatically
- Send a chat message → streaming response appears token by token
- Use "Give me a hint" → returns a single-step hint; use "Walk me through the solution" → returns the step-by-step walkthrough
- 101st request to `/chat` within a minute → returns 429
- Invalid `level` or `topic` slug → 404 page shown

### Accessibility (axe-core in Playwright)

- No critical violations on topic grid, question list, or question page
- Full keyboard navigation through topic grid and question list
- ARIA labels on chat input, send button, and math blocks

---

## Phase 6 — Observability & Production Readiness (Week 8–9)

### Logging

- Structured JSON logs from all Lambda functions: `{ level, requestId, questionId, durationMs, error? }`
- CloudWatch Log Groups per Lambda with 30-day retention (set in Terraform)

### Metrics & Alerting

- CloudWatch Alarm: Lambda error rate > 1% over 5 minutes → SNS topic → email notification
- CloudWatch Alarm: API Gateway 4xx rate spike (rate limiting being hit unusually hard)
- Sentry SDK in `apps/web`: captures unhandled exceptions with `questionId` and `sessionId` as context tags

### Cost Controls

- AWS Budgets alert at $20/month (DynamoDB + Lambda + API Gateway at this scale should be well under $5/month before Bedrock is activated)
- DynamoDB on-demand billing — zero cost at rest

### Production Checklist

- [ ] All secrets and table names stored as Lambda env vars (never hardcoded)
- [ ] Terraform `prod` environment applied and state stored in remote S3 backend
- [ ] Custom domain configured via Route 53 + ACM for API Gateway (`api.maths-app.ie`)
- [ ] Vercel production domain configured (`maths-app.ie` or equivalent)
- [ ] CORS origin allowlist updated to production domain
- [ ] DynamoDB PITR confirmed active on both tables
- [ ] `AI_PROVIDER=mock` confirmed in `prod` until Bedrock phase
- [ ] Rate limits validated: manual load test hitting `/chat` 101 times → 429 observed
- [ ] Playwright E2E suite passing in CI against staging environment
- [ ] CloudWatch dashboard created: Lambda invocations, errors, duration per function
- [ ] AWS Budgets alert configured

---

## Future Phase — Bedrock Activation (Post-MVP)

Once the application is live and the UX has been validated with the mock provider:

1. Request model access for `anthropic.claude-3-5-sonnet-20241022-v2:0` in `eu-west-1` via the Bedrock console
2. Implement `BedrockProvider` using `@aws-sdk/client-bedrock-runtime` `InvokeModelWithResponseStream`
3. Update IAM execution role to activate the pre-written `bedrock:InvokeModelWithResponseStream` permission
4. Set `AI_PROVIDER=bedrock` in Terraform `prod` environment and apply
5. Add CloudWatch Metric for Bedrock input/output token counts (cost attribution per topic)
6. Add CloudWatch Alarm: Bedrock throttle errors → SNS
7. Update AWS Budget threshold to $100/month

---

## Future Phase — Authentication (Post-MVP)

1. Create Clerk production instance
2. Wrap `apps/web` in `<ClerkProvider>`; add sign-in/sign-up pages
3. Protect `/[level]/topics/[topic]` and `/api/[level]/chat/[questionId]` behind `auth()` Next.js middleware
4. Add Clerk JWT Lambda authoriser in Terraform `api_gateway` module
5. Attach `userId` from JWT to `ChatSessions` items for cross-device history persistence

---

## Delivery Timeline

| Week     | Milestone                                                                      |
| -------- | ------------------------------------------------------------------------------ |
| 1–2      | Repo setup, AWS bootstrap, Terraform modules, DynamoDB tables live in `dev`    |
| 3–4      | Dummy seed data, Questions API Lambdas, browse and question view UI with KaTeX |
| 5–6      | Mock AI provider, chat Lambda with streaming, chat UI end-to-end               |
| 7        | Rate limiting, caching, prompt guardrails, error handling                      |
| 8        | Full test suite (unit + integration + E2E + accessibility)                     |
| 8–9      | Observability, production deployment, production checklist signed off          |
| Post-MVP | Bedrock activation, then Auth (Clerk)                                          |

---

## Directory Structure (Target State)

```
/
├── apps/
│   └── web/
│       ├── app/
│       │   ├── page.tsx                    # Landing / level chooser
│       │   └── [level]/
│       │       ├── page.tsx                # Topic grid for level
│       │       └── topics/
│       │           └── [topic]/
│       │               └── page.tsx        # All questions for topic, inline
│       ├── components/
│       │   ├── LevelChooser.tsx
│       │   ├── TopicGrid.tsx
│       │   ├── QuestionList.tsx
│       │   ├── QuestionCard.tsx
│       │   ├── MarkingSchemePanel.tsx
│       │   ├── ChatPanel.tsx
│       │   └── MathRenderer.tsx
│       ├── lib/
│       │   ├── api.ts                      # typed fetch wrappers
│       │   └── math.ts                     # KaTeX text splitter
│       └── store/
│           └── chat.ts                     # Zustand chat slices
├── lambdas/
│   ├── get-topics/
│   ├── get-questions/
│   └── chat/
│       └── providers/
│           ├── index.ts                    # getAIProvider factory
│           ├── mock.ts                     # MockProvider
│           └── bedrock.ts                  # BedrockProvider (inactive)
├── infra/
│   ├── modules/
│   │   ├── dynamodb/
│   │   ├── lambda/
│   │   ├── api_gateway/
│   │   └── iam/
│   └── environments/
│       ├── dev/
│       │   ├── main.tf
│       │   └── terraform.tfvars
│       └── prod/
│           ├── main.tf
│           └── terraform.tfvars
├── data/
│   └── questions/
│       ├── trigonometry/
│       ├── calculus/
│       └── algebra/
├── scripts/
│   └── seed.ts
├── shared/
│   └── types.ts                            # shared TypeScript types
└── .github/
    └── workflows/
        ├── ci.yml
        ├── deploy-infra.yml
        └── deploy-web.yml
```
