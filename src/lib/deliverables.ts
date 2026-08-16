import "server-only";
import { listDeliverableRecords, type AirtableRecord } from "./airtable";
import { getProjectRecordId } from "./projects";

export type DeliverableStatus =
  | "NOT_STARTED"
  | "IN_PRODUCTION"
  | "READY_FOR_REVIEW"
  | "CHANGES_REQUESTED"
  | "COMPLETED";

const DELIVERABLE_STATUSES: DeliverableStatus[] = [
  "NOT_STARTED",
  "IN_PRODUCTION",
  "READY_FOR_REVIEW",
  "CHANGES_REQUESTED",
  "COMPLETED",
];

export const DELIVERABLE_STATUS_LABELS: Record<DeliverableStatus, string> = {
  NOT_STARTED: "Not started",
  IN_PRODUCTION: "In production",
  READY_FOR_REVIEW: "Ready for review",
  CHANGES_REQUESTED: "Changes requested",
  COMPLETED: "Complete",
};

export type Deliverable = {
  id: string;
  title: string;
  status: DeliverableStatus;
  sortOrder: number;
};

function normalizeStatus(raw: unknown): DeliverableStatus {
  const normalized = String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return DELIVERABLE_STATUSES.includes(normalized as DeliverableStatus)
    ? (normalized as DeliverableStatus)
    : "NOT_STARTED";
}

/**
 * Maps an Airtable Deliverables record to a Deliverable. Returns null for
 * records missing an id or title, same defensive pattern as projects.ts.
 */
function recordToDeliverable(record: AirtableRecord): Deliverable | null {
  const id = record.fields["Deliverable ID"];
  const title = record.fields["Title"];
  if (typeof id !== "string" || !id || typeof title !== "string" || !title) {
    return null;
  }

  const sortOrder = record.fields["Sort Order"];

  return {
    id,
    title,
    status: normalizeStatus(record.fields["Status"]),
    sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
  };
}

export type DeliverableSummary = {
  deliverables: Deliverable[];
  completeCount: number;
  totalCount: number;
};

/**
 * Lists deliverables linked to a project (via Airtable's Project field on
 * the Deliverables table) and calculates the complete/total counts.
 * Returns an empty summary for a project that doesn't exist or has no
 * deliverables — this is not an error case, just nothing to show.
 */
export async function listDeliverablesForProject(
  customerId: string,
  projectId: string
): Promise<DeliverableSummary> {
  const projectRecordId = await getProjectRecordId(customerId, projectId);
  if (!projectRecordId) {
    return { deliverables: [], completeCount: 0, totalCount: 0 };
  }

  const records = await listDeliverableRecords();
  const deliverables = records
    .filter((record) => {
      const links = record.fields["Project"];
      return Array.isArray(links) && links.includes(projectRecordId);
    })
    .map(recordToDeliverable)
    .filter((deliverable): deliverable is Deliverable => deliverable !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const completeCount = deliverables.filter(
    (deliverable) => deliverable.status === "COMPLETED"
  ).length;

  return { deliverables, completeCount, totalCount: deliverables.length };
}
