# Question Data

Bundled JSON files that represent the question bank at build time. During the demo, `LocalJsonRepository` reads these directly. When real content arrives, the exact same files (in the exact same shape) are seeded into DynamoDB by the future seed script — no translation layer needed.

## Directory layout

```
data/questions/
├── higher/
│   ├── trigonometry/
│   │   └── *.json       # 4 files
│   ├── calculus/
│   │   └── *.json       # 4 files
│   └── algebra/
│       └── *.json       # 3 files
└── ordinary/
    ├── trigonometry/    # 4 files
    ├── calculus/        # 4 files
    └── algebra/         # 3 files
```

The first directory level is **level** (`higher` or `ordinary`); the second is **topic**. Higher and Ordinary question banks are never mixed in a single page of the UI — students choose their level first.

File names must be unique across the whole tree, since the filename (minus extension) is used as a fallback lookup key.

## JSON schema

One question per file:

```json
{
  "questionId": "higher-trig-001",
  "level": "higher",
  "topic": "trigonometry",
  "subtopic": "cosine-rule",
  "year": 2022,
  "questionText": "LaTeX-formatted question body with $inline math$ or $$display math$$",
  "markingScheme": "LaTeX-formatted marking scheme. Use \\n for line breaks between mark bands.",
  "solutionSteps": [
    {
      "step": "Short step heading",
      "explanation": "LaTeX-formatted reasoning for this step"
    }
  ]
}
```

### Field definitions

| Field           | Type            | Required | Notes                                                                             |
| --------------- | --------------- | -------- | --------------------------------------------------------------------------------- |
| `questionId`    | string          | yes      | Unique across the whole bank. Dummy data uses slugs; real data will use UUIDs.    |
| `level`         | enum            | yes      | `"higher"` or `"ordinary"`                                                        |
| `topic`         | string          | yes      | `"trigonometry"`, `"calculus"`, `"algebra"` for now                               |
| `subtopic`      | string          | yes      | kebab-case, e.g. `"cosine-rule"`, `"stationary-points"`                           |
| `year`          | number          | yes      | 4-digit exam year (dummy data uses 2018–2024)                                     |
| `questionText`  | string (LaTeX)  | yes      | Use `$...$` for inline math, `$$...$$` for display. Paragraphs separated by `\n`. |
| `markingScheme` | string (LaTeX)  | yes      | Human-readable scheme. Marks are in bold, e.g. `**(2 marks)**`.                   |
| `solutionSteps` | array\<object\> | yes      | Ordered. Each step has `step` (heading) and `explanation` (body).                 |

No `paper` or `difficulty` fields — the app segregates content by **level × topic** only. These were removed because (a) paper assignment is an exam-admin detail that students don't browse by, and (b) difficulty is too subjective to label consistently.

## Writing LaTeX in JSON

Backslashes in LaTeX must be double-escaped in JSON literals:

- LaTeX `\sin\theta` → JSON `"\\sin\\theta"`
- LaTeX `\frac{1}{2}` → JSON `"\\frac{1}{2}"`
- Quotes inside strings → escape as `\"`

The rendered output uses KaTeX via the `<MathRenderer />` component. See the root `README.md` for LaTeX conventions supported.

## Importing real content

When real exam content becomes available:

1. Convert each question to this schema (a script that maps from the source format, whatever that ends up being)
2. Drop the files into `data/questions/<level>/<topic>/`
3. Delete all files with `questionId` starting with `higher-` or `ordinary-` prefixes used for dummies (grep for `"questionId": "higher-trig-`, etc.)
4. The `LocalJsonRepository` will pick up the new files automatically on next build
5. Post-AWS migration, the seed script will write the same JSON to DynamoDB via `BatchWriteItem`

Real data should use proper UUIDs for `questionId` to guarantee uniqueness across future paper/year additions.
