export type MathSegment =
  | { kind: 'text'; value: string }
  | { kind: 'inline'; value: string }
  | { kind: 'block'; value: string };

const MATH_PATTERN = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;

/**
 * Split a string into plain-text, inline-math, and block-math segments.
 * `$$...$$` takes precedence over `$...$` and may span newlines. Inline
 * `$...$` is restricted to a single line to reduce false matches on stray
 * dollar signs.
 */
export function splitMath(input: string): MathSegment[] {
  const segments: MathSegment[] = [];
  let lastIndex = 0;

  for (const match of input.matchAll(MATH_PATTERN)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      segments.push({ kind: 'text', value: input.slice(lastIndex, start) });
    }
    if (match[1] !== undefined) {
      segments.push({ kind: 'block', value: match[1].trim() });
    } else if (match[2] !== undefined) {
      segments.push({ kind: 'inline', value: match[2] });
    }
    lastIndex = start + match[0].length;
  }

  if (lastIndex < input.length) {
    segments.push({ kind: 'text', value: input.slice(lastIndex) });
  }

  return segments;
}
