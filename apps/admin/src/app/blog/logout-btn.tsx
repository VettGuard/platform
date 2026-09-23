"use client"

export function LogoutBtn() {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }
  return (
    <button
      onClick={logout}
      className="text-xs text-[color:var(--fg-muted)] underline hover:text-[color:var(--fg)]"
    >
      Log out
    </button>
  )
}
