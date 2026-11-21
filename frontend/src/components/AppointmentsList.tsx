"use client";

import React, { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { 
  Calendar, 
  Clock, 
  Video, 
  FileText, 
  Pill, 
  XCircle, 
  AlertCircle,
  CheckCircle,
  ExternalLink,
  UserCheck
} from "lucide-react";

interface AppointmentsListProps {
  onJoinRoom: (roomId: string, appointment: any) => void;
  onOpenSoapNotes: (appointment: any) => void;
  onOpenPrescription: (appointment: any) => void;
}

export const AppointmentsList: React.FC<AppointmentsListProps> = ({
  onJoinRoom,
  onOpenSoapNotes,
  onOpenPrescription,
}) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let query = "/appointments/?size=50";
      if (filterStatus !== "ALL") {
        query += `&status=${filterStatus}`;
      }
      const data = await apiRequest(query);
      setAppointments(data.items || []);
    } catch (err) {
      console.error("Failed to load appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [filterStatus]);

  const handleCancel = async (aptId: number) => {
    const reason = prompt("Enter reason for cancellation:");
    if (!reason) return;

    try {
      await apiRequest(`/appointments/${aptId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ cancellation_reason: reason }),
      });
      fetchAppointments();
    } catch (err: any) {
      alert(err.message || "Failed to cancel appointment.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {user?.role === "doctor" ? "Clinical Patient Queue" : "My Medical Consultations"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time appointment schedule, telemedicine rooms, and clinical documentation
          </p>
        </div>

        <div className="flex items-center gap-2">
          {["ALL", "CONFIRMED", "COMPLETED", "CANCELLED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition ${
                filterStatus === st
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Appointment Cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-900">No consultations found</h3>
          <p className="text-xs text-slate-500 mt-1">You currently have no consultations in this status category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => {
            const isDoctor = user?.role === "doctor";
            const counterPartyName = isDoctor
              ? apt.patient?.user?.full_name || "Patient"
              : apt.doctor?.user?.full_name || "Doctor";
            const counterPartySubtitle = isDoctor
              ? `DOB: ${apt.patient?.date_of_birth || "1988-05-14"} | Blood: ${apt.patient?.blood_group || "O+"}`
              : `${apt.doctor?.specialization || "General Medicine"} • ${apt.doctor?.hospital_affiliation || "Clinic"}`;

            return (
              <div
                key={apt.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-slate-300 transition-shadow duration-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Section: Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        apt.status === "CONFIRMED"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : apt.status === "COMPLETED"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : apt.status === "CANCELLED"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {apt.status}
                    </span>

                    <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                      {apt.appointment_type === "TELEMEDICINE" ? (
                        <>
                          <Video className="w-3.5 h-3.5 text-emerald-600" /> Online Telemedicine
                        </>
                      ) : (
                        "In-Clinic Consultation"
                      )}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900">{counterPartyName}</h4>
                    <p className="text-xs text-slate-500">{counterPartySubtitle}</p>
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-w-xl">
                    <strong className="text-slate-900">Reason:</strong> {apt.reason}
                  </p>
                </div>

                {/* Right Section: Time & Actions */}
                <div className="flex flex-col md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <div className="flex items-center md:justify-end gap-1.5 text-sm font-bold text-slate-900">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span>{apt.appointment_date}</span>
                    </div>
                    <div className="flex items-center md:justify-end gap-1.5 text-xs text-slate-500 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{apt.start_time.slice(0, 5)} - {apt.end_time.slice(0, 5)}</span>
                    </div>
                  </div>

                  {/* Contextual Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {apt.status === "CONFIRMED" && apt.telemedicine_room_id && (
                      <button
                        onClick={() => onJoinRoom(apt.telemedicine_room_id, apt)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition flex items-center gap-1.5"
                      >
                        <Video className="w-4 h-4" /> Enter Video Room
                      </button>
                    )}

                    {isDoctor && (
                      <>
                        <button
                          onClick={() => onOpenSoapNotes(apt)}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5" /> SOAP Note
                        </button>
                        <button
                          onClick={() => onOpenPrescription(apt)}
                          className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                        >
                          <Pill className="w-3.5 h-3.5" /> Issue Rx
                        </button>
                      </>
                    )}

                    {!isDoctor && apt.status === "COMPLETED" && (
                      <>
                        <button
                          onClick={() => onOpenSoapNotes(apt)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl transition flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-600" /> Clinical Notes
                        </button>
                        <button
                          onClick={() => onOpenPrescription(apt)}
                          className="bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold px-3 py-2 rounded-xl transition flex items-center gap-1.5 border border-teal-200"
                        >
                          <Pill className="w-3.5 h-3.5 text-teal-600" /> View Rx
                        </button>
                      </>
                    )}

                    {apt.status === "CONFIRMED" && (
                      <button
                        onClick={() => handleCancel(apt.id)}
                        className="text-xs text-rose-600 hover:bg-rose-50 px-2.5 py-2 rounded-xl transition"
                        title="Cancel Appointment"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
