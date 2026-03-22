/** Append node-postgres / driver fields often omitted from `Error.message`. */
function appendDriverDiagnostics(obj: object, sink: string[]): void {
  const o = obj as Record<string, unknown>;
  for (const k of [
    "message",
    "detail",
    "constraint",
    "schema",
    "table",
    "routine",
    "code",
    "severity",
  ]) {
    const v = o[k];
    if (v != null && typeof v === "string" && v.length > 0) {
      sink.push(v);
    }
  }
}

/**
 * Drizzle wraps Postgres errors in an outer "Failed query: ..." message.
 * Tests that assert on PG diagnostics should scan the full error chain (including `cause`).
 */
export function fullPgErrorMessage(error: unknown): string {
  const messages: string[] = [];
  let e: unknown = error;
  for (let i = 0; i < 12 && e != null; i++) {
    if (e instanceof Error) {
      messages.push(e.message);
      appendDriverDiagnostics(e, messages);
      e = e.cause;
    } else if (e !== null && typeof e === "object") {
      appendDriverDiagnostics(e, messages);
      break;
    } else {
      messages.push(String(e));
      break;
    }
  }
  return messages.join(" | ");
}

/** Use with `expect(promise).rejects.toSatisfy(matchesPgError(/.../))` */
export function matchesPgError(pattern: RegExp): (err: unknown) => boolean {
  return (err: unknown) => pattern.test(fullPgErrorMessage(err));
}
