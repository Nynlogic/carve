"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { DEMO_MODE, apiRequest } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { PatientOverview } from "@/components/PatientOverview";
import { DoctorOverview } from "@/components/DoctorOverview";
import { SecurityCenter } from "@/components/SecurityCenter";
import { PrescriptionsView } from "@/components/PrescriptionsView";
import { NotificationsView } from "@/components/NotificationsView";
import { DoctorBrowser } from "@/components/DoctorBrowser";
import { BookingModal } from "@/components/BookingModal";
import { AppointmentsList } from "@/components/AppointmentsList";
import { ConsultationRoom } from "@/components/ConsultationRoom";
import { SoapNoteModal } from "@/components/SoapNoteModal";
import { PrescriptionModal } from "@/components/PrescriptionModal";
import { MedicalRecordsView } from "@/components/MedicalRecordsView";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AddDoctorModal } from "@/components/AddDoctorModal";
import { AddPatientModal } from "@/components/AddPatientModal";
import { PatientDirectory } from "@/components/PatientDirectory";
import { 
  Activity, 
  ShieldCheck, 
  Lock, 
  ArrowRight,
  Server,
  Cloud,
  Layers,
  Database,
  Plus,
  CheckCircle2,
  Stethoscope,
  Video,
  FileText,
  Pill,
  Bell,
  Search,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  MessageSquare
} from "lucide-react";

