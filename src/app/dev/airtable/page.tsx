import { notFound } from "next/navigation";
import { checkAirtableConnection } from "@/lib/airtable";

export default async function AirtableConnectivityCheck() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const result = await checkAirtableConnection();

  return (
    <div>
      <h1>Airtable Connectivity Check</h1>
      {result.ok ? (
        <p>
          Connected. Fetched {result.recordCount} record(s) from the
          configured Projects table.
        </p>
      ) : (
        <p style={{ color: "#b00020" }}>Failed: {result.error}</p>
      )}
    </div>
  );
}
