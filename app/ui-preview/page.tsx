import { MathRenderer } from '@/components/MathRenderer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/ui/SearchInput';

const SAMPLE_QUESTION = `In triangle $ABC$, side $a = 7\\text{ cm}$, side $b = 5\\text{ cm}$, and angle $C = 52°$. Find the length of side $c$, correct to two decimal places.

Using the cosine rule:

$$c^2 = a^2 + b^2 - 2ab\\cos C$$

The **positive** square root gives the final answer $c \\approx 5.56\\text{ cm}$.`;

const BROKEN_LATEX = 'This $\\frac{1}{$ has a deliberate syntax error.';

export default function UIPreviewPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-12 p-8">
      <header>
        <h1 className="text-3xl font-bold">UI Preview</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Showcase of the primitives built in TODO §5. This page is temporary.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">MathRenderer</h2>
        <Card>
          <MathRenderer>{SAMPLE_QUESTION}</MathRenderer>
        </Card>
        <Card>
          <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">
            Deliberately broken LaTeX (should render inline raw fallback):
          </p>
          <MathRenderer>{BROKEN_LATEX}</MathRenderer>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Buttons</h2>
        <Card>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="outline">Outline</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Badges</h2>
        <Card>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="higher">Higher Level</Badge>
            <Badge variant="ordinary">Ordinary Level</Badge>
            <Badge variant="year">2022</Badge>
            <Badge variant="subtle">Subtle</Badge>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Cards</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Static card</CardTitle>
              <Badge variant="year">2024</Badge>
            </CardHeader>
            <CardDescription>
              A plain card with a header, title, and description slot. Not clickable.
            </CardDescription>
          </Card>
          <Card interactive>
            <CardHeader>
              <CardTitle>Interactive card</CardTitle>
              <Badge variant="higher">Higher</Badge>
            </CardHeader>
            <CardDescription>
              Hover to see the lift. Used for topic and question cards.
            </CardDescription>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Skeleton</h2>
        <Card>
          <div className="space-y-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Filter controls</h2>
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Year" defaultValue="">
              <option value="">All years</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </Select>
            <SearchInput label="Search questions" placeholder="Type to search…" />
          </div>
        </Card>
      </section>
    </main>
  );
}
