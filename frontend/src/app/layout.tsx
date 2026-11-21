import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Carevia – Connected care. Trusted by design.",
  description: "Zero-Trust Healthcare Records & Teleconsultation Platform. Manage your healthcare journey, connect with trusted doctors, access medical records, and consult remotely through one secure platform.",
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
