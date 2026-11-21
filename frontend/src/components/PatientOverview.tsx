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
  ShieldCheck,
  Plus,
  ArrowRight,
  Stethoscope,
  Activity,
  Heart,
  ChevronRight,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

interface PatientOverviewProps {
  setActiveTab: (tab: string) => void;
  onJoinRoom: (roomId: string, appointment: any) => void;
  onOpenUploadRecord: () => void;
}

export const PatientOverview: React.FC<PatientOverviewProps> = ({
  setActiveTab,
  onJoinRoom,
  onOpenUploadRecord,
}) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aptsRes, recsRes, rxRes] = await Promise.allSettled([
          apiRequest("/appointments/?size=5"),
          apiRequest("/medical-records/?size=5"),
          apiRequest("/prescriptions/my-prescriptions")
        ]);

        if (aptsRes.status === "fulfilled" && aptsRes.value) {
          setAppointments(aptsRes.value.items || []);
        }
        if (recsRes.status === "fulfilled" && recsRes.value) {
          setRecords(recsRes.value.items || []);
        }
        if (rxRes.status === "fulfilled" && rxRes.value) {
          setPrescriptions(rxRes.value || []);
        }
      } catch (err) {
        console.error("Failed to load patient overview:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const nextAppointment = appointments.find((a) => a.status === "SCHEDULED" || a.status === "CONFIRMED");

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-xs font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active Patient Session • Carevia Health Vault
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {getGreeting()}, {user?.name || "Patient"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your personal consultations, health records, and digital prescriptions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab("doctors")}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2"
          >
            <Stethoscope className="w-4 h-4" /> Book Consultation
          </button>
          <button
            onClick={onOpenUploadRecord}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Upload Record
          </button>
        </div>
      </div>

      {/* Main Grid: Next Consultation & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Consultation Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white p-6 rounded-2xl shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-2.5 py-1 rounded-full border border-teal-500/30 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" /> Next Scheduled Consultation
              </span>
              {nextAppointment && (
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Confirmed
                </span>
              )}
            </div>

            {nextAppointment ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">
                    {nextAppointment.doctor?.user?.full_name || "Specialist Physician"}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {nextAppointment.doctor?.specialization || "General Medicine"} • {nextAppointment.doctor?.hospital_affiliation || "Carevia Clinic Network"}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Date</p>
                    <p className="text-xs font-bold text-white mt-0.5">{nextAppointment.appointment_date}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Slot Time</p>
                    <p className="text-xs font-bold text-white mt-0.5">
                      {nextAppointment.start_time?.slice(0, 5)} - {nextAppointment.end_time?.slice(0, 5)}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10 col-span-2 sm:col-span-1">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Fee (INR)</p>
                    <p className="text-xs font-bold text-emerald-400 mt-0.5">₹{nextAppointment.consultation_fee || 800}</p>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => onJoinRoom(nextAppointment.telemedicine_room_id || `ROOM-APT-${nextAppointment.id}`, nextAppointment)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md shadow-emerald-500/20"
                  >
                    <Video className="w-4 h-4" /> Enter Telehealth Room
                  </button>
                  <button
                    onClick={() => setActiveTab("appointments")}
                    className="text-xs text-slate-300 hover:text-white font-semibold transition"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center sm:text-left space-y-3">
                <h3 className="text-lg font-bold text-white">No upcoming consultations</h3>
                <p className="text-xs text-slate-300 max-w-md">
                  You do not have any pending appointments. Browse our certified specialist directory to schedule an online or clinic visit.
                </p>
                <button
                  onClick={() => setActiveTab("doctors")}
                  className="bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition inline-flex items-center gap-2 shadow-sm"
                >
                  <Stethoscope className="w-4 h-4" /> Browse Available Doctors
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Health Summary Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" /> Health Profile
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active Vault
              </span>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Insurance Provider</span>
                <span className="font-semibold text-slate-900">Star Health & Allied</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Blood Group</span>
                <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">B+</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Allergies Documented</span>
                <span className="font-semibold text-slate-900">Penicillin (Mild)</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Records Encrypted</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> KMS CMK
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => setActiveTab("security")}
              className="w-full text-center text-xs font-semibold text-teal-700 hover:text-teal-800 transition flex items-center justify-center gap-1"
            >
              Security & Privacy Controls <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Second Row: Recent Medical Records & Active Prescriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Health Records */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Health Records</h3>
              <p className="text-[11px] text-slate-500">Encrypted diagnostic reports & clinical summaries</p>
            </div>
            <button
              onClick={() => setActiveTab("records")}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition"
            >
              View Vault ({records.length}) →
            </button>
          </div>

          {records.length > 0 ? (
            <div className="space-y-2.5">
              {records.slice(0, 3).map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{rec.title}</p>
                      <p className="text-[10px] text-slate-400 capitalize">
                        {rec.category.replace("_", " ")} • {new Date(rec.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    Encrypted
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <FileText className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No health records uploaded yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Upload lab results or hospital summaries safely.</p>
              <button
                onClick={onOpenUploadRecord}
                className="mt-3 text-xs font-bold text-teal-700 hover:text-teal-800"
              >
                + Upload First Document
              </button>
            </div>
          )}
        </div>

        {/* Active Prescriptions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Active Prescriptions</h3>
              <p className="text-[11px] text-slate-500">Digitally signed medications and instructions</p>
            </div>
            <button
              onClick={() => setActiveTab("prescriptions")}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition"
            >
              All e-Rx ({prescriptions.length}) →
            </button>
          </div>

          {prescriptions.length > 0 ? (
            <div className="space-y-2.5">
              {prescriptions.slice(0, 3).map((rx) => (
                <div
                  key={rx.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                      <Pill className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{rx.prescription_code}</p>
                      <p className="text-[10px] text-slate-400">
                        Issued {new Date(rx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                    Active e-Rx
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Pill className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No active electronic prescriptions</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Prescriptions issued during consultations appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
