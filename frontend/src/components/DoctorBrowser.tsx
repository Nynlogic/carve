"use client";

import React, { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { 
  Search, 
  Star, 
  Calendar, 
  ShieldCheck, 
  Hospital, 
  Award, 
  Stethoscope, 
  Plus, 
  DollarSign, 
  Sparkles,
  ArrowUpDown
} from "lucide-react";

interface DoctorBrowserProps {
  onSelectDoctor: (doctor: any) => void;
  onAddDoctor: () => void;
}

export const DoctorBrowser: React.FC<DoctorBrowserProps> = ({ onSelectDoctor, onAddDoctor }) => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"rating" | "fee_asc" | "fee_desc">("rating");

  const specialties = [
    "All",
    "Cardiology",
    "Dermatology",
    "Neurology",
    "Pediatrics & Family Medicine",
    "Orthopedics",
    "Internal Medicine",
    "General Medicine"
  ];

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      let query = "/doctors/?size=50";
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (specialtyFilter !== "All") {
        query += `&specialization=${encodeURIComponent(specialtyFilter)}`;
      }
      const data = await apiRequest(query);
      let list = data.items || [];

      // Sort
      if (sortBy === "fee_asc") {
        list.sort((a: any, b: any) => a.consultation_fee - b.consultation_fee);
      } else if (sortBy === "fee_desc") {
        list.sort((a: any, b: any) => b.consultation_fee - a.consultation_fee);
      } else {
        list.sort((a: any, b: any) => b.rating - a.rating);
      }

      setDoctors(list);
    } catch (err) {
      console.error("Failed to load doctors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [specialtyFilter, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDoctors();
  };

  return (
    <div className="space-y-6">
      {/* Executive Healthcare Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verified Clinical Network • WebRTC Telemedicine
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Physician Directory & Online Appointments
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Browse licensed specialists, review verified clinical credentials, and book instant telemedicine consultations with encrypted medical records exchange.
            </p>
          </div>

          <button
            onClick={onAddDoctor}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold px-5 py-3 rounded-2xl shadow-lg shadow-emerald-500/25 transition flex items-center gap-2 flex-shrink-0 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Doctor
          </button>
        </div>

        {/* Ambient Glow */}
        <div className="absolute right-0 top-0 -mt-16 -mr-16 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search doctors by name, medical specialty, or hospital affiliation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </form>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            >
              <option value="rating">Top Rated</option>
              <option value="fee_asc">Fee: Low to High</option>
              <option value="fee_desc">Fee: High to Low</option>
            </select>
          </div>

          <button
            onClick={onAddDoctor}
            className="hidden sm:flex bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl transition items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Doctor
          </button>
        </div>
      </div>

      {/* Specialty Filter Badges */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {specialties.map((spec) => (
          <button
            key={spec}
            onClick={() => setSpecialtyFilter(spec)}
            className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition ${
              specialtyFilter === spec
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {spec}
          </button>
        ))}
      </div>

      {/* Doctors Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse space-y-4">
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
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto text-teal-600">
            <Stethoscope className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No physicians registered yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You have a fresh clinic canvas! Add your own doctor details to begin scheduling telemedicine and in-person visits.
          </p>
          <button
            onClick={onAddDoctor}
            className="mt-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Doctor Profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-teal-400 hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <img
                    src={doc.avatar_url || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&q=80"}
                    alt={doc.user?.full_name || "Doctor"}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shadow-sm flex-shrink-0"
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
                    <p className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md inline-block mt-1">
                      {doc.specialization}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-amber-500 font-semibold">
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

                {/* Meta Pills */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Hospital className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{doc.hospital_affiliation || "Private Practice"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{doc.experience_years} years clinical practice</span>
                  </div>
                </div>
              </div>

              {/* Footer Booking Action */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fee / consult</span>
                  <p className="text-base font-extrabold text-slate-900">₹{doc.consultation_fee}</p>
                </div>
                <button
                  onClick={() => onSelectDoctor(doc)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
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
