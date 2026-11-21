"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { DoctorBrowser } from "@/components/DoctorBrowser";
import { BookingModal } from "@/components/BookingModal";
import { AppointmentsList } from "@/components/AppointmentsList";
import { ConsultationRoom } from "@/components/ConsultationRoom";
import { SoapNoteModal } from "@/components/SoapNoteModal";
import { PrescriptionModal } from "@/components/PrescriptionModal";
import { MedicalRecordsView } from "@/components/MedicalRecordsView";
import { AdminDashboard } from "@/components/AdminDashboard";
import { 
  Activity, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  ArrowRight,
  Server,
  Cloud,
  Layers,
  Database
} from "lucide-react";

export default function Home() {
  const { user, login, quickDemoLogin, loading } = useAuth();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<string>("doctors");

  // Modals state
  const [bookingDoctor, setBookingDoctor] = useState<any | null>(null);
  const [activeVideoRoom, setActiveVideoRoom] = useState<{ roomId: string; appointment: any } | null>(null);
  const [soapAppointment, setSoapAppointment] = useState<any | null>(null);
  const [rxAppointment, setRxAppointment] = useState<any | null>(null);

  // Auth Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [submittingAuth, setSubmittingAuth] = useState(false);

  // Switch initial tab based on role
  React.useEffect(() => {
    if (user?.role === "doctor") {
      setActiveTab("appointments");
    } else if (user?.role === "admin") {
      setActiveTab("admin");
    } else {
      setActiveTab("doctors");
    }
  }, [user?.role]);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAuth(true);
    setAuthError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setAuthError(err.message || "Invalid credentials.");
    } finally {
      setSubmittingAuth(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-8 h-8 text-emerald-600 animate-pulse" />
          <p className="text-xs font-semibold text-slate-500">Connecting to CareFlow...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in, render sleek landing & login page
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        {/* Simple Header */}
        <header className="p-6 max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">CareFlow</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline">AWS HIPAA Architecture Demo</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              v1.0 Live
            </span>
          </div>
        </header>

        {/* Hero & Login Box */}
        <main className="max-w-7xl mx-auto px-4 py-8 flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 w-full">
          {/* Left Info */}
          <div className="max-w-xl space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Cloud-Native Telemedicine & EHR
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Production-grade healthcare on <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">AWS Cloud</span>
            </h1>

            <p className="text-base text-slate-600 leading-relaxed">
              Designed as a software-engineering showcase application with real AWS services: VPC, ECS Fargate, RDS PostgreSQL Multi-AZ, S3 KMS presigned uploads, Cognito RBAC, SQS/SNS decoupling, and HIPAA audit trails.
            </p>

            {/* Architecture Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-left shadow-sm">
                <Cloud className="w-4 h-4 text-emerald-600 mb-1" />
                <p className="text-xs font-bold text-slate-900">ECS Fargate</p>
                <p className="text-[10px] text-slate-500">Containerized API</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-left shadow-sm">
                <Database className="w-4 h-4 text-emerald-600 mb-1" />
                <p className="text-xs font-bold text-slate-900">RDS Postgres</p>
                <p className="text-[10px] text-slate-500">KMS CMK Encrypted</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-left shadow-sm">
                <Lock className="w-4 h-4 text-emerald-600 mb-1" />
                <p className="text-xs font-bold text-slate-900">Presigned S3</p>
                <p className="text-[10px] text-slate-500">Protected Health Info</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-left shadow-sm">
                <Layers className="w-4 h-4 text-emerald-600 mb-1" />
                <p className="text-xs font-bold text-slate-900">SQS + Lambda</p>
                <p className="text-[10px] text-slate-500">Async Reminders</p>
              </div>
            </div>
          </div>

          {/* Right Card: 1-Click Demo & Login */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl max-w-md w-full space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Sign in to CareFlow</h2>
              <p className="text-xs text-slate-500 mt-0.5">Use 1-click recruiter demo or credentials below</p>
            </div>

            {/* 1-Click Demo Switcher Buttons */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Instant Recruiter Demo Logins
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => quickDemoLogin("patient")}
                  className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold text-center transition"
                >
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => quickDemoLogin("doctor")}
                  className="p-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold text-center transition"
                >
                  Doctor
                </button>
                <button
                  type="button"
                  onClick={() => quickDemoLogin("admin")}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold text-center transition"
                >
                  Admin
                </button>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase">Or login manually</span>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {authError}
              </div>
            )}

            <form onSubmit={handleManualLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@careflow.health"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submittingAuth}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1.5"
              >
                {submittingAuth ? "Authenticating..." : "Sign In to Platform"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center text-xs text-slate-400 border-t border-slate-200">
          CareFlow Telemedicine Platform • React/Next.js + FastAPI + PostgreSQL + Docker + AWS
        </footer>
      </div>
    );
  }

  // Active Authenticated Portal View
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Active Telemedicine Room takes precedence when in a call */}
        {activeVideoRoom ? (
          <ConsultationRoom
            roomId={activeVideoRoom.roomId}
            appointment={activeVideoRoom.appointment}
            onLeave={() => setActiveVideoRoom(null)}
            onOpenSoapNotes={(apt) => setSoapAppointment(apt)}
          />
        ) : (
          <>
            {activeTab === "doctors" && (
              <DoctorBrowser onSelectDoctor={(doc) => setBookingDoctor(doc)} />
            )}

            {activeTab === "appointments" && (
              <AppointmentsList
                onJoinRoom={(roomId, apt) => setActiveVideoRoom({ roomId, appointment: apt })}
                onOpenSoapNotes={(apt) => setSoapAppointment(apt)}
                onOpenPrescription={(apt) => setRxAppointment(apt)}
              />
            )}

            {activeTab === "records" && <MedicalRecordsView />}

            {activeTab === "admin" && <AdminDashboard />}

            {activeTab === "audit" && <AdminDashboard />}
          </>
        )}
      </main>

      {/* Booking Modal */}
      {bookingDoctor && (
        <BookingModal
          doctor={bookingDoctor}
          onClose={() => setBookingDoctor(null)}
          onSuccess={() => {
            setBookingDoctor(null);
            setActiveTab("appointments");
          }}
        />
      )}

      {/* SOAP Clinical Note Modal */}
      {soapAppointment && (
        <SoapNoteModal
          appointment={soapAppointment}
          onClose={() => setSoapAppointment(null)}
          onSaved={() => {
            setSoapAppointment(null);
          }}
        />
      )}

      {/* Digital Prescription Modal */}
      {rxAppointment && (
        <PrescriptionModal
          appointment={rxAppointment}
          onClose={() => setRxAppointment(null)}
          onSaved={() => {
            setRxAppointment(null);
          }}
        />
      )}
    </div>
  );
}
