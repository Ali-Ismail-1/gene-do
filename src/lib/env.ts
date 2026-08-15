/**
 * Server-only environment variable access. Never import this from client
 * components — it is not guarded by NEXT_PUBLIC_ and may read secrets.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Add it to .env.local (see .env.example).`
    );
  }
  return value;
}
