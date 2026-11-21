"use client";

import React, { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { X, FileText, CheckCircle2, AlertCircle, Heart, Thermometer, Activity } from "lucide-react";

interface SoapNoteModalProps {
  appointment: any;
  onClose: () => void;
  onSaved?: () => void;
}

export const SoapNoteModal: React.FC<SoapNoteModalProps> = ({
  appointment,
  onClose,
  onSaved,
}) => {
  const { user } = useAuth();
  const isDoctor = user?.role === "doctor";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SOAP Fields
  const [subjective, setSubjective] = useState("");
  const [objective, setObjective] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");
  const [icdCodes, setIcdCodes] = useState("");

  // Vitals
  const [bp, setBp] = useState("120/80");
  const [hr, setHr] = useState("72");
  const [temp, setTemp] = useState("98.6");
  const [spo2, setSpo2] = useState("99");

  useEffect(() => {
    const fetchExistingNote = async () => {
      try {
        const note = await apiRequest(`/consultations/notes/${appointment.id}`);
        setSubjective(note.subjective || "");
        setObjective(note.objective || "");
        setAssessment(note.assessment || "");
        setPlan(note.plan || "");
        setIcdCodes(note.icd_codes || "");

        if (note.vitals_json) {
          try {
            const vitals = JSON.parse(note.vitals_json);
            if (vitals.blood_pressure) setBp(vitals.blood_pressure);
            if (vitals.heart_rate_bpm) setHr(String(vitals.heart_rate_bpm));
            if (vitals.temperature_f) setTemp(String(vitals.temperature_f));
            if (vitals.oxygen_saturation_pct) setSpo2(String(vitals.oxygen_saturation_pct));
          } catch (e) {
            console.error(e);
          }
        }
      } catch (err) {
        // No existing note is normal for new appointments
      } finally {
        setLoading(false);
      }
    };

    fetchExistingNote();
  }, [appointment.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDoctor) return;

    setSaving(true);
    setError(null);
    try {
      await apiRequest("/consultations/notes", {
        method: "POST",
        body: JSON.stringify({
          appointment_id: appointment.id,
          subjective,
          objective,
          assessment,
          plan,
          icd_codes: icdCodes,
          vitals: {
            blood_pressure: bp,
            heart_rate_bpm: parseInt(hr, 10) || 72,
            temperature_f: parseFloat(temp) || 98.6,
            oxygen_saturation_pct: parseInt(spo2, 10) || 99,
          },
        }),
      });

      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to record consultation note.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Clinical SOAP Documentation
              </h3>
              <p className="text-xs text-slate-500">
                Appointment #{appointment.id} • {appointment.appointment_date}
              </p>
            </div>
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

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading clinical note...</div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            
            {/* Vitals Ribbon */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Patient Vital Signs
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Blood Pressure</label>
                  <input
                    type="text"
                    disabled={!isDoctor}
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    placeholder="120/80"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Heart Rate (bpm)</label>
                  <input
                    type="number"
                    disabled={!isDoctor}
                    value={hr}
                    onChange={(e) => setHr(e.target.value)}
                    placeholder="72"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={!isDoctor}
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    placeholder="98.6"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Oxygen SpO2 (%)</label>
                  <input
                    type="number"
                    disabled={!isDoctor}
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    placeholder="99"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Subjective */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                [S] Subjective (History of Present Illness, Symptoms)
              </label>
              <textarea
                rows={2}
                disabled={!isDoctor}
                value={subjective}
                onChange={(e) => setSubjective(e.target.value)}
                placeholder="Patient describes onset of symptoms, pain intensity, duration..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 resize-none"
                required
              />
            </div>

            {/* Objective */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                [O] Objective (Physical Exam & Laboratory Findings)
              </label>
              <textarea
                rows={2}
                disabled={!isDoctor}
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Diagnostic examination findings, lung sounds, heart rhythm..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 resize-none"
                required
              />
            </div>

            {/* Assessment & ICD-10 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  [A] Assessment (Clinical Diagnosis)
                </label>
                <input
                  type="text"
                  disabled={!isDoctor}
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                  placeholder="e.g. Essential Primary Hypertension"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  ICD-10 Code(s)
                </label>
                <input
                  type="text"
                  disabled={!isDoctor}
                  value={icdCodes}
                  onChange={(e) => setIcdCodes(e.target.value)}
                  placeholder="e.g. I10, R42"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* Plan */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                [P] Plan (Treatment, Prescriptions, Follow-Up)
              </label>
              <textarea
                rows={2}
                disabled={!isDoctor}
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                placeholder="Prescribed regimens, lifestyle recommendations, scheduled follow-up..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 resize-none"
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
                Close
              </button>
              {isDoctor && (
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {saving ? "Signing..." : "Sign & Finalize SOAP Note"}
                </button>
              )}
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
