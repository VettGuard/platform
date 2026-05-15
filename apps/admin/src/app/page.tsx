import { Button } from "@vettguard/ui/components/button"
import { ThemeToggle } from "@vettguard/ui/components/theme-toggle"

export default function AdminHome() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-8 shadow-[var(--shadow-md)]">
        <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--fg)]">
          VettGuard Admin
        </h1>
        <p className="mt-1 text-sm text-[color:var(--fg-muted)]">Internal staff console</p>
        <Button variant="primary" className="mt-6 w-full">
          Sign in with SSO
        </Button>
        <p className="mt-4 text-center text-xs text-[color:var(--fg-subtle)]">
          Staff access only. All actions are audited.
        </p>
      </div>
    </div>
  )
}
