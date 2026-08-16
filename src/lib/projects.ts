import "server-only";
import {
  listProjectRecords,
  createProjectRecord,
  updateProjectRecord,
  type AirtableRecord,
} from "./airtable";
import { provisionProjectFolders, listFolderFiles } from "./dropbox";
import {
  type TrackingMode,
  type Turnaround,
  TURNAROUND_VALUES,
  TURNAROUND_AIRTABLE_VALUES,
} from "./project-options";

export type { TrackingMode, Turnaround };
export {
  TRACKING_MODE_LABELS,
  TRACKING_MODE_OPTIONS,
  TURNAROUND_LABELS,
  TURNAROUND_OPTIONS,
} from "./project-options";

export type ProjectStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "IN_PRODUCTION"
  | "READY_FOR_REVIEW"
  | "CHANGES_REQUESTED"
  | "COMPLETED";

const PROJECT_STATUSES: ProjectStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "IN_PRODUCTION",
  "READY_FOR_REVIEW",
  "CHANGES_REQUESTED",
  "COMPLETED",
];

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Received",
  IN_PRODUCTION: "In production",
  READY_FOR_REVIEW: "Ready for review",
  CHANGES_REQUESTED: "Changes requested",
  COMPLETED: "Complete",
};

export type Project = {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  description: string;
  dueDate: string | null;
  trackingMode: TrackingMode;
  turnaround: Turnaround;
  status: ProjectStatus;
  dropboxSourceFolder: string | null;
  dropboxReviewFolder: string | null;
  dropboxFinalFolder: string | null;
  sourceFiles: string[];
  showProgressToCustomer: boolean;
  createdAt: string | null;
};

