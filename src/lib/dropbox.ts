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
