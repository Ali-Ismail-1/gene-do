"use client";

import { useActionState } from "react";
import { createProjectAction, type CreateProjectState } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

const initialState: CreateProjectState = { error: null };

export function NewProjectForm() {
  const [state, formAction] = useActionState(
    createProjectAction,
    initialState
  );

  return (
    <form action={formAction} className="project-form">
      {state.error && <p className="error-state">{state.error}</p>}

      <label className="project-form__field">
        Project Name
        <input type="text" name="title" required />
      </label>

      <label className="project-form__field">
        Description / Instructions
        <textarea name="description" rows={4} />
      </label>

      <label className="project-form__field">
        Due Date (optional)
        <input type="date" name="dueDate" />
      </label>

      <fieldset className="project-form__field">
        <legend>Tracking Mode</legend>
        <label className="project-form__radio">
          <input
            type="radio"
            name="trackingMode"
            value="PROJECT"
            defaultChecked
          />
          Project only
        </label>
        <label className="project-form__radio">
          <input
            type="radio"
            name="trackingMode"
            value="MULTI_DELIVERABLE"
          />
          Multiple deliverables
        </label>
      </fieldset>

      <SubmitButton pendingLabel="Creating…">Create Project</SubmitButton>
    </form>
  );
}
