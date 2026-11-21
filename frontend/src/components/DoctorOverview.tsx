"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/api";
import {
  Calendar,
  Clock,
  Video,
  FileText,
  Pill,
  Users,
  CheckCircle2,
  AlertCircle,
  Activity,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  UserCheck
} from "lucide-react";

interface DoctorOverviewProps {
  setActiveTab: (tab: string) => void;
  onJoinRoom: (roomId: string, appointment: any) => void;
  onOpenSoapNotes: (appointment: any) => void;
  onOpenPrescription: (appointment: any) => void;
}

export const DoctorOverview: React.FC<DoctorOverviewProps> = ({
  setActiveTab,
  onJoinRoom,
  onOpenSoapNotes,
  onOpenPrescription,
}) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const data = await apiRequest("/appointments/?size=50");
        setAppointments(data.items || []);
      } catch (err) {
        console.error("Failed to load doctor dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter((a) => a.appointment_date === todayStr);
  const activeQueue = appointments.filter((a) => a.status === "SCHEDULED" || a.status === "CONFIRMED");
  const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      {/* Top Clinical Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-xs font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Verified Practitioner • Carevia Clinical Workspace
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dr. {user?.name || "Physician"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Today's clinical schedule, queued consultations, and diagnostic reviews.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab("appointments")}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm"
          >
            <Calendar className="w-4 h-4" /> Full Appointment Schedule
          </button>
          <button
            onClick={() => setActiveTab("patients")}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm"
          >
            <Users className="w-4 h-4" /> Patient Directory
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-slate-400">Today's Consultations</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{todayAppointments.length}</p>
          <p className="text-[11px] text-teal-600 font-semibold mt-1 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" /> 30-min clinical slots
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-slate-400">Waiting in Queue</p>
          <p className="text-2xl font-bold text-teal-700 mt-1">{activeQueue.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Confirmed appointments</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-slate-400">Completed Sessions</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{completedCount}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Charts & SOAP filed
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-slate-400">Compliance & Security</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">100%</p>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Tamper-evident audit
          </p>
        </div>
      </div>

      {/* Main Clinical Split: Today's Queue & Patient Needing Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Queue */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Patient Consultation Queue</h3>
              <p className="text-[11px] text-slate-500">Scheduled telemedicine and clinical intakes</p>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
              {activeQueue.length} Active
            </span>
          </div>

          {activeQueue.length > 0 ? (
            <div className="space-y-3">
              {activeQueue.slice(0, 5).map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {apt.patient?.user?.full_name || "Patient Intake"}
                      </span>
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        ID #{apt.patient_id}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {apt.appointment_date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {apt.start_time?.slice(0, 5)} - {apt.end_time?.slice(0, 5)}
                      </span>
                      <span className="font-semibold text-slate-700">₹{apt.consultation_fee || 800}</span>
                    </p>
                    {apt.symptoms && (
                      <p className="text-[11px] text-slate-600 italic">
                        Chief complaint: &quot;{apt.symptoms}&quot;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => onJoinRoom(apt.telemedicine_room_id || `ROOM-APT-${apt.id}`, apt)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Video className="w-3.5 h-3.5" /> Start Call
                    </button>
                    <button
                      onClick={() => onOpenSoapNotes(apt)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl transition flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" /> SOAP Note
                    </button>
                    <button
                      onClick={() => onOpenPrescription(apt)}
                      className="bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold px-3 py-2 rounded-xl transition flex items-center gap-1"
                    >
                      <Pill className="w-3.5 h-3.5" /> e-Rx
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Calendar className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No active patients in queue</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Your queue will automatically update when patients book.</p>
            </div>
          )}
        </div>

        {/* Patient Requiring Attention & Schedule */}
        <div className="space-y-6">
          {/* Attention alert */}
          <div className="bg-amber-50/80 p-5 rounded-2xl border border-amber-200/80 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600" /> Clinical Attention Notice
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              Verify blood pressure history and penicillin allergies prior to confirming electronic prescription issuance for today&apos;s consultations.
            </p>
          </div>

          {/* Quick clinical actions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Quick Clinical Shortcuts</h4>
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab("patients")}
                className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition flex items-center justify-between text-xs font-semibold text-slate-800"
              >
                <span>Browse Patient Medical Records</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => setActiveTab("records")}
                className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition flex items-center justify-between text-xs font-semibold text-slate-800"
              >
                <span>Upload Diagnostic PDF to Health Vault</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition flex items-center justify-between text-xs font-semibold text-slate-800"
              >
                <span>Review PHI Access Audit Logs</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
