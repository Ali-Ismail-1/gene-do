"use client";

import { useActionState } from "react";
import {
  submitProjectAction,
  type SubmitProjectState,
} from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

const initialState: SubmitProjectState = { error: null, success: null };

export function SubmitProjectForm({ projectId }: { projectId: string }) {
  const [state, formAction] = useActionState(
    submitProjectAction,
    initialState
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="projectId" value={projectId} />
      {state.error && <p className="error-state">{state.error}</p>}
      {state.success && <p className="success-state">{state.success}</p>}
      <SubmitButton pendingLabel="Submitting…">Submit Project</SubmitButton>
    </form>
  );
}
