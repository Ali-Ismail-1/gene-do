import { notFound } from "next/navigation";
import { checkDropboxConnection } from "@/lib/dropbox";

export default async function DropboxConnectivityCheck() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const result = await checkDropboxConnection();

  return (
    <div>
      <h1>Dropbox Connectivity Check</h1>
      {result.ok ? (
        <p>
          Connected as {result.accountName} ({result.email}).
        </p>
      ) : (
        <p style={{ color: "#b00020" }}>Failed: {result.error}</p>
      )}
    </div>
  );
}
