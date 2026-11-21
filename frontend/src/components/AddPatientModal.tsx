"use client";

import React, { useState } from "react";
import { apiRequest } from "@/lib/api";
import { 
  X, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Heart, 
  ShieldAlert, 
  User, 
  Mail, 
  Lock, 
  Phone
} from "lucide-react";

interface AddPatientModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

export const AddPatientModal: React.FC<AddPatientModalProps> = ({ onClose, onSuccess }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("PatientPass123!");
  const [phone, setPhone] = useState("+91 98200 54321");
  const [dob, setDob] = useState("1994-08-20");
  const [gender, setGender] = useState("Female");
  const [bloodGroup, setBloodGroup] = useState("B+");
  const [allergies, setAllergies] = useState("Penicillin, Dust");
  const [chronicConditions, setChronicConditions] = useState("Mild Asthma");
  const [emergencyContact, setEmergencyContact] = useState("Ramesh (Father) - +91 98111 22334");
  const [insuranceProvider, setInsuranceProvider] = useState("Star Health Insurance");
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState("STAR-2024-88902");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError("Patient name and email are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          phone,
          role: "patient",
          date_of_birth: dob,
          gender,
          blood_group: bloodGroup,
          allergies,
          chronic_conditions: chronicConditions,
          emergency_contact: emergencyContact,
          insurance_provider: insuranceProvider,
          insurance_policy_number: insurancePolicyNumber
        })
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to register patient.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Add New Patient</h3>
              <p className="text-xs text-slate-500">
                Create electronic health record (EHR) profile with clinical intake & insurance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Section 1: Demographics */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              1. Personal Demographics & Account
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pooja Mehta"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="pooja.mehta@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Initial Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98200 54321"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Prefer Not to Say">Prefer Not to Say</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Baseline */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              2. Clinical Baseline & Emergency Contact
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="e.g. Ramesh (Father) - +91 98111 22334"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-rose-700 block mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Known Drug Allergies
              </label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. Penicillin, Aspirin, Sulfa drugs, None"
                className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 text-rose-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Chronic Medical Conditions
              </label>
              <input
                type="text"
                value={chronicConditions}
                onChange={(e) => setChronicConditions(e.target.value)}
                placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Section 3: Health Insurance */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              3. Insurance Policy
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Insurance Provider
                </label>
                <input
                  type="text"
                  value={insuranceProvider}
                  onChange={(e) => setInsuranceProvider(e.target.value)}
                  placeholder="e.g. Star Health / HDFC ERGO / ICICI Lombard / Care Health"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Policy / TPA Member ID
                </label>
                <input
                  type="text"
                  value={insurancePolicyNumber}
                  onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                  placeholder="e.g. STAR-2024-88902"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
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
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? "Creating Profile..." : "Create Patient Profile"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
