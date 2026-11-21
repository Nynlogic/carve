"use client";

import React, { useState } from "react";
import { apiRequest } from "@/lib/api";
import { 
  X, 
  Stethoscope, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  DollarSign, 
  Award, 
  FileBadge, 
  User, 
  Mail, 
  Lock, 
  Phone,
  Sparkles
} from "lucide-react";

interface AddDoctorModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_SPECIALTIES = [
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Pediatrics & Family Medicine",
  "Orthopedics",
  "Internal Medicine",
  "Psychiatry",
  "Oncology",
  "Ophthalmology",
  "General Surgery"
];

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&q=80",
  "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&q=80",
  "https://images.unsplash.com/photo-1594824813589-a72eb565e347?w=300&q=80",
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&q=80",
  "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&q=80"
];

export const AddDoctorModal: React.FC<AddDoctorModalProps> = ({ onClose, onSuccess }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("DoctorPass123!");
  const [phone, setPhone] = useState("+1 (555) 000-1122");
  const [specialization, setSpecialization] = useState("Cardiology");
  const [licenseNumber, setLicenseNumber] = useState(`MD-${Math.floor(100000 + Math.random() * 900000)}`);
  const [consultationFee, setConsultationFee] = useState("120");
  const [experienceYears, setExperienceYears] = useState("8");
  const [hospitalAffiliation, setHospitalAffiliation] = useState("Mount Sinai Hospital");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError("Doctor name and email are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName.startsWith("Dr.") ? fullName : `Dr. ${fullName}`,
          email,
          password,
          phone,
          role: "doctor",
          specialization,
          license_number: licenseNumber,
          consultation_fee: parseFloat(consultationFee) || 100.0,
          experience_years: parseInt(experienceYears, 10) || 5,
          hospital_affiliation: hospitalAffiliation,
          bio: bio || `Specialist physician in ${specialization} with ${experienceYears} years of clinical practice.`,
          avatar_url: avatarUrl
        })
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create doctor account.");
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
            <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shadow-sm">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Add New Doctor / Clinician</h3>
              <p className="text-xs text-slate-500">
                Register verified physician profile with automatic Monday–Friday schedule slots
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
          
          {/* Section 1: Credentials */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              1. Account Credentials & Contact
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Full Name (Physician)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Arthur Miller, MD"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Professional Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="doctor@hospital.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Temporary Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500"
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
                    placeholder="+1 (555) 123-4567"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Details */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              2. Clinical Specialty & Licensing
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Specialization
                </label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500"
                >
                  {PRESET_SPECIALTIES.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Medical License Number
                </label>
                <div className="relative">
                  <FileBadge className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="MD-CA-98421"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Consultation Fee (USD $)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="number"
                    step="5"
                    required
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(e.target.value)}
                    placeholder="120"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Years of Experience
                </label>
                <div className="relative">
                  <Award className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="number"
                    required
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    placeholder="8"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Hospital / Clinic Affiliation
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={hospitalAffiliation}
                  onChange={(e) => setHospitalAffiliation(e.target.value)}
                  placeholder="e.g. Johns Hopkins Medicine / Stanford Health"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Physician Biography & Focus Areas
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief clinical background, specialties, education..."
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>
          </div>

          {/* Section 3: Avatar Selection */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              3. Profile Photo Preset
            </span>
            <div className="flex items-center gap-3">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setAvatarUrl(url)}
                  className={`w-11 h-11 rounded-2xl overflow-hidden border-2 transition ${
                    avatarUrl === url ? "border-teal-600 ring-2 ring-teal-500/30 scale-105" : "border-slate-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={url} alt="preset" className="w-full h-full object-cover" />
                </button>
              ))}
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
              className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md shadow-teal-600/20 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? "Registering Doctor..." : "Save & Verify Doctor"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
