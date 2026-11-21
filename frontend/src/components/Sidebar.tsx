"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Stethoscope,
  Calendar,
  Video,
  FileText,
  Pill,
  Bell,
  ShieldCheck,
  Settings,
  Users,
  BarChart3,
  LogOut,
  Activity,
  Plus,
  MessageSquare
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAddDoctor?: () => void;
  onOpenAddPatient?: () => void;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddDoctor,
  onOpenAddPatient,
  unreadCount = 0
}) => {
  const { user, logout } = useAuth();
  if (!user) return null;

  const role = user.role;

  // Patient Nav Items
  const patientNav: NavItem[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "doctors", label: "Find a Doctor", icon: Stethoscope },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "consultations", label: "Consultations", icon: Video },
    { id: "records", label: "Health Records", icon: FileText },
    { id: "prescriptions", label: "Prescriptions", icon: Pill },
    { id: "notifications", label: "Notifications", icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
    { id: "security", label: "Security", icon: ShieldCheck },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // Doctor Nav Items
  const doctorNav: NavItem[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "patients", label: "Patients", icon: Users },
    { id: "consultations", label: "Consultations", icon: Video },
    { id: "records", label: "Medical Records", icon: FileText },
    { id: "prescriptions", label: "Prescriptions", icon: Pill },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "security", label: "Security", icon: ShieldCheck },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // Admin Nav Items
  const adminNav: NavItem[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "doctors", label: "Physicians", icon: Stethoscope },
    { id: "patients", label: "Patients", icon: Users },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "records", label: "Health Vault", icon: FileText },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "security", label: "Security & Audit", icon: ShieldCheck },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const currentNav = role === "patient" ? patientNav : role === "doctor" ? doctorNav : adminNav;

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between h-screen sticky top-0 flex-shrink-0 z-30">
      {/* Top Header */}
      <div>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-600/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">
                Carevia
              </span>
              <span className="text-[10px] text-teal-700 font-semibold uppercase tracking-wider block">
                Connected Care
              </span>
            </div>
          </div>
        </div>

        {/* Action button if Admin */}
        {role === "admin" && (
          <div className="p-3 border-b border-slate-100 flex gap-2">
            {onOpenAddDoctor && (
              <button
                onClick={onOpenAddDoctor}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold py-2 px-2.5 rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Doctor
              </button>
            )}
            {onOpenAddPatient && (
              <button
                onClick={onOpenAddPatient}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold py-2 px-2.5 rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Patient
              </button>
            )}
          </div>
        )}

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {role === "patient" ? "Patient Portal" : role === "doctor" ? "Clinical Workspace" : "Operations Console"}
          </p>
          {currentNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? "bg-teal-50 text-teal-800 font-bold shadow-sm shadow-teal-500/5"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="bg-teal-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer Card */}
      <div className="p-3 border-t border-slate-100">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
              {user.name ? user.name.charAt(0) : "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
              <p className="text-[10px] text-teal-700 font-semibold capitalize tracking-wide">{user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
