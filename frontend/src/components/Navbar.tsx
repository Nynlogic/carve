"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import { Activity, ShieldCheck, Stethoscope, User, LogOut, Sparkles } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout, quickDemoLogin, loading } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">CareFlow</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Cloud-Native EHR
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">AWS Fargate • Cognito • S3 KMS Presigned • SQS/SNS</p>
            </div>
          </div>

          {/* Role Navigation Tabs */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              {user.role === "patient" && (
                <>
                  <button
                    onClick={() => setActiveTab("doctors")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      activeTab === "doctors" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Find Doctors
                  </button>
                  <button
                    onClick={() => setActiveTab("appointments")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      activeTab === "appointments" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    My Consultations
                  </button>
                  <button
                    onClick={() => setActiveTab("records")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
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
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      activeTab === "appointments" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Clinical Queue
                  </button>
                  <button
                    onClick={() => setActiveTab("records")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      activeTab === "records" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Patient Diagnostic Files
                  </button>
                </>
              )}

              {user.role === "admin" && (
                <>
                  <button
                    onClick={() => setActiveTab("admin")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      activeTab === "admin" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Clinic Analytics & Operations
                  </button>
                  <button
                    onClick={() => setActiveTab("audit")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      activeTab === "audit" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    HIPAA Audit Logs
                  </button>
                </>
              )}
            </nav>
          )}

          {/* Quick Demo Switcher & Account controls */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Selector for Interview Walkthrough */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
              <span className="text-[11px] font-medium text-slate-400 px-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Switch Demo:
              </span>
              <button
                onClick={() => quickDemoLogin("patient")}
                className={`text-xs px-2 py-1 rounded font-medium transition ${
                  user?.role === "patient" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                Patient
              </button>
              <button
                onClick={() => quickDemoLogin("doctor")}
                className={`text-xs px-2 py-1 rounded font-medium transition ${
                  user?.role === "doctor" ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                Doctor
              </button>
              <button
                onClick={() => quickDemoLogin("admin")}
                className={`text-xs px-2 py-1 rounded font-medium transition ${
                  user?.role === "admin" ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                Admin
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase">
                    {user.name.slice(0, 2)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-slate-900 leading-tight">{user.name}</p>
                    <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
                      {user.role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => quickDemoLogin("patient")}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-medium shadow-sm transition"
                >
                  1-Click Demo Login
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
