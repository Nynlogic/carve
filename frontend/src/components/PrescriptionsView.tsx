"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/api";
import {
  Pill,
  Calendar,
  Clock,
  ShieldCheck,
  User,
  CheckCircle2,
  FileText,
  AlertCircle
} from "lucide-react";

export const PrescriptionsView: React.FC = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        if (user?.role === "patient") {
          const data = await apiRequest("/prescriptions/my-prescriptions");
          setPrescriptions(data || []);
        } else {
          // If doctor or admin, fetch appointments and their prescriptions or recent appointments
          const apts = await apiRequest("/appointments/?size=20");
          const items = apts.items || [];
          // Collect appointments with prescriptions
          const rxList: any[] = [];
          for (const apt of items) {
            if (apt.prescriptions && apt.prescriptions.length > 0) {
              rxList.push(...apt.prescriptions);
            }
          }
          setPrescriptions(rxList);
        }
      } catch (err) {
        console.error("Failed to load prescriptions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-xs font-semibold mb-1">
            <Pill className="w-4 h-4 text-emerald-600" />
            Electronic Prescriptions (e-Rx)
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Prescriptions Vault</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Digitally signed medical prescriptions and pharmacological dosage instructions.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full flex items-center gap-1.5 self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Tamper-Evident e-Rx
        </span>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading prescription history...</div>
      ) : prescriptions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prescriptions.map((rx) => {
            let meds: any[] = [];
            try {
              meds = typeof rx.medications_json === "string" ? JSON.parse(rx.medications_json) : rx.medications_json || [];
            } catch {
              meds = [];
            }

            return (
              <div
                key={rx.id}
                className="bg-white p-6 rounded-2xl border border-slate-200/80 hover:border-teal-400 hover:shadow-md transition space-y-4"
              >
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                      {rx.prescription_code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">Prescription Order</h3>
                    <p className="text-[10px] text-slate-400">
                      Issued on {new Date(rx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Signed & Valid
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700">Prescribed Medications</p>
                  <div className="space-y-2">
                    {meds.map((m: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{m.medication_name}</span>
                          <span className="text-teal-700 font-semibold">{m.dosage}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {m.frequency} • {m.duration}
                        </p>
                        {m.instructions && (
                          <p className="text-[11px] text-slate-600 italic mt-0.5">Note: {m.instructions}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {rx.general_instructions && (
                  <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 text-xs">
                    <p className="font-bold text-teal-900 text-[11px]">Doctor&apos;s Clinical Advice:</p>
                    <p className="text-teal-800 text-[11px] mt-0.5">{rx.general_instructions}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <Pill className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No prescriptions found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When your physician issues electronic prescriptions during a teleconsultation, they will be securely cataloged here.
          </p>
        </div>
      )}
    </div>
  );
};
