import "server-only";
import { requireEnv } from "./env";

const AIRTABLE_API_BASE = "https://api.airtable.com/v0";

function getConfig() {
  return {
    token: requireEnv("AIRTABLE_TOKEN"),
    baseId: requireEnv("AIRTABLE_BASE_ID"),
    projectsTable: requireEnv("AIRTABLE_PROJECTS_TABLE"),
  };
}

/**
 * Low-level fetch wrapper for the Airtable REST API. Server-only — the
 * token never reaches the browser.
 */
async function airtableRequest(path: string, init?: RequestInit) {
  const { token, baseId } = getConfig();
  const response = await fetch(`${AIRTABLE_API_BASE}/${baseId}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  return response;
}

export type AirtableRecord = {
  id: string;
  createdTime?: string;
  fields: Record<string, unknown>;
};

/**
 * Fetches all records from the configured Projects table. The prototype's
 * Projects table is small enough that a single unpaginated request is fine.
 */
export async function listProjectRecords(): Promise<AirtableRecord[]> {
  const { projectsTable } = getConfig();
  const response = await airtableRequest(
    `/${encodeURIComponent(projectsTable)}`
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Airtable request failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as { records: AirtableRecord[] };
  return data.records;
}

/**
 * Creates a single record in the configured Projects table. `typecast`
 * lets Airtable coerce plain strings into select options/dates instead of
 * rejecting them — field *names* still must already exist on the table.
 */
export async function createProjectRecord(
  fields: Record<string, unknown>
): Promise<AirtableRecord> {
  const { projectsTable } = getConfig();
  const response = await airtableRequest(
    `/${encodeURIComponent(projectsTable)}`,
    {
      method: "POST",
      body: JSON.stringify({ fields, typecast: true }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Airtable request failed (${response.status}): ${body}`);
  }

  return (await response.json()) as AirtableRecord;
}

/**
 * Updates a single record (by Airtable's own record id) in the configured
 * Projects table.
 */
export async function updateProjectRecord(
  recordId: string,
  fields: Record<string, unknown>
): Promise<AirtableRecord> {
  const { projectsTable } = getConfig();
  const response = await airtableRequest(
    `/${encodeURIComponent(projectsTable)}/${recordId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ fields, typecast: true }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Airtable request failed (${response.status}): ${body}`);
  }

  return (await response.json()) as AirtableRecord;
}

export type AirtableConnectionResult =
  | { ok: true; recordCount: number }
  | { ok: false; error: string };

/**
 * Confirms the configured token/base/table can be reached. Used by the
 * development-only connectivity check.
 */
export async function checkAirtableConnection(): Promise<AirtableConnectionResult> {
  let config;
  try {
    config = getConfig();
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }

  try {
    const response = await airtableRequest(
      `/${encodeURIComponent(config.projectsTable)}?maxRecords=1`
    );

    if (!response.ok) {
      const body = await response.text();
      return {
        ok: false,
        error: `Airtable responded with ${response.status}: ${body}`,
      };
    }

    const data = (await response.json()) as { records: unknown[] };
    return { ok: true, recordCount: data.records.length };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}
