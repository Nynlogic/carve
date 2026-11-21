"use client";

import React, { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { Search, Star, Calendar, ShieldCheck, Hospital, Award, Stethoscope } from "lucide-react";

interface DoctorBrowserProps {
  onSelectDoctor: (doctor: any) => void;
}

export const DoctorBrowser: React.FC<DoctorBrowserProps> = ({ onSelectDoctor }) => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");

  const specialties = [
    "All Specialties",
    "Cardiology",
    "Dermatology",
    "Pediatrics & Family Medicine"
  ];

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      let query = "/doctors/?size=20";
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (specialtyFilter && specialtyFilter !== "All Specialties") {
        query += `&specialization=${encodeURIComponent(specialtyFilter)}`;
      }
      const data = await apiRequest(query);
      setDoctors(data.items || []);
    } catch (err) {
      console.error("Failed to load doctors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [specialtyFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDoctors();
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4" /> HIPAA-Compliant Video Consultations
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Book Telemedicine or In-Person Consultations
          </h1>
          <p className="text-sm text-slate-300">
            Connect with board-certified physicians, review clinical qualifications, and schedule instant appointments with encrypted medical records exchange.
          </p>
        </div>

        {/* Decorative Background Blur */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search doctors by name, hospital, or specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </form>

        <select
          value={specialtyFilter}
          onChange={(e) => setSpecialtyFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
        >
          {specialties.map((spec) => (
            <option key={spec} value={spec}>
              {spec}
            </option>
          ))}
        </select>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse space-y-4">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-slate-200 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-10 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <Stethoscope className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-900">No doctors match your search</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing filters or searching for general medicine.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <img
                    src={doc.avatar_url || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150"}
                    alt={doc.user?.full_name || "Doctor"}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-bold text-slate-900 truncate">
                        {doc.user?.full_name || "Doctor"}
                      </h3>
                      {doc.is_verified && (
                        <span title="Verified Physician">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-1">
                      {doc.specialization}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-amber-500 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{doc.rating}</span>
                      <span className="text-slate-400 font-normal">({doc.total_reviews} reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {doc.bio || "Board-certified specialist dedicated to evidence-based healthcare."}
                </p>

                {/* Metadata Pills */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Hospital className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{doc.hospital_affiliation || "Private Practice"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    <span>{doc.experience_years} years clinical experience</span>
                  </div>
                </div>
              </div>

              {/* Footer Booking Action */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fee / visit</span>
                  <p className="text-base font-extrabold text-slate-900">${doc.consultation_fee}</p>
                </div>
                <button
                  onClick={() => onSelectDoctor(doc)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4" /> Book Appointment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