function screamingSnakeCase(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

function normalizeStatus(raw: unknown): ProjectStatus {
  const normalized = screamingSnakeCase(raw);
  return PROJECT_STATUSES.includes(normalized as ProjectStatus)
    ? (normalized as ProjectStatus)
    : "DRAFT";
}

function normalizeTrackingMode(raw: unknown): TrackingMode {
  return screamingSnakeCase(raw) === "MULTI_DELIVERABLE"
    ? "MULTI_DELIVERABLE"
    : "PROJECT";
}

function normalizeTurnaround(raw: unknown): Turnaround {
  const normalized = screamingSnakeCase(raw);
  return TURNAROUND_VALUES.includes(normalized as Turnaround)
    ? (normalized as Turnaround)
    : "STANDARD";
}

function stringField(fields: Record<string, unknown>, name: string): string {
  const value = fields[name];
  return typeof value === "string" ? value : "";
}

function nullableStringField(
  fields: Record<string, unknown>,
  name: string
): string | null {
  const value = fields[name];
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Maps an Airtable record to a Project. Returns null for records missing
 * the fields that identify a project (e.g. ad hoc test rows) so they're
 * silently skipped rather than shown broken.
 */
function recordToProject(record: AirtableRecord): Project | null {
  const id = nullableStringField(record.fields, "Project ID");
  const customerId = nullableStringField(record.fields, "Customer ID");
  const title = nullableStringField(record.fields, "Project Name");
  if (!id || !customerId || !title) {
    return null;
  }

  const sourceFiles = stringField(record.fields, "Source Files")
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean);

  return {
    id,
    customerId,
    customerName: stringField(record.fields, "Customer"),
    title,
    description: stringField(record.fields, "Description"),
    dueDate: nullableStringField(record.fields, "Due Date"),
    trackingMode: normalizeTrackingMode(record.fields["Tracking Mode"]),
    turnaround: normalizeTurnaround(record.fields["Turnaround"]),
    status: normalizeStatus(record.fields["Portal Status"]),
    dropboxSourceFolder: nullableStringField(record.fields, "Dropbox Source"),
    dropboxReviewFolder: nullableStringField(record.fields, "Dropbox Review"),
    dropboxFinalFolder: nullableStringField(record.fields, "Dropbox Final"),
    sourceFiles,
    showProgressToCustomer: record.fields["Show Progress To Customer"] === true,
    createdAt:
      nullableStringField(record.fields, "Created At") ??
      record.createdTime ??
      null,
  };
}

export async function listProjectsForCustomer(
  customerId: string
): Promise<Project[]> {
  const records = await listProjectRecords();
  return records
    .map(recordToProject)
    .filter((project): project is Project => project !== null)
    .filter((project) => project.customerId === customerId);
}

/**
 * Finds the raw Airtable record for a project. Exposed alongside
 * getProjectById because callers that need to write back (e.g. submit)
 * need Airtable's own record id, not just the domain Project.
 */
async function findProjectRecord(
  customerId: string,
  projectId: string
): Promise<AirtableRecord | null> {
  const records = await listProjectRecords();
  const record = records.find((candidate) => {
    const project = recordToProject(candidate);
    return (
      project !== null &&
      project.id === projectId &&
      project.customerId === customerId
    );
  });
  return record ?? null;
}

export async function getProjectById(
  customerId: string,
  projectId: string
): Promise<Project | null> {
  const record = await findProjectRecord(customerId, projectId);
  return record ? recordToProject(record) : null;
}

/**
 * Resolves a project's Airtable record id (not our own Project ID UUID)
 * for callers that need to match against an Airtable linked-record field,
 * e.g. filtering Deliverables by their Project link.
 */
export async function getProjectRecordId(
  customerId: string,
  projectId: string
): Promise<string | null> {
  const record = await findProjectRecord(customerId, projectId);
  return record?.id ?? null;
}

export type NewProjectInput = {
  customerId: string;
  customerName: string;
  title: string;
  description: string;
  dueDate: string | null;
  trackingMode: TrackingMode;
  turnaround: Turnaround;
};

export type CreateProjectResult = {
  project: Project;
  dropboxError: string | null;
};

/**
 * Creates the Airtable row, then provisions the project's Dropbox folder
 * structure. A Dropbox failure doesn't roll back the Airtable row — the
 * project still exists, just without folders yet — but is reported back
 * so the caller can show it to the customer.
 */
export async function createProject(
  input: NewProjectInput
): Promise<CreateProjectResult> {
  const fields: Record<string, unknown> = {
    "Project ID": crypto.randomUUID(),
    "Customer ID": input.customerId,
    Customer: input.customerName,
    "Project Name": input.title,
    Description: input.description,
    "Tracking Mode": input.trackingMode,
    Turnaround: TURNAROUND_AIRTABLE_VALUES[input.turnaround],
    "Portal Status": "DRAFT",
    "Created At": new Date().toISOString(),
  };
  if (input.dueDate) {
    fields["Due Date"] = input.dueDate;
  }

  const record = await createProjectRecord(fields);
  const project = recordToProject(record);
  if (!project) {
    throw new Error("Airtable did not return a valid project record.");
  }

  const provisioned = await provisionProjectFolders(
    project.customerId,
    project.id
  );
  if (!provisioned.ok) {
    return { project, dropboxError: provisioned.error };
  }

  const updatedRecord = await updateProjectRecord(record.id, {
    "Dropbox Source": provisioned.paths.source,
    "Dropbox Review": provisioned.paths.review,
    "Dropbox Final": provisioned.paths.final,
  });
  const updatedProject = recordToProject(updatedRecord);

  return { project: updatedProject ?? project, dropboxError: null };
}

export type SubmitProjectResult =
  | { ok: true; project: Project }
  | { ok: false; error: string };

/**
 * Queries Dropbox 01-Source, requires at least one file, writes the
 * filenames + SUBMITTED status to Airtable. Refuses to resubmit a
 * project that isn't still DRAFT, so double-clicking or navigating back
 * to an already-submitted project can't file a second submission.
 */
export async function submitProject(
  customerId: string,
  projectId: string
): Promise<SubmitProjectResult> {
  const record = await findProjectRecord(customerId, projectId);
  if (!record) {
    return { ok: false, error: "Project not found." };
  }

  const project = recordToProject(record);
  if (!project) {
    return { ok: false, error: "Airtable project record is invalid." };
  }

  if (project.status !== "DRAFT") {
    return {
      ok: false,
      error: `This project has already been submitted (status: ${STATUS_LABELS[project.status]}).`,
    };
  }

  if (!project.dropboxSourceFolder) {
    return {
      ok: false,
      error: "Dropbox folders haven't been set up for this project yet.",
    };
  }

  const listed = await listFolderFiles(project.dropboxSourceFolder);
  if (!listed.ok) {
    return {
      ok: false,
      error: `Couldn't check the source folder: ${listed.error}`,
    };
  }
  if (listed.files.length === 0) {
    return {
      ok: false,
      error: "Upload at least one file before submitting.",
    };
  }

  const updatedRecord = await updateProjectRecord(record.id, {
    "Source Files": listed.files.join("\n"),
    "Portal Status": "SUBMITTED",
  });
  const updatedProject = recordToProject(updatedRecord);
  if (!updatedProject) {
    return {
      ok: false,
      error: "Airtable did not return a valid project record after submitting.",
    };
  }

  return { ok: true, project: updatedProject };
}

export type UpdateProjectInput = {
  title: string;
  description: string;
  dueDate: string | null;
  trackingMode: TrackingMode;
  turnaround: Turnaround;
};

export type UpdateProjectResult =
  | { ok: true; project: Project }
  | { ok: false; error: string };

/**
 * Edits a project's customer-editable fields. Only allowed while the
 * project is still DRAFT — this is a prototype, not a post-submission
 * change-request system, so once the editor has the project there's
 * nothing here to edit against.
 */
export async function updateProject(
  customerId: string,
  projectId: string,
  input: UpdateProjectInput
): Promise<UpdateProjectResult> {
  const record = await findProjectRecord(customerId, projectId);
  if (!record) {
    return { ok: false, error: "Project not found." };
  }

  const project = recordToProject(record);
  if (!project) {
    return { ok: false, error: "Airtable project record is invalid." };
  }

  if (project.status !== "DRAFT") {
    return {
      ok: false,
      error:
        "This project can no longer be edited — it has already been submitted.",
    };
  }

  const fields: Record<string, unknown> = {
    "Project Name": input.title,
    Description: input.description,
    "Tracking Mode": input.trackingMode,
    Turnaround: TURNAROUND_AIRTABLE_VALUES[input.turnaround],
    "Due Date": input.dueDate,
  };

  const updatedRecord = await updateProjectRecord(record.id, fields);
  const updatedProject = recordToProject(updatedRecord);
  if (!updatedProject) {
    return {
      ok: false,
      error: "Airtable did not return a valid project record after saving.",
    };
  }

  return { ok: true, project: updatedProject };
}
