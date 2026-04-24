# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this project is

An AI-assisted web platform that helps Irish Leaving Certificate Maths students practise past exam questions with a context-aware AI tutor embedded next to each question. Questions are organised by topic, and the tutor has access to the question, marking scheme, and solution steps via RAG so it stays grounded in curriculum.

The full product spec is in `README.md`. The production delivery plan — including phased milestones, data model, and architectural decisions — is in `PLAN.md`. **Always consult `PLAN.md` before proposing architectural changes.**

## Tech stack at a glance

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + Zustand + KaTeX (via `react-katex`), hosted on Vercel
- **Backend**: AWS Lambda (Node.js 20) + API Gateway REST + DynamoDB, all in `eu-west-1`
- **AI**: Mock provider in MVP, Amazon Bedrock (Claude 3.5 Sonnet) post-MVP
- **IaC**: Terraform (remote state in S3, lock table in DynamoDB)
- **Package manager**: `pnpm` workspaces
- **Testing**: Vitest (unit + integration with `aws-sdk-client-mock`), Playwright (E2E + axe-core)

## Standing decisions (do not revisit without asking)

1. **Terraform, not CDK.** Do not generate CDK code. If you see CDK references anywhere, they are stale — fix them.
2. **AWS region is `eu-west-1`.** The app is Ireland-only for now. Do not hardcode other regions.
3. **MVP ships unauthenticated.** Do not add Clerk, Cognito, or any auth middleware until the "Future Phase — Authentication" is explicitly started. API Gateway uses an API key for rate limiting only.
4. **Bedrock is deferred.** Until the Bedrock activation phase, the chat Lambda must use `MockProvider`. Do not call `bedrock-runtime` at runtime. The `BedrockProvider` class may exist as scaffolding but must not be the default.
5. **Dummy data only.** Do not build real exam-question scraping or import pipelines. The seed script reads from `data/questions/<topic>/*.json` and that is the full content pipeline for now.
6. **Single-table-ish DynamoDB design.** `Questions` uses `PK = TOPIC#<slug>`, `SK = QUESTION#<id>`. `ChatSessions` uses `PK = SESSION#<id>`, `SK = MSG#<ts>#<id>` with TTL. Do not introduce new tables without updating `PLAN.md`.
7. **Serverless only.** Every backend component must be a managed, pay-per-use service with no long-lived compute. Allowed: Lambda, API Gateway, DynamoDB, S3, SQS, SNS, EventBridge, Step Functions, Bedrock, CloudFront, Route 53, ACM, Secrets Manager, CloudWatch. **Disallowed**: EC2, ECS, EKS, Fargate tasks, RDS, ElastiCache, OpenSearch, MSK, Elastic Beanstalk, any self-managed container or VM. If a requirement seems to need one of these, stop and raise it — do not silently introduce a long-lived server.
8. **Node version is pinned to 20 via `.nvmrc`.** This matches the AWS Lambda runtime. Before running any `pnpm`, `node`, `tsc`, or build command in this repo, run `nvm use` to activate Node 20. The user has both Node 20 and Node 25 installed via nvm — Node 25 must never be used for this project, as bundling on a newer runtime risks shipping code that fails in Lambda. If `nvm use` outputs anything other than `Now using node v20.x.x`, stop and fix it before proceeding.

## Architecture conventions

### AI provider abstraction

The chat Lambda resolves its provider from the `AI_PROVIDER` env var (`mock` | `bedrock`). New AI features must go through the `AIProvider` interface, never import Bedrock SDK directly from handler code. This is what keeps the Bedrock swap a one-line config change.

### LaTeX handling

Question text, marking schemes, and AI responses all use LaTeX with `$...$` for inline and `$$...$$` for block math. The `<MathRenderer />` component is the single choke point for rendering — do not bypass it. Wrap new math-rendering usage in its error boundary.

### Prompt injection defence

User messages must be sanitised in the chat Lambda before being interpolated into the prompt. Strip `---`, `System:`, `<instruction>`, and similar markers. Never trust client-supplied context.

### Validation at boundaries

Every Lambda handler validates its input with Zod. The seed script validates every JSON file with Zod. Do not add ad-hoc `if (typeof x === 'string')` checks — extend the schema instead.

### Structured logging

Lambdas log JSON: `{ level, requestId, questionId, durationMs, error? }`. Do not use `console.log("something happened")`-style free-text logs.

### Rate limits

API Gateway enforces 100 RPM on `/chat` and 500 RPM on question endpoints via usage plans. Do not add application-level rate limiting that duplicates this.

## Repository layout

```
apps/web/         # Next.js frontend
lambdas/          # One directory per Lambda function (get-topics, get-questions, get-question, chat)
infra/            # Terraform: modules/ and environments/{dev,prod}/
data/questions/   # Dummy seed JSON, one file per question, organised by topic
scripts/seed.ts   # Writes dummy data to DynamoDB
shared/types.ts   # Shared TypeScript types between web and lambdas
```

## Commands

These commands will exist once Phase 1 is complete. Until then, adapt as the workspace is scaffolded.

**Always run `nvm use` first** in any new shell to activate Node 20 (pinned via `.nvmrc`). All commands below assume this.

```bash
# Activate the project's Node version
nvm use

# Install
pnpm install

# Frontend dev server
pnpm --filter web dev

# Unit + integration tests
pnpm test

# E2E tests
pnpm --filter web test:e2e

# Lint + type-check the whole repo
pnpm lint && pnpm typecheck

# Seed DynamoDB with dummy questions (dev)
AWS_REGION=eu-west-1 AWS_PROFILE=maths-app-dev pnpm seed

# Terraform (run from infra/environments/dev)
terraform init
terraform plan
terraform apply
```

## When making changes

- **Bug fixes**: keep the diff tight. Don't fold in refactors.
- **New Lambda**: add Zod input schema, structured logging, IAM policy in the Terraform `lambda` module, and at least one integration test with `aws-sdk-client-mock`.
- **New UI component**: place it in `apps/web/components/`, render math through `<MathRenderer />`, and respect the existing Zustand slice pattern for any per-question state.
- **New DynamoDB access pattern**: document the key pattern in `PLAN.md` alongside the existing ones before implementing.
- **Touching the chat Lambda**: verify `MockProvider` still returns sensible responses for the "hint", "solution", and general-question branches. Those are the three paths the UI exercises.

## What not to do

- Do not add comments that describe _what_ the code does; names should carry that. Comments are for non-obvious _why_ only.
- Do not add backwards-compatibility shims for code that hasn't shipped yet.
- Do not introduce new dependencies for problems already solved by the stack above (e.g. don't add `axios` — use `fetch`; don't add Redux — use Zustand).
- Do not commit AWS credentials, API keys, Clerk secrets, or real student data. `.env*` files must be gitignored.
- Do not generate mock exam questions that impersonate the State Examinations Commission or claim to be official past-paper material. Dummy questions should be clearly fictional.

## Current phase

The repository is pre-Phase 1. No code has been written yet. The first task is scaffolding the monorepo, Terraform state backend, and DynamoDB tables per `PLAN.md` Phase 1. Check `PLAN.md` for the active phase before starting work.
