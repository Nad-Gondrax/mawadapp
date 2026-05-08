import { DashboardSidebar, DashboardBottomNav } from "@/components/dashboard/dashboard-nav"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 pb-16 lg:pb-0 min-w-0">
        {children}
      </main>
      <DashboardBottomNav />
    </div>
  )
}
