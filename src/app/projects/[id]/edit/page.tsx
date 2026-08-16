import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getProjectById } from "@/lib/projects";
import { EditProjectForm } from "./EditProjectForm";

export default async function EditProjectPage({
  params,
}: PageProps<"/projects/[id]/edit">) {
  const { id } = await params;
  const currentUser = getCurrentUser();

  const project = await getProjectById(currentUser.customerId, id);
  if (!project) {
    notFound();
  }

  if (project.status !== "DRAFT") {
    redirect(`/projects/${id}`);
  }

  return (
    <div>
      <h1>Edit Project</h1>
      <EditProjectForm project={project} />
    </div>
  );
}
