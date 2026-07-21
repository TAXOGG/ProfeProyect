import { redirect } from "next/navigation";

export default async function SeccionIndexPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;
  redirect(`/secciones/${sectionId}/estudiantes`);
}
