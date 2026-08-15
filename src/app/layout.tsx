import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gene Do — Video Editor Client Portal (Prototype)",
  description:
    "Prototype client portal connecting a customer-facing workflow to Airtable and Dropbox.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        {process.env.NODE_ENV === "development" && (
          <div className="prototype-banner">
            Prototype — authentication and production security are not
            implemented.
          </div>
        )}
        <header className="site-header">
          <Link href="/" className="site-header__brand">
            Gene Do
          </Link>
          <nav className="site-header__nav">
            <Link href="/">Home</Link>
          </nav>
        </header>
        <main className="site-main">{children}</main>
        <footer className="site-footer">
          Video Editor Client Portal — Prototype
        </footer>
      </body>
    </html>
  );
}
