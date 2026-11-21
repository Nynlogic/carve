import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "CareFlow – Cloud-Native Clinic & Telemedicine Platform",
  description: "Production-grade, HIPAA-compliant Telemedicine & Clinic Management Platform built on Next.js, FastAPI, PostgreSQL, and AWS.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
