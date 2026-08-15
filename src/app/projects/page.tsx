import { getCurrentUser } from "@/lib/current-user";
import { listProjectsForCustomer, STATUS_LABELS } from "@/lib/projects";

function formatDueDate(dueDate: string | null): string | null {
  if (!dueDate) return null;
  const date = new Date(dueDate);
  if (Number.isNaN(date.getTime())) return null;
  return `Due ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
}

export default async function ProjectsPage() {
  const currentUser = getCurrentUser();

  let projects: Awaited<ReturnType<typeof listProjectsForCustomer>> = [];
  let error: string | null = null;

  try {
    projects = await listProjectsForCustomer(currentUser.customerId);
  } catch (caught) {
    error = (caught as Error).message;
  }

  return (
    <div>
      <h1>Projects</h1>

      {error && (
        <p className="error-state">Couldn&apos;t load projects: {error}</p>
      )}

      {!error && projects.length === 0 && (
        <p>No projects yet.</p>
      )}

      {!error && projects.length > 0 && (
        <ul className="project-list">
          {projects.map((project) => {
            const dueLabel = formatDueDate(project.dueDate);
            return (
              <li key={project.id} className="project-list__item">
                <div className="project-list__title">{project.title}</div>
                <div className="project-list__status">
                  {STATUS_LABELS[project.status]}
                </div>
                {dueLabel && (
                  <div className="project-list__due">{dueLabel}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
