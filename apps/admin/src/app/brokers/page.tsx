import { AdminShell } from "@/components/admin-shell"
import { AdminBrokers } from "@/components/admin-pages"

export default function Page() {
  return (
    <AdminShell>
      <AdminBrokers />
    </AdminShell>
  )
}
