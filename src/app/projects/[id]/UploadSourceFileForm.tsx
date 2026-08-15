"use client";

import { useActionState } from "react";
import {
  uploadSourceFileAction,
  type UploadSourceFileState,
} from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

const initialState: UploadSourceFileState = { error: null, success: null };

export function UploadSourceFileForm({ projectId }: { projectId: string }) {
  const [state, formAction] = useActionState(
    uploadSourceFileAction,
    initialState
  );

  return (
    <form action={formAction} className="upload-form">
      <input type="hidden" name="projectId" value={projectId} />
      {state.error && <p className="error-state">{state.error}</p>}
      {state.success && <p className="success-state">{state.success}</p>}
      <div className="upload-form__controls">
        <input type="file" name="file" required />
        <SubmitButton pendingLabel="Uploading…">Upload</SubmitButton>
      </div>
    </form>
  );
}
