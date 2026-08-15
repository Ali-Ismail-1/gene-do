import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getProjectById, STATUS_LABELS } from "@/lib/projects";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const { dropboxError } = await searchParams;
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

  const dropboxErrorMessage = Array.isArray(dropboxError)
    ? dropboxError[0]
    : dropboxError;

  return (
    <div>
      <h1>{project.title}</h1>
      <p className="project-list__status">{STATUS_LABELS[project.status]}</p>
      {project.description && <p>{project.description}</p>}

      <section>
        <h2>Dropbox</h2>
        {dropboxErrorMessage && (
          <p className="error-state">
            Folder setup failed: {dropboxErrorMessage}
          </p>
        )}
        {project.dropboxSourceFolder &&
        project.dropboxReviewFolder &&
        project.dropboxFinalFolder ? (
          <ul className="dropbox-folder-list">
            <li>{project.dropboxSourceFolder}</li>
            <li>{project.dropboxReviewFolder}</li>
            <li>{project.dropboxFinalFolder}</li>
          </ul>
        ) : (
          !dropboxErrorMessage && <p>Dropbox folders not yet created.</p>
        )}
      </section>
    </div>
  );
}
