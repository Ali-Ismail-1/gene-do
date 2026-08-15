// Prototype: small test files only, not production video. Shared between
// the client-side pre-check (UploadSourceFileForm) and the server-side
// enforcement (dropbox.ts) so the two never drift apart.
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
