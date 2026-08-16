"use server";

import { getCurrentUser } from "@/lib/current-user";
import {
  getProjectById,
  submitProject,
  requestChanges,
} from "@/lib/projects";
import {
  getProjectFolderPaths,
  listFolderFiles,
  uploadFile,
} from "@/lib/dropbox";

export type UploadSourceFileState = {
  error: string | null;
  success: string | null;
};

export async function uploadSourceFileAction(
  _prevState: UploadSourceFileState,
  formData: FormData
): Promise<UploadSourceFileState> {
  const projectId = String(formData.get("projectId") ?? "");
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload.", success: null };
  }

  const currentUser = getCurrentUser();

  const project = await getProjectById(currentUser.customerId, projectId);
  if (!project) {
    return { error: "Project not found.", success: null };
  }

  const { source } = getProjectFolderPaths(currentUser.customerId, projectId);
  const buffer = await file.arrayBuffer();

  const uploaded = await uploadFile(`${source}/${file.name}`, buffer);
  if (!uploaded.ok) {
    return { error: uploaded.error, success: null };
  }

  const verified = await listFolderFiles(source);
  if (!verified.ok) {
    return {
      error: `Uploaded, but couldn't verify it landed in Dropbox: ${verified.error}`,
      success: null,
    };
  }
  if (!verified.files.includes(uploaded.name)) {
    return {
      error: `Upload succeeded but ${uploaded.name} wasn't found in the source folder afterward.`,
      success: null,
    };
  }

  return { error: null, success: `${uploaded.name} uploaded.` };
}

export type SubmitProjectState = {
  error: string | null;
  success: string | null;
};

export async function submitProjectAction(
  _prevState: SubmitProjectState,
  formData: FormData
): Promise<SubmitProjectState> {
  const projectId = String(formData.get("projectId") ?? "");
  const currentUser = getCurrentUser();

  const result = await submitProject(currentUser.customerId, projectId);
  if (!result.ok) {
    return { error: result.error, success: null };
  }

  return { error: null, success: "Project submitted." };
}

export type RequestChangesState = {
  error: string | null;
  success: string | null;
};

export async function requestChangesAction(
  _prevState: RequestChangesState,
  formData: FormData
): Promise<RequestChangesState> {
  const projectId = String(formData.get("projectId") ?? "");
  const feedback = String(formData.get("feedback") ?? "");
  const currentUser = getCurrentUser();

  const result = await requestChanges(
    currentUser.customerId,
    projectId,
    feedback
  );
  if (!result.ok) {
    return { error: result.error, success: null };
  }

  return { error: null, success: "Your feedback was submitted." };
}
