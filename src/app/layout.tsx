import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Gene Do — Video Editor Client Portal (Prototype)",
  description:
    "Prototype client portal connecting a customer-facing workflow to Airtable and Dropbox.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const currentUser = getCurrentUser();

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
          <div className="site-header__user">
            <span className="site-header__user-name">{currentUser.name}</span>
            <span className="site-header__user-email">
              {currentUser.email}
            </span>
          </div>
        </header>
        <main className="site-main">{children}</main>
        <footer className="site-footer">
          Video Editor Client Portal — Prototype
        </footer>
      </body>
    </html>
  );
}
