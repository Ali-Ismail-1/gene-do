import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import {
  getProjectById,
  STATUS_LABELS,
  TRACKING_MODE_LABELS,
  TURNAROUND_LABELS,
} from "@/lib/projects";
import { listFolderFiles, getTemporaryLink } from "@/lib/dropbox";
import { listDeliverablesForProject, DELIVERABLE_STATUS_LABELS } from "@/lib/deliverables";
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
  const { dropboxError, updated } = await searchParams;
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

  let reviewFiles: { name: string; link: string | null }[] = [];
  let reviewError: string | null = null;
  if (project.status === "READY_FOR_REVIEW") {
    if (!project.dropboxReviewFolder) {
      reviewError = "Review folder hasn't been set up for this project.";
    } else {
      const listed = await listFolderFiles(project.dropboxReviewFolder);
      if (!listed.ok) {
        reviewError = listed.error;
      } else {
        const reviewFolder = project.dropboxReviewFolder;
        reviewFiles = await Promise.all(
          listed.files.map(async (name) => {
            const linkResult = await getTemporaryLink(
              `${reviewFolder}/${name}`
            );
            return { name, link: linkResult.ok ? linkResult.link : null };
          })
        );
      }
    }
  }

  let deliverableSummary: Awaited<
    ReturnType<typeof listDeliverablesForProject>
  > | null = null;
  let deliverablesError: string | null = null;
  if (project.trackingMode === "MULTI_DELIVERABLE") {
    try {
      deliverableSummary = await listDeliverablesForProject(
        currentUser.customerId,
        id
      );
    } catch (error) {
      deliverablesError = (error as Error).message;
    }
  }

  return (
    <div className="project-detail">
      <Link href="/projects" className="project-detail__back">
        ← Back to Projects
      </Link>

      <div className="page-header">
        <div>
          <h1>{project.title}</h1>
          <p className="project-list__status">
            {STATUS_LABELS[project.status]}
          </p>
        </div>
        {project.status === "DRAFT" && (
          <Link href={`/projects/${project.id}/edit`} className="button">
            Edit Project
          </Link>
        )}
      </div>

      {updated && <p className="success-state">Project updated.</p>}

      {project.description && (
        <section>
          <h2>Instructions</h2>
          <p>{project.description}</p>
        </section>
      )}

      <section>
        <h2>Project Details</h2>
        <dl className="project-detail__meta">
          <div>
            <dt>Type</dt>
            <dd>{TRACKING_MODE_LABELS[project.trackingMode]}</dd>
          </div>
          <div>
            <dt>Due date</dt>
            <dd>{formatDueDate(project.dueDate)}</dd>
          </div>
          <div>
            <dt>Turnaround</dt>
            <dd>{TURNAROUND_LABELS[project.turnaround]}</dd>
          </div>
        </dl>
      </section>

      {project.trackingMode === "MULTI_DELIVERABLE" && (
        <section>
          <h2>Deliverables</h2>
          {deliverablesError && (
            <p className="error-state">
              Couldn&apos;t load deliverables: {deliverablesError}
            </p>
          )}
          {deliverableSummary && deliverableSummary.totalCount === 0 && (
            <p>No deliverables yet.</p>
          )}
          {deliverableSummary && deliverableSummary.totalCount > 0 && (
            <>
              {project.showProgressToCustomer && (
                <p className="project-detail__hint">
                  {deliverableSummary.completeCount} of{" "}
                  {deliverableSummary.totalCount} complete (
                  {Math.round(
                    (deliverableSummary.completeCount /
                      deliverableSummary.totalCount) *
                      100
                  )}
                  %)
                </p>
              )}
              <ul>
                {deliverableSummary.deliverables.map((deliverable) => (
                  <li key={deliverable.id}>
                    {deliverable.title} —{" "}
                    {DELIVERABLE_STATUS_LABELS[deliverable.status]}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {project.status === "READY_FOR_REVIEW" && (
        <section>
          <h2>Ready for Review</h2>
          <p>Your edit is ready for review.</p>
          {reviewError && (
            <p className="error-state">
              Couldn&apos;t load the review file: {reviewError}
            </p>
          )}
          {!reviewError && reviewFiles.length === 0 && (
            <p>
              This project is marked ready for review, but no review file
              was found yet — check with your editor.
            </p>
          )}
          {!reviewError && reviewFiles.length > 0 && (
            <ul>
              {reviewFiles.map((file) => (
                <li key={file.name}>
                  {file.name}
                  {file.link && (
                    <>
                      {" — "}
                      <a
                        href={file.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View / Download
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="project-detail__hint">
            Review notification would be sent to {currentUser.email}.
          </p>
        </section>
      )}

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
            We couldn&apos;t finish setting up file storage for this
            project. Please contact your editor.
          </p>
        )}
        {project.dropboxSourceFolder ? (
          <>
            <p>
              Add the footage, audio, graphics, and reference files needed
              for this project.
            </p>
            <UploadSourceFileForm projectId={project.id} />
          </>
        ) : (
          !dropboxErrorMessage && (
            <p>Upload isn&apos;t available for this project yet.</p>
          )
        )}
      </section>

      <section>
        {project.status === "DRAFT" ? (
          <>
            <SubmitProjectForm projectId={project.id} />
            <p className="project-detail__hint">
              Upload at least one file above before submitting.
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
