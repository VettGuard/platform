import { redirect } from "next/navigation"

// Root → Customers (the default console page). Gated routes redirect
// unauthenticated users to /login via middleware.
export default function AdminHome() {
  redirect("/customers")
}
