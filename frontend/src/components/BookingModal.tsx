"use client";

import React, { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { X, Calendar, Clock, Video, Building2, CheckCircle2, AlertCircle } from "lucide-react";

interface BookingModalProps {
  doctor: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ doctor, onClose, onSuccess }) => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(tomorrow);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [appointmentType, setAppointmentType] = useState<"TELEMEDICINE" | "IN_PERSON">("TELEMEDICINE");
  const [reason, setReason] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedDate || !doctor) return;

    const loadSlots = async () => {
      setLoadingSlots(true);
      setError(null);
      setSelectedSlot(null);
      try {
        const slots = await apiRequest(`/doctors/${doctor.id}/available-slots?target_date=${selectedDate}`);
        setAvailableSlots(slots);
      } catch (err: any) {
        setError(err.message || "Failed to load doctor slots.");
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [selectedDate, doctor]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError("Please select a time slot.");
      return;
    }
    if (!reason.trim()) {
      setError("Please describe the primary reason for your visit.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await apiRequest("/appointments/", {
        method: "POST",
        body: JSON.stringify({
          doctor_id: doctor.id,
          appointment_date: selectedDate,
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          reason,
          appointment_type: appointmentType,
        }),
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Booking failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Schedule Consultation</h3>
            <p className="text-xs text-slate-500">
              with {doctor.user?.full_name} ({doctor.specialization})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleBooking} className="mt-5 space-y-5">
          {/* Appointment Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Consultation Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAppointmentType("TELEMEDICINE")}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  appointmentType === "TELEMEDICINE"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Video className="w-4 h-4 text-emerald-600" /> Online Video
              </button>
              <button
                type="button"
                onClick={() => setAppointmentType("IN_PERSON")}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  appointmentType === "IN_PERSON"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Building2 className="w-4 h-4 text-slate-500" /> In-Clinic Visit
              </button>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Date
            </label>
            <div className="relative">
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Time Slot Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Available Time Slots</span>
              <span className="text-[10px] text-slate-400 font-normal">30-min clinical windows</span>
            </label>

            {loadingSlots ? (
              <div className="text-center py-6 text-xs text-slate-400">Checking doctor calendar...</div>
            ) : availableSlots.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">No available slots for this date. Please choose another day.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                {availableSlots.map((slot, idx) => (
                  <button
                    type="button"
                    key={idx}
                    disabled={!slot.is_available}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition ${
                      !slot.is_available
                        ? "bg-slate-100 text-slate-300 cursor-not-allowed line-through"
                        : selectedSlot?.start_time === slot.start_time
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 ring-2 ring-emerald-600/30"
                        : "bg-slate-50 border border-slate-200 text-slate-700 hover:border-emerald-400"
                    }`}
                  >
                    {slot.start_time.slice(0, 5)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reason for Visit */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason for Visit / Symptoms
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Mild palpitations after workouts, request medication review..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              required
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedSlot}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? "Confirming..." : `Confirm Booking (₹${doctor.consultation_fee})`}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
