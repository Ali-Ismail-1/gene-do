"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import {
  uploadSourceFileAction,
  type UploadSourceFileState,
} from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-limits";

const initialState: UploadSourceFileState = { error: null, success: null };
const MAX_UPLOAD_MB = MAX_UPLOAD_BYTES / (1024 * 1024);

export function UploadSourceFileForm({ projectId }: { projectId: string }) {
  const [state, formAction] = useActionState(
    uploadSourceFileAction,
    initialState
  );
  const [clientError, setClientError] = useState<string | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file && file.size > MAX_UPLOAD_BYTES) {
      const fileMb = (file.size / (1024 * 1024)).toFixed(1);
      setClientError(
        `This prototype only accepts small test files (max ${MAX_UPLOAD_MB} MB) — "${file.name}" is ${fileMb} MB. Large-file upload will be handled separately in production.`
      );
      event.target.value = "";
    } else {
      setClientError(null);
    }
  }

  return (
    <form action={formAction} className="upload-form">
      <input type="hidden" name="projectId" value={projectId} />
      {clientError && <p className="error-state">{clientError}</p>}
      {!clientError && state.error && (
        <p className="error-state">{state.error}</p>
      )}
      {!clientError && state.success && (
        <p className="success-state">{state.success}</p>
      )}
      <div className="upload-form__controls">
        <input
          type="file"
          name="file"
          required
          onChange={handleFileChange}
        />
        <SubmitButton pendingLabel="Uploading…">Upload</SubmitButton>
      </div>
    </form>
  );
}
