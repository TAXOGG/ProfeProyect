import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveSections } from "@/lib/sections-data";
import { Sidebar } from "@/components/sidebar";
import { IdleLogoutGuard } from "@/components/idle-logout-guard";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { SyncStatusBanner } from "@/components/sync-status-banner";
import { FeedbackBubble } from "@/components/feedback-bubble";

export const maxDuration = 30;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, sectionList] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    getActiveSections(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <ServiceWorkerRegister />
      <IdleLogoutGuard />
      <SyncStatusBanner />
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar teacherName={profile?.full_name ?? ""} sections={sectionList} />
        <main className="flex-1 overflow-y-auto md:h-screen">{children}</main>
      </div>
      <FeedbackBubble />
    </div>
  );
}
