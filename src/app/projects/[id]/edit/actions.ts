"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { updateProject } from "@/lib/projects";
import { TURNAROUND_VALUES, type Turnaround } from "@/lib/project-options";

export type EditProjectState = {
  error: string | null;
};

export async function updateProjectAction(
  _prevState: EditProjectState,
  formData: FormData
): Promise<EditProjectState> {
  const projectId = String(formData.get("projectId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    return { error: "Project name is required." };
  }

  const description = String(formData.get("description") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "").trim() || null;
  const trackingMode =
    String(formData.get("trackingMode") ?? "") === "MULTI_DELIVERABLE"
      ? "MULTI_DELIVERABLE"
      : "PROJECT";
  const turnaroundRaw = String(formData.get("turnaround") ?? "");
  const turnaround: Turnaround = TURNAROUND_VALUES.includes(
    turnaroundRaw as Turnaround
  )
    ? (turnaroundRaw as Turnaround)
    : "STANDARD";

  const currentUser = getCurrentUser();

  const result = await updateProject(currentUser.customerId, projectId, {
    title,
    description,
    dueDate,
    trackingMode,
    turnaround,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  redirect(`/projects/${projectId}?updated=1`);
}
