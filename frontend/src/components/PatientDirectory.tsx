"use client";

import React, { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { 
  Users, 
  Search, 
  Plus, 
  Calendar, 
  ShieldAlert, 
  Heart, 
  Phone, 
  Mail, 
  FileText,
  UserCheck
} from "lucide-react";

interface PatientDirectoryProps {
  onAddPatient: () => void;
  onBookAppointment?: (patient: any) => void;
}

export const PatientDirectory: React.FC<PatientDirectoryProps> = ({
  onAddPatient,
  onBookAppointment,
}) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/users/patients-list${search ? `?search=${encodeURIComponent(search)}` : ""}`);
      setPatients(data || []);
    } catch (err) {
      console.error("Failed to load patients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Patient Electronic Health Records</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {patients.length} Registered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Clinical intakes, baseline allergies, chronic diagnoses, and active insurance
          </p>
        </div>

        <button
          onClick={onAddPatient}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Patient Profile
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search patients by name, email, or health conditions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 shadow-sm"
        />
      </div>

      {/* Patients Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No patients registered yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You have a clean slate! Click the button below to add your first patient profile with complete health intake.
          </p>
          <button
            onClick={onAddPatient}
            className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add First Patient
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {patients.map((pat) => (
            <div
              key={pat.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                {/* Header info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-emerald-600/20">
                      {pat.full_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{pat.full_name}</h4>
                      <p className="text-[11px] text-slate-400">{pat.email}</p>
                    </div>
                  </div>
                  {pat.blood_group && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      {pat.blood_group}
                    </span>
                  )}
                </div>

                {/* Badges & Clinical intake summary */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">DOB:</span>
                    <span className="font-semibold text-slate-800">{pat.date_of_birth || "Not specified"}</span>
                  </div>

                  {pat.allergies && (
                    <div className="bg-rose-50/70 p-2 rounded-xl border border-rose-100 text-[11px] text-rose-800 flex items-start gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold">Allergies:</strong> {pat.allergies}
                      </div>
                    </div>
                  )}

                  {pat.chronic_conditions && (
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-[11px] text-slate-700">
                      <strong className="font-semibold text-slate-900">Conditions:</strong> {pat.chronic_conditions}
                    </div>
                  )}

                  {pat.insurance_provider && (
                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Insurance:</span>
                      <span className="font-medium text-slate-800 truncate max-w-[150px]">
                        {pat.insurance_provider}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer info */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {pat.phone || "No phone"}
                </span>
                <span className="text-[11px] font-semibold text-emerald-600">EHR Active</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
