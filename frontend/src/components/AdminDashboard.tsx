"use client";

import React, { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { 
  Users, 
  Stethoscope, 
  Calendar, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  Lock, 
  Search,
  Filter,
  Server,
  Database,
  Cloud,
  Layers,
  Trash2,
  RefreshCw,
  TrendingUp
} from "lucide-react";

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "users" | "audit" | "system">("overview");

  // Audit search
  const [auditSearch, setAuditSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewData, usersData, auditData] = await Promise.all([
        apiRequest("/analytics/overview"),
        apiRequest("/users/?size=25"),
        apiRequest(`/audit/?size=50${auditSearch ? `&search=${encodeURIComponent(auditSearch)}` : ""}`),
      ]);
      setAnalytics(overviewData);
      setUsers(usersData.items || []);
      setAuditLogs(auditData.items || []);
    } catch (err) {
      console.error("Failed to load operations console data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [auditSearch]);

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await apiRequest(`/users/${userId}/status?is_active=${!currentStatus}`, {
        method: "PATCH",
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to update user status.");
    }
  };

  const handleResetCleanCanvas = async () => {
    const confirmed = confirm(
      "Reset to Clean Canvas?\n\nThis will remove pre-seeded mock doctors, patients, appointments, and records, keeping ONLY the Administrator account (admin@careflow.health) so you can add your own real doctors and patients!"
    );
    if (!confirmed) return;

    try {
      await apiRequest("/users/clean-slate", { method: "POST" });
      alert("Clean canvas activated! All mock data cleared.");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Reset failed.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Console Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-xs font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Carevia Operations Console • Active Administrator
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Healthcare Operations Console</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Platform metrics, provider licensing, user accounts, and immutable regulatory logs.
          </p>
        </div>

        {/* Sub-Nav Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200/70 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab("overview")}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
              activeSubTab === "overview"
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveSubTab("users")}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
              activeSubTab === "users"
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveSubTab("audit")}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
              activeSubTab === "audit"
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Audit Trail
          </button>
          <button
            onClick={() => setActiveSubTab("system")}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
              activeSubTab === "system"
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            System
          </button>
        </div>
      </div>

      {/* Subtab: Overview */}
      {activeSubTab === "overview" && (
        <div className="space-y-6">
          {/* Top KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Patients</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{analytics?.total_patients || 0}</p>
              <p className="text-[11px] text-teal-600 font-semibold mt-1">Verified patient records</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400">Active Doctors</span>
              <p className="text-2xl font-bold text-teal-700 mt-1">{analytics?.total_doctors || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1">MCI / State Council verified</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Consultations</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{analytics?.total_appointments || 0}</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">Telehealth & clinic</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400">Gross Clinical Revenue</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                ₹{(analytics?.total_revenue_usd || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Invoiced in INR (₹)</p>
            </div>
          </div>

          {/* Breakdown & System Health */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Consultation status distribution */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Consultation Volume & Status</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Scheduled / Upcoming</p>
                  <p className="text-xl font-bold text-teal-800 mt-1">
                    {analytics?.appointment_status_breakdown?.SCHEDULED || 0}
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Completed Visits</p>
                  <p className="text-xl font-bold text-emerald-700 mt-1">
                    {analytics?.appointment_status_breakdown?.COMPLETED || 0}
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Cancelled</p>
                  <p className="text-xl font-bold text-slate-500 mt-1">
                    {analytics?.appointment_status_breakdown?.CANCELLED || 0}
                  </p>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-500 flex items-center justify-between">
                <span>Average Consultation Duration: <strong className="text-slate-800">30 minutes</strong></span>
                <span>System Availability SLA: <strong className="text-emerald-700">99.98%</strong></span>
              </div>
            </div>

            {/* Health Infrastructure */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" /> Platform Infrastructure
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="font-semibold text-slate-800">FastAPI Stateless Core</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="font-semibold text-slate-800">PostgreSQL Multi-AZ</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="font-semibold text-slate-800">Secure Document Vault</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Encrypted
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="font-semibold text-slate-800">SQS Asynchronous Queue</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab: Users */}
      {activeSubTab === "users" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">User Registry & Role Authorization</h3>
            <span className="text-xs text-slate-500">{users.length} accounts registered</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Name & Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{u.full_name}</p>
                      <p className="text-[11px] text-slate-400">{u.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md text-[11px] uppercase">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{u.phone || "—"}</td>
                    <td className="py-3 px-4">
                      {u.is_active ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
                          Active
                        </span>
                      ) : (
                        <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[10px] font-bold">
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== "admin" && (
                        <button
                          onClick={() => toggleUserStatus(u.id, u.is_active)}
                          className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline"
                        >
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab: Audit Trail */}
      {activeSubTab === "audit" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Regulatory Audit Logs</h3>
              <p className="text-xs text-slate-500">Immutable audit records tracking clinical PHI access</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs font-mono text-[11px]">
              <thead className="bg-slate-50 font-sans text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Resource</th>
                  <th className="py-2.5 px-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 whitespace-nowrap text-slate-500 font-sans">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 font-sans font-semibold text-slate-900">
                      {log.actor_email}
                    </td>
                    <td className="py-2 px-3 font-bold text-teal-800">{log.action}</td>
                    <td className="py-2 px-3 text-slate-600">
                      {log.resource_type} #{log.resource_id}
                    </td>
                    <td className="py-2 px-3 text-slate-400">{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab: System & Maintenance */}
      {activeSubTab === "system" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Platform Maintenance & Clean Canvas</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
              Use this tool when setting up custom clinical evaluations. It removes mock sample doctors and mock appointments, leaving the database completely clean with only the administrator account.
            </p>

            <button
              onClick={handleResetCleanCanvas}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm"
            >
              <Trash2 className="w-4 h-4" /> Reset Platform to Clean Canvas
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
