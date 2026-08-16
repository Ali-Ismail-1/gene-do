"use client";

import { useActionState } from "react";
import { updateProjectAction, type EditProjectState } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { RadioOptionGroup } from "@/components/RadioOptionGroup";
import {
  TRACKING_MODE_OPTIONS,
  TURNAROUND_OPTIONS,
} from "@/lib/project-options";
import type { Project } from "@/lib/projects";

const initialState: EditProjectState = { error: null };

export function EditProjectForm({ project }: { project: Project }) {
  const [state, formAction] = useActionState(
    updateProjectAction,
    initialState
  );

  return (
    <form action={formAction} className="project-form">
      <input type="hidden" name="projectId" value={project.id} />
      {state.error && <p className="error-state">{state.error}</p>}

      <label className="project-form__field">
        Project Name
        <input
          type="text"
          name="title"
          defaultValue={project.title}
          required
        />
      </label>

      <label className="project-form__field">
        Description / Instructions
        <textarea
          name="description"
          rows={4}
          defaultValue={project.description}
        />
      </label>

      <RadioOptionGroup
        legend="What do you need edited?"
        name="trackingMode"
        options={TRACKING_MODE_OPTIONS}
        defaultValue={project.trackingMode}
      />

      <label className="project-form__field">
        Due Date (optional)
        <input
          type="date"
          name="dueDate"
          defaultValue={project.dueDate ?? ""}
        />
      </label>

      <RadioOptionGroup
        legend="Turnaround"
        name="turnaround"
        options={TURNAROUND_OPTIONS}
        defaultValue={project.turnaround}
      />

      <SubmitButton pendingLabel="Saving…">Save Changes</SubmitButton>
    </form>
  );
}
