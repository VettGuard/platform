import { AdminShell } from "@/components/admin-shell"
import { AdminCustomers } from "@/components/admin-pages"

export default function Page() {
  return (
    <AdminShell>
      <AdminCustomers />
    </AdminShell>
  )
}
