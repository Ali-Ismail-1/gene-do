"use client";

import { useActionState } from "react";
import {
  requestChangesAction,
  type RequestChangesState,
} from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

const initialState: RequestChangesState = { error: null, success: null };

export function RequestChangesForm({ projectId }: { projectId: string }) {
  const [state, formAction] = useActionState(
    requestChangesAction,
    initialState
  );

  return (
    <form action={formAction} className="project-form">
      <input type="hidden" name="projectId" value={projectId} />
      {state.error && <p className="error-state">{state.error}</p>}
      {state.success && <p className="success-state">{state.success}</p>}
      <label className="project-form__field">
        Request Changes
        <textarea
          name="feedback"
          rows={3}
          required
          placeholder="What would you like changed?"
        />
      </label>
      <SubmitButton pendingLabel="Submitting…">Request Changes</SubmitButton>
    </form>
  );
}
