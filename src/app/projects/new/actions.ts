"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { createProject } from "@/lib/projects";

export type CreateProjectState = {
  error: string | null;
};

export async function createProjectAction(
  _prevState: CreateProjectState,
  formData: FormData
): Promise<CreateProjectState> {
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

  const currentUser = getCurrentUser();

  let project;
  try {
    project = await createProject({
      customerId: currentUser.customerId,
      customerName: currentUser.name,
      title,
      description,
      dueDate,
      trackingMode,
    });
  } catch (error) {
    return { error: (error as Error).message };
  }

  redirect(`/projects/${project.id}`);
}
