import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getProjectById, STATUS_LABELS } from "@/lib/projects";

export default async function ProjectDetailPage({
  params,
}: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const currentUser = getCurrentUser();

  let project;
  try {
    project = await getProjectById(currentUser.customerId, id);
  } catch (error) {
    return (
      <p className="error-state">
        Couldn&apos;t load this project: {(error as Error).message}
      </p>
    );
  }

  if (!project) {
    notFound();
  }

  return (
    <div>
      <h1>{project.title}</h1>
      <p className="project-list__status">{STATUS_LABELS[project.status]}</p>
      {project.description && <p>{project.description}</p>}
    </div>
  );
}
