import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import {
  getProjectById,
  STATUS_LABELS,
  TRACKING_MODE_LABELS,
} from "@/lib/projects";
import { listFolderFiles } from "@/lib/dropbox";
import { UploadSourceFileForm } from "./UploadSourceFileForm";
import { SubmitProjectForm } from "./SubmitProjectForm";

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return "No due date set";
  const date = new Date(dueDate);
  if (Number.isNaN(date.getTime())) return "No due date set";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

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

  const sourceFiles = project.dropboxSourceFolder
    ? await listFolderFiles(project.dropboxSourceFolder)
    : null;

  return (
    <div className="project-detail">
      <Link href="/projects" className="project-detail__back">
        ← Back to Projects
      </Link>

      <h1>{project.title}</h1>
      <p className="project-list__status">{STATUS_LABELS[project.status]}</p>

      {project.description && (
        <section>
          <h2>Instructions</h2>
          <p>{project.description}</p>
        </section>
      )}

      <section>
        <h2>Details</h2>
        <dl className="project-detail__meta">
          <div>
            <dt>Tracking Mode</dt>
            <dd>{TRACKING_MODE_LABELS[project.trackingMode]}</dd>
          </div>
          <div>
            <dt>Due Date</dt>
            <dd>{formatDueDate(project.dueDate)}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2>Source Files</h2>
        {sourceFiles && !sourceFiles.ok && (
          <p className="error-state">
            Couldn&apos;t list source files: {sourceFiles.error}
          </p>
        )}
        {sourceFiles && sourceFiles.ok && sourceFiles.files.length > 0 && (
          <ul>
            {sourceFiles.files.map((file) => (
              <li key={file}>{file}</li>
            ))}
          </ul>
        )}
        {sourceFiles && sourceFiles.ok && sourceFiles.files.length === 0 && (
          <p>No files uploaded yet.</p>
        )}
        {!sourceFiles && <p>No files uploaded yet.</p>}
      </section>

      <section>
        <h2>Upload Source Files</h2>
        {dropboxErrorMessage && (
          <p className="error-state">
            Folder setup failed: {dropboxErrorMessage}
          </p>
        )}
        {project.dropboxSourceFolder ? (
          <>
            <p>Files upload directly into this Dropbox folder:</p>
            <p className="dropbox-path">{project.dropboxSourceFolder}</p>
            <UploadSourceFileForm projectId={project.id} />
          </>
        ) : (
          !dropboxErrorMessage && (
            <p>Dropbox folders haven&apos;t been set up for this project yet.</p>
          )
        )}
      </section>

      <section>
        {project.status === "DRAFT" ? (
          <>
            <SubmitProjectForm projectId={project.id} />
            <p className="project-detail__hint">
              At least one file must be uploaded to 01-Source before
              submitting.
            </p>
          </>
        ) : (
          <p className="project-detail__hint">
            This project has already been submitted.
          </p>
        )}
      </section>
    </div>
  );
}
