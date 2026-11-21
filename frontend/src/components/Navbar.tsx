"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import { 
  Activity, 
  ShieldCheck, 
  Stethoscope, 
  User, 
  LogOut, 
  Sparkles, 
  Plus, 
  Trash2, 
  Users, 
  Calendar, 
  FileText 
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAddDoctor: () => void;
  onOpenAddPatient: () => void;
  onResetCleanCanvas: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab,
  onOpenAddDoctor,
  onOpenAddPatient,
  onResetCleanCanvas
}) => {
  const { user, logout, quickDemoLogin } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 flex-shrink-0">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900">CareFlow</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                  Telemedicine Cloud
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden lg:block">AWS Fargate • RDS PostgreSQL • S3 KMS Presigned • Cognito RBAC</p>
            </div>
          </div>

          {/* Role Navigation Tabs */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
              {user.role === "patient" && (
                <>
                  <button
                    onClick={() => setActiveTab("doctors")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                      activeTab === "doctors" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Doctors Directory
                  </button>
                  <button
                    onClick={() => setActiveTab("appointments")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                      activeTab === "appointments" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    My Consultations
                  </button>
                  <button
                    onClick={() => setActiveTab("records")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                      activeTab === "records" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Medical Records
                  </button>
                </>
              )}

              {user.role === "doctor" && (
                <>
                  <button
                    onClick={() => setActiveTab("appointments")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                      activeTab === "appointments" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Clinical Patient Queue
                  </button>
                  <button
                    onClick={() => setActiveTab("patients")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                      activeTab === "patients" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Patient Directory
                  </button>
                  <button
                    onClick={() => setActiveTab("records")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                      activeTab === "records" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Diagnostic Files
                  </button>
                </>
              )}

              {user.role === "admin" && (
                <>
                  <button
                    onClick={() => setActiveTab("doctors")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                      activeTab === "doctors" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Doctors
                  </button>
                  <button
                    onClick={() => setActiveTab("patients")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                      activeTab === "patients" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Patients
                  </button>
                  <button
                    onClick={() => setActiveTab("admin")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                      activeTab === "admin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Analytics
                  </button>
                  <button
                    onClick={() => setActiveTab("audit")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                      activeTab === "audit" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    HIPAA Audit
                  </button>
                </>
              )}
            </nav>
          )}

          {/* Fast Actions: Add Doctor, Add Patient, Clean Canvas */}
          <div className="flex items-center gap-2">
            
            <button
              onClick={onOpenAddDoctor}
              className="bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              title="Add a new doctor with customized credentials"
            >
              <Plus className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Add</span> Doctor
            </button>

            <button
              onClick={onOpenAddPatient}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              title="Add a new patient with health intake"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Add</span> Patient
            </button>

            <button
              onClick={onResetCleanCanvas}
              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-xl transition"
              title="Reset Clean Canvas (Wipes mock doctors/patients so you start 100% fresh)"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {user ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                  {user.name.slice(0, 2)}
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">{user.name}</p>
                  <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
                    {user.role}
                  </p>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => quickDemoLogin("admin")}
                  className="text-xs bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl font-bold transition shadow-sm"
                >
                  Admin Login
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
