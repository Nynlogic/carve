"use client";

import React, { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { X, Pill, Plus, Trash2, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";

interface PrescriptionModalProps {
  appointment: any;
  onClose: () => void;
  onSaved?: () => void;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  appointment,
  onClose,
  onSaved,
}) => {
  const { user } = useAuth();
  const isDoctor = user?.role === "doctor";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingPrescriptions, setExistingPrescriptions] = useState<any[]>([]);

  // Form fields for new Rx
  const [medications, setMedications] = useState<Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>>([
    {
      name: "",
      dosage: "10 mg",
      frequency: "Once daily morning",
      duration: "30 days",
      instructions: "Take with food",
    },
  ]);
  const [generalInstructions, setGeneralInstructions] = useState("");

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const data = await apiRequest(`/prescriptions/appointment/${appointment.id}`);
        setExistingPrescriptions(data || []);
      } catch (err) {
        console.error("Failed to load existing prescriptions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [appointment.id]);

  const addMedicationRow = () => {
    setMedications([
      ...medications,
      {
        name: "",
        dosage: "",
        frequency: "Once daily",
        duration: "7 days",
        instructions: "Take after meals",
      },
    ]);
  };

  const removeMedicationRow = (idx: number) => {
    setMedications(medications.filter((_, i) => i !== idx));
  };

  const updateMedication = (idx: number, field: string, value: string) => {
    const updated = [...medications];
    (updated[idx] as any)[field] = value;
    setMedications(updated);
  };

  const handleIssuePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDoctor) return;

    if (medications.some((m) => !m.name.trim())) {
      setError("Please specify the medication name for all entries.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await apiRequest("/prescriptions/", {
        method: "POST",
        body: JSON.stringify({
          appointment_id: appointment.id,
          medications,
          general_instructions: generalInstructions,
        }),
      });

      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to issue prescription.");
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
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Electronic Prescription (e-Rx)</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Signed
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Appointment #{appointment.id} • Patient: {appointment.patient?.user?.full_name || "Patient"}
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

        {/* Display existing issued prescriptions if any */}
        {existingPrescriptions.length > 0 && (
          <div className="mt-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Issued Prescription Record(s)
            </h4>
            {existingPrescriptions.map((rx) => {
              const meds = JSON.parse(rx.medications_json || "[]");
              return (
                <div key={rx.id} className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-teal-900">{rx.prescription_code}</span>
                    <span className="text-[11px] text-teal-700">Signed: {new Date(rx.signed_at).toLocaleDateString()}</span>
                  </div>

                  <div className="space-y-2">
                    {meds.map((m: any, idx: number) => (
                      <div key={idx} className="bg-white p-2.5 rounded-xl border border-teal-100 text-xs">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>{m.name} ({m.dosage})</span>
                          <span className="text-teal-700 font-semibold">{m.frequency} • {m.duration}</span>
                        </div>
                        {m.instructions && (
                          <p className="text-[11px] text-slate-500 mt-1">Instructions: {m.instructions}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {rx.general_instructions && (
                    <p className="text-xs text-slate-600 italic">Notes: {rx.general_instructions}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Doctor Form for issuing a new Rx */}
        {isDoctor && (
          <form onSubmit={handleIssuePrescription} className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Prescribe Medications
              </h4>
              <button
                type="button"
                onClick={addMedicationRow}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Medication
              </button>
            </div>

            <div className="space-y-3">
              {medications.map((med, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600">Medication #{idx + 1}</span>
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedicationRow(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Drug Name (e.g. Lisinopril)"
                        value={med.name}
                        onChange={(e) => updateMedication(idx, "name", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Dosage (e.g. 10 mg oral tablet)"
                        value={med.dosage}
                        onChange={(e) => updateMedication(idx, "dosage", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Frequency (e.g. Once daily after food)"
                        value={med.frequency}
                        onChange={(e) => updateMedication(idx, "frequency", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Duration (e.g. 30 days)"
                        value={med.duration}
                        onChange={(e) => updateMedication(idx, "duration", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Patient instructions / warnings..."
                    value={med.instructions}
                    onChange={(e) => updateMedication(idx, "instructions", e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                General Pharmacist & Patient Notes
              </label>
              <textarea
                rows={2}
                value={generalInstructions}
                onChange={(e) => setGeneralInstructions(e.target.value)}
                placeholder="Take with adequate water. Avoid grapefruit juice..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                {saving ? "Signing..." : "Digitally Sign & Issue Rx"}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
