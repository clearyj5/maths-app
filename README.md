This application is a web-based AI-assisted learning platform designed to support Leaving Certificate students in mastering exam-style questions through guided, interactive problem solving.

The platform presents past exam questions organised by topic (e.g. Trigonometry, Calculus, Algebra), similar in structure to Studyclix, but introduces a key differentiator:

Each question is paired with a context-aware AI tutor that can answer any student query related to that specific problem.

Rather than passively viewing solutions, students engage in an active learning process — asking questions, requesting hints, and exploring step-by-step reasoning in real time.


🎯 Core Functionality
Topic-Based Question Bank
Structured by syllabus topics and subtopics
Tagged by exam year, paper, and difficulty level
Supports rendering of mathematical notation (LaTeX)
Problem-Centric AI Tutor
Each question has an embedded AI chat interface
The AI has full context of:
The question
The official marking scheme
Expected solution steps
Students can:
Ask for clarification on specific steps
Request hints instead of full solutions
Ask follow-up questions dynamically
Solution & Marking Scheme Integration
Toggleable full solutions
Structured marking schemes aligned with exam standards
AI can explain marking breakdowns


🏗️ Technical Architecture

1. Frontend
Framework: Next.js (React-based)
Styling: Tailwind CSS
State Management: React Context / Zustand (lightweight, scalable)
Math Rendering: KaTeX or MathJax for LaTeX support

Key Design Principles:

Component-driven architecture
Responsive layout (desktop-first, mobile adaptive)
Real-time UI updates for chat interactions
Clean separation between UI and data-fetching layers

2. Backend (Serverless Architecture)
Compute: AWS Lambda
API Layer: Amazon API Gateway
Database: Amazon DynamoDB
Authentication (optional initially): Clerk or Cognito

Responsibilities:

Serve question data and metadata
Handle chat requests
Orchestrate AI calls
Manage session context
3. AI Layer
Model Provider: Amazon Bedrock
Access to foundation models (e.g. Claude, Titan)
Core Design Pattern: Retrieval-Augmented Generation (RAG)

For each AI interaction:

Retrieve:
Question text
Marking scheme
Predefined solution steps
Construct prompt with strict context boundaries
Send to LLM via Bedrock
Return structured response

Why this matters:

Prevents hallucination
Ensures exam-accurate explanations
Keeps responses grounded in curriculum


🧩 AI Tutor Design

The AI is not a generic chatbot.

It is:

A constrained, context-aware problem-solving assistant.

Capabilities:
Step-by-step explanation of solutions
Conceptual clarification (e.g. “why cosine rule applies”)
Hint-based guidance (without revealing full answer)
Explanation of marking schemes
Guardrails:
Cannot answer outside provided context unless explicitly allowed
Encouraged to guide rather than immediately solve
Structured response formatting (steps, reasoning, conclusion)


⚙️ Key Technical Considerations

1. Latency & Performance
Use caching for:
Question data
Frequently accessed AI responses
Stream responses where possible for better UX

2. Prompt Engineering
Strict templates to ensure:
Consistent structure
Curriculum alignment
Step-by-step clarity

3. Context Management
Maintain per-question chat context (not global)
Limit token usage by:
Injecting only relevant data
Truncating long conversations intelligently

4. Scalability
Fully serverless → auto-scaling by design
Stateless Lambda functions
DynamoDB for high-throughput read-heavy workloads

5. Security & Cost Control
Rate limiting on AI endpoints
API key or authenticated access for usage tracking
Guardrails to prevent prompt abuse


🚀 Extensibility

Although initially focused on Maths, the architecture is subject-agnostic:

Swap dataset → supports other Leaving Certificate subjects
AI layer remains unchanged
UI components reusable across disciplines


🧠 Summary

This platform transforms exam preparation from passive content consumption into an interactive, guided learning experience.

By combining structured exam content with a context-aware AI tutor, it enables students to:

Understand why solutions work
Explore problems at their own pace
Receive immediate, tailored explanations

Technically, the system leverages a modern serverless architecture and retrieval-augmented AI design to ensure scalability, accuracy, and responsiveness.
