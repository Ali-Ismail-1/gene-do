import "server-only";
import {
  listProjectRecords,
  createProjectRecord,
  type AirtableRecord,
} from "./airtable";

export type TrackingMode = "PROJECT" | "MULTI_DELIVERABLE";

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
  SUBMITTED: "Submitted",
  IN_PRODUCTION: "In Production",
  READY_FOR_REVIEW: "Ready for Review",
  CHANGES_REQUESTED: "Changes Requested",
  COMPLETED: "Completed",
};

export type Project = {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  description: string;
  dueDate: string | null;
  trackingMode: TrackingMode;
  status: ProjectStatus;
  dropboxSourceFolder: string | null;
  dropboxReviewFolder: string | null;
  dropboxFinalFolder: string | null;
  sourceFiles: string[];
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
    status: normalizeStatus(record.fields["Portal Status"]),
    dropboxSourceFolder: nullableStringField(record.fields, "Dropbox Source"),
    dropboxReviewFolder: nullableStringField(record.fields, "Dropbox Review"),
    dropboxFinalFolder: nullableStringField(record.fields, "Dropbox Final"),
    sourceFiles,
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

export async function getProjectById(
  customerId: string,
  projectId: string
): Promise<Project | null> {
  const records = await listProjectRecords();
  const project = records
    .map(recordToProject)
    .find(
      (candidate) =>
        candidate !== null &&
        candidate.id === projectId &&
        candidate.customerId === customerId
    );
  return project ?? null;
}

export type NewProjectInput = {
  customerId: string;
  customerName: string;
  title: string;
  description: string;
  dueDate: string | null;
  trackingMode: TrackingMode;
};

export async function createProject(input: NewProjectInput): Promise<Project> {
  const fields: Record<string, unknown> = {
    "Project ID": crypto.randomUUID(),
    "Customer ID": input.customerId,
    Customer: input.customerName,
    "Project Name": input.title,
    Description: input.description,
    "Tracking Mode": input.trackingMode,
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
  return project;
}
