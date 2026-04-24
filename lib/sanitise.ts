/**
 * Strip common prompt-injection markers from user input before we interpolate
 * it into the model prompt. This is a defence-in-depth layer; the primary
 * boundary is the system prompt's explicit instruction to ignore attempts to
 * escape context.
 */

const INJECTION_MARKERS: RegExp[] = [
  /-{3,}/g,
  /^\s*system\s*:/gim,
  /^\s*assistant\s*:/gim,
  /^\s*user\s*:/gim,
  /<\/?instruction>/gi,
  /<\/?system>/gi,
  /\[INST\]|\[\/INST\]/gi,
];

export function sanitiseUserMessage(input: string): string {
  let output = input;
  for (const pattern of INJECTION_MARKERS) {
    output = output.replace(pattern, '');
  }
  return output.trim();
}
