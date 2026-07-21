import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { IdleLogoutGuard } from "@/components/idle-logout-guard";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { SyncStatusBanner } from "@/components/sync-status-banner";
import { FeedbackBubble } from "@/components/feedback-bubble";
import type { Section, SectionWithInstitution } from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: sections } = await supabase
    .from("sections")
    .select("*, institutions ( nombre )")
    .eq("teacher_id", user.id)
    .eq("archivada", false)
    .order("ciclo_escolar", { ascending: false });

  const sectionList: SectionWithInstitution[] = (sections ?? []).map((s) => ({
    ...(s as unknown as Section),
    institutionNombre: (s.institutions as unknown as { nombre: string } | null)?.nombre ?? "",
  }));

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
