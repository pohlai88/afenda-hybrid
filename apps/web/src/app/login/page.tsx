import Link from "next/link";
import { Button } from "@afenda/ui-core/primitives/button";

/** Phase 1 auth stub — replace with real sign-in. */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="text-sm text-muted-foreground">
        Stub page. Unset <code className="rounded bg-muted px-1">AFENDA_REQUIRE_AUTH</code> or add a
        session cookie <code className="rounded bg-muted px-1">afenda_session</code>.
      </p>
      <Button asChild>
        <Link href="/dashboard">Continue to app</Link>
      </Button>
    </div>
  );
}
