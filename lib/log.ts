interface LogFields {
  severity?: 'info' | 'warn' | 'error';
  route?: string;
  requestId?: string;
  durationMs?: number;
  [key: string]: unknown;
}

export function log(fields: LogFields): void {
  const { severity = 'info', ...rest } = fields;
  const line = JSON.stringify({ severity, ...rest, ts: new Date().toISOString() });
  if (severity === 'error') {
    console.error(line);
  } else if (severity === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}