export default function Home() {
  const { user, login, quickDemoLogin, loading } = useAuth();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Modals state
  const [bookingDoctor, setBookingDoctor] = useState<any | null>(null);
  const [activeVideoRoom, setActiveVideoRoom] = useState<{ roomId: string; appointment: any } | null>(null);
  const [soapAppointment, setSoapAppointment] = useState<any | null>(null);
  const [rxAppointment, setRxAppointment] = useState<any | null>(null);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState<boolean>(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState<boolean>(false);
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);

  // Landing page state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [submittingAuth, setSubmittingAuth] = useState(false);
  const [showArchDrawer, setShowArchDrawer] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loginSectionRef = useRef<HTMLDivElement>(null);

  // Set default tab when user signs in
  useEffect(() => {
    if (user) {
      setActiveTab("overview");
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

  const handleQuickDemo = async (role: "patient" | "doctor" | "admin") => {
    setAuthError(null);
    try {
      await quickDemoLogin(role);
    } catch (err: any) {
      setAuthError(err.message || "Login failed.");
    }
  };

  const scrollToLogin = () => {
    loginSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-600/30 animate-pulse">
            <Activity className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500">Connecting to Carevia...</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // LANDING & LOGIN PAGE (For unauthenticated visitors)
  // -------------------------------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-teal-500 selection:text-white">
        
        {/* Top Commercial Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-600/30">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">
                  Carevia
                </span>
                <span className="text-[10px] text-teal-700 font-semibold tracking-wide block">
                  Connected care. Trusted by design.
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
              <a href="#benefits" className="hover:text-slate-900 transition">Capabilities</a>
              <a href="#security" className="hover:text-slate-900 transition">Security Architecture</a>
              <button 
                onClick={() => setShowArchDrawer(true)} 
                className="hover:text-teal-700 transition flex items-center gap-1"
              >
                <Server className="w-3.5 h-3.5 text-teal-600" /> Cloud Specs
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={scrollToLogin}
                className="hidden sm:inline-flex text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl transition"
              >
                Find a Doctor
              </button>
              <button
                onClick={scrollToLogin}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition"
              >
                Sign In
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center">
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 flex flex-col lg:flex-row items-center justify-between gap-12 w-full">
            
            {/* Left Hero Content */}
            <div className="max-w-xl space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                <ShieldCheck className="w-4 h-4 text-teal-600" /> SECURE DIGITAL HEALTHCARE
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                Healthcare, connected <span className="text-teal-600">around you.</span>
              </h1>

              <p className="text-base text-slate-600 leading-relaxed">
                Manage your healthcare journey, connect with trusted doctors, access medical records, and consult remotely through one secure platform.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  onClick={scrollToLogin}
                  className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-6 py-3.5 rounded-xl shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Stethoscope className="w-4 h-4" /> Find a Doctor
                </button>
                <button
                  onClick={scrollToLogin}
                  className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs px-6 py-3.5 rounded-xl border border-slate-200 shadow-sm transition flex items-center justify-center gap-2"
                >
                  Sign In <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Certified Practitioners
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> End-to-End Encrypted Records
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Real-Time Teleconsultations
                </span>
              </div>
            </div>

            {/* Right Card: Commercial Sign In Box */}
            <div ref={loginSectionRef} className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-xl max-w-md w-full space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sign in to Carevia</h2>
                <p className="text-xs text-slate-500 mt-1">Enter your credentials to access your secure portal</p>
              </div>

              {/* Discreet Role Preview Selector (local demo builds only) */}
              {DEMO_MODE && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                  <span>Quick Access (Demo Roles):</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo("patient")}
                    className="p-2 bg-white hover:bg-teal-50 hover:text-teal-800 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold text-center transition shadow-2xs"
                  >
                    Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo("doctor")}
                    className="p-2 bg-white hover:bg-teal-50 hover:text-teal-800 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold text-center transition shadow-2xs"
                  >
                    Doctor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo("admin")}
                    className="p-2 bg-white hover:bg-teal-50 hover:text-teal-800 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold text-center transition shadow-2xs"
                  >
                    Admin
                  </button>
                </div>
              </div>
              )}

              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                  {authError}
                </div>
              )}

              <form onSubmit={handleManualLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@careflow.health"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingAuth}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  {submittingAuth ? "Authenticating..." : "Sign In to Portal"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </section>

          {/* Core Platform Capabilities Section */}
          <section id="benefits" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full border-t border-slate-200/80">
            <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Unified Health Experience</span>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Built for patients, practitioners, and clinical teams</h2>
              <p className="text-xs text-slate-500">Every interaction is encrypted, audited, and streamlined.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Verified Specialists</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Browse certified clinicians, view institutional affiliations, and book 30-minute consultation slots.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Health Vault</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Store diagnostic lab reports and radiology scans protected by client-side presigned encryption.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">HD Teleconsultations</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Secure peer-to-peer virtual consultation workspace with synchronized clinical SOAP documentation.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Pill className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Digital Prescriptions</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tamper-evident pharmacological orders with precise dosage instructions and automated reminders.
                </p>
              </div>
            </div>
          </section>
        </main>

        {/* Architecture Drawer / Modal for Technical Evaluators */}
        {showArchDrawer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-teal-600" />
                  <h3 className="text-base font-bold text-slate-900">Cloud Architecture & Security Specifications</h3>
                </div>
                <button
                  onClick={() => setShowArchDrawer(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Carevia is engineered as a stateless, cloud-native application on AWS utilizing Terraform IaC:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-900 block">Amazon VPC</span>
                  <span className="text-[11px] text-slate-500">3-Tier Multi-AZ Network</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-900 block">ECS Fargate</span>
                  <span className="text-[11px] text-slate-500">FastAPI Containerized Core</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-900 block">RDS PostgreSQL</span>
                  <span className="text-[11px] text-slate-500">KMS CMK Multi-AZ</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-900 block">Amazon S3</span>
                  <span className="text-[11px] text-slate-500">Presigned Medical Vault</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-900 block">SQS & SNS</span>
                  <span className="text-[11px] text-slate-500">Decoupled Queue & Alerts</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-900 block">AWS CloudTrail</span>
                  <span className="text-[11px] text-slate-500">Immutable Audit Logging</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setShowArchDrawer(false)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
                >
                  Close Specs
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Commercial Footer */}
        <footer className="p-6 text-center text-xs text-slate-500 border-t border-slate-200/80 bg-white">
          Carevia Health Technologies • Zero-Trust Healthcare Records & Teleconsultation Platform
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // AUTHENTICATED PORTAL (Patient / Doctor / Admin)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* SaaS Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddDoctor={() => setShowAddDoctorModal(true)}
        onOpenAddPatient={() => setShowAddPatientModal(true)}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg">
              {user.role}
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-700 capitalize">
              {activeTab.replace("_", " ")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user.role === "admin" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddDoctorModal(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Doctor
                </button>
                <button
                  onClick={() => setShowAddPatientModal(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Patient
                </button>
              </div>
            )}

            <button
              onClick={() => setActiveTab("notifications")}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Global Notification Banner */}
        {notificationBanner && (
          <div className="bg-teal-600 text-white px-6 py-3 text-xs font-semibold flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {notificationBanner}
            </div>
            <button
              onClick={() => setNotificationBanner(null)}
              className="text-white hover:text-teal-200 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Work Area */}
        <main className="p-6 max-w-7xl w-full mx-auto flex-1">
          {/* Active Video Room takes over workspace when connected */}
          {activeVideoRoom ? (
            <ConsultationRoom
              roomId={activeVideoRoom.roomId}
              appointment={activeVideoRoom.appointment}
              onLeave={() => setActiveVideoRoom(null)}
              onOpenSoapNotes={(apt) => setSoapAppointment(apt)}
              onOpenPrescription={(apt) => setRxAppointment(apt)}
            />
          ) : (
            <>
              {/* Tab: Overview */}
              {activeTab === "overview" && (
                <>
                  {user.role === "patient" && (
                    <PatientOverview
                      setActiveTab={setActiveTab}
                      onJoinRoom={(roomId, apt) => setActiveVideoRoom({ roomId, appointment: apt })}
                      onOpenUploadRecord={() => setActiveTab("records")}
                    />
                  )}
                  {user.role === "doctor" && (
                    <DoctorOverview
                      setActiveTab={setActiveTab}
                      onJoinRoom={(roomId, apt) => setActiveVideoRoom({ roomId, appointment: apt })}
                      onOpenSoapNotes={(apt) => setSoapAppointment(apt)}
                      onOpenPrescription={(apt) => setRxAppointment(apt)}
                    />
                  )}
                  {user.role === "admin" && <AdminDashboard />}
                </>
              )}

              {/* Tab: Doctors */}
              {activeTab === "doctors" && (
                <DoctorBrowser
                  onSelectDoctor={(doc) => setBookingDoctor(doc)}
                  onAddDoctor={() => setShowAddDoctorModal(true)}
                />
              )}

              {/* Tab: Appointments & Consultations */}
              {(activeTab === "appointments" || activeTab === "consultations") && (
                <AppointmentsList
                  onJoinRoom={(roomId, apt) => setActiveVideoRoom({ roomId, appointment: apt })}
                  onOpenSoapNotes={(apt) => setSoapAppointment(apt)}
                  onOpenPrescription={(apt) => setRxAppointment(apt)}
                />
              )}

              {/* Tab: Patients (for Doctor/Admin) */}
              {activeTab === "patients" && (
                <PatientDirectory
                  onAddPatient={() => setShowAddPatientModal(true)}
                />
              )}

              {/* Tab: Health Records (Health Vault) */}
              {activeTab === "records" && <MedicalRecordsView />}

              {/* Tab: Prescriptions */}
              {activeTab === "prescriptions" && <PrescriptionsView />}

              {/* Tab: Notifications */}
              {activeTab === "notifications" && <NotificationsView />}

              {/* Tab: Security Center */}
              {activeTab === "security" && <SecurityCenter />}

              {/* Tab: Analytics (for Doctor/Admin) */}
              {activeTab === "analytics" && <AdminDashboard />}

              {/* Tab: Settings */}
              {activeTab === "settings" && <SecurityCenter />}

              {/* Tab: Messages */}
              {activeTab === "messages" && (
                <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-900">Clinical Consultation Messages</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Direct real-time clinical messaging is available when participating in an active teleconsultation session.
                  </p>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Add Doctor Modal */}
      {showAddDoctorModal && (
        <AddDoctorModal
          onClose={() => setShowAddDoctorModal(false)}
          onSuccess={() => {
            setShowAddDoctorModal(false);
            setNotificationBanner("Doctor registered successfully with standard schedule.");
            setTimeout(() => setNotificationBanner(null), 6000);
            setActiveTab("doctors");
          }}
        />
      )}

      {/* Add Patient Modal */}
      {showAddPatientModal && (
        <AddPatientModal
          onClose={() => setShowAddPatientModal(false)}
          onSuccess={() => {
            setShowAddPatientModal(false);
            setNotificationBanner("Patient profile registered into Health Vault.");
            setTimeout(() => setNotificationBanner(null), 6000);
            setActiveTab("patients");
          }}
        />
      )}

      {/* Booking Modal */}
      {bookingDoctor && (
        <BookingModal
          doctor={bookingDoctor}
          onClose={() => setBookingDoctor(null)}
          onSuccess={() => {
            setBookingDoctor(null);
            setNotificationBanner("Appointment confirmed! Check your appointments queue.");
            setTimeout(() => setNotificationBanner(null), 6000);
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
            setNotificationBanner("SOAP Clinical Documentation saved and signed.");
            setTimeout(() => setNotificationBanner(null), 6000);
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
            setNotificationBanner("Electronic Prescription (e-Rx) signed and issued.");
            setTimeout(() => setNotificationBanner(null), 6000);
          }}
        />
      )}
    </div>
  );
}
