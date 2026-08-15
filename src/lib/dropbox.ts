import "server-only";
import { requireEnv } from "./env";

const DROPBOX_API_BASE = "https://api.dropboxapi.com/2";

function getConfig() {
  return {
    token: requireEnv("DROPBOX_ACCESS_TOKEN"),
  };
}

/**
 * Low-level fetch wrapper for the Dropbox RPC API. Server-only — the
 * access token never reaches the browser.
 */
async function dropboxRequest(path: string, body: unknown = null) {
  const { token } = getConfig();
  return fetch(`${DROPBOX_API_BASE}${path}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export type ProjectFolderPaths = {
  root: string;
  source: string;
  review: string;
  final: string;
  internal: string;
};

export function getProjectFolderPaths(
  customerId: string,
  projectId: string
): ProjectFolderPaths {
  const root = `/Prototype Clients/${customerId}/${projectId}`;
  return {
    root,
    source: `${root}/01-Source`,
    review: `${root}/02-Review`,
    final: `${root}/03-Final`,
    internal: `${root}/99-Internal`,
  };
}

/**
 * Creates a single folder. Dropbox creates missing parent folders
 * automatically. Treats "already exists" as success so provisioning can
 * be safely repeated for the same project.
 */
async function createFolder(
  path: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await dropboxRequest("/files/create_folder_v2", { path });
    if (response.ok) {
      return { ok: true };
    }

    const body = await response.text();
    if (response.status === 409 && body.includes("path/conflict")) {
      return { ok: true };
    }

    return { ok: false, error: `Dropbox responded with ${response.status}: ${body}` };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export type ProvisionFoldersResult =
  | { ok: true; paths: ProjectFolderPaths }
  | { ok: false; error: string };

/**
 * Creates the Source/Review/Final/Internal folder structure for a
 * project. Safe to call more than once for the same project.
 */
export async function provisionProjectFolders(
  customerId: string,
  projectId: string
): Promise<ProvisionFoldersResult> {
  const paths = getProjectFolderPaths(customerId, projectId);

  for (const path of [paths.source, paths.review, paths.final, paths.internal]) {
    const result = await createFolder(path);
    if (!result.ok) {
      return { ok: false, error: `Failed to create ${path}: ${result.error}` };
    }
  }

  return { ok: true, paths };
}

export type DropboxConnectionResult =
  | { ok: true; accountName: string; email: string }
  | { ok: false; error: string };

/**
 * Confirms the configured access token can reach the developer's Dropbox
 * account. Used by the development-only connectivity check.
 */
export async function checkDropboxConnection(): Promise<DropboxConnectionResult> {
  try {
    getConfig();
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }

  try {
    const response = await dropboxRequest("/users/get_current_account");

    if (!response.ok) {
      const body = await response.text();
      return {
        ok: false,
        error: `Dropbox responded with ${response.status}: ${body}`,
      };
    }

    const data = (await response.json()) as {
      name: { display_name: string };
      email: string;
    };
    return { ok: true, accountName: data.name.display_name, email: data.email };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}
