"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-foreground/10 bg-foreground/[0.03] px-6 py-8">
        <h1 className="mb-6 text-center text-xl font-semibold">כניסה לניהול</h1>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              סיסמה
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="rounded-lg border border-foreground/20 bg-background px-3 py-2.5 text-base outline-none focus:border-foreground/50 focus:ring-2 focus:ring-foreground/10"
              aria-describedby={state?.error ? "login-error" : undefined}
            />
          </div>
          {state?.error ? (
            <p id="login-error" role="alert" className="text-sm text-red-600">
              {state.error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={isPending}
            className="mt-1 rounded-lg bg-foreground px-4 py-3 text-base font-medium text-background transition hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "מתחבר..." : "כניסה"}
          </button>
        </form>
      </div>
    </main>
  );
}
