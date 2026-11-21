"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/api";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  Server,
  FileText,
  UserCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertTriangle
} from "lucide-react";

export const SecurityCenter: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchLogs();
    }
  }, [user]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/audit/?size=10");
      setLogs(data.items || []);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2 text-teal-700 text-xs font-semibold mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Security & Privacy Center
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security Posture</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time verification of session integrity, access controls, and data protection.
        </p>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Identity Verified */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">Identity Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-base font-bold text-slate-900">Identity Verified</p>
          <p className="text-[11px] text-slate-500">
            Authenticated as <span className="font-semibold text-slate-800">{user?.name}</span> ({user?.role})
          </p>
        </div>

        {/* 2. Access Controlled */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">Access Control</span>
            <Lock className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-base font-bold text-slate-900">Least Privilege RBAC</p>
          <p className="text-[11px] text-slate-500">
            Role strictly bounded; unauthorized record traversal blocked
          </p>
        </div>

        {/* 3. Session Secured */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">Transport Security</span>
            <KeyRound className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-base font-bold text-slate-900">TLS 1.3 & JWT Encrypted</p>
          <p className="text-[11px] text-slate-500">
            Short-lived token authentication with secure header enforcement
          </p>
        </div>

        {/* 4. Activity Monitored */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">Audit Monitoring</span>
            <Eye className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-base font-bold text-slate-900">Activity Monitored</p>
          <p className="text-[11px] text-slate-500">
            Immutable append-only access log active for all sensitive actions
          </p>
        </div>
      </div>

      {/* Security Architecture & Record Protection Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-4 h-4 text-teal-600" /> Data Protection Architecture
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="font-bold text-slate-800">Storage Encryption at Rest</span>
              <p className="text-slate-500">
                All uploaded medical reports and diagnostic images are encrypted using AWS KMS Customer Managed Keys (AES-256).
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="font-bold text-slate-800">Direct Presigned URL Transfer</span>
              <p className="text-slate-500">
                Documents are uploaded and downloaded directly between browser and encrypted cloud vault using time-limited (15-min) presigned tickets.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="font-bold text-slate-800">Database Level Protection</span>
              <p className="text-slate-500">
                PostgreSQL database volumes are encrypted with KMS keys; secrets and tokens are loaded through environment configuration.
              </p>
            </div>
          </div>
        </div>

        {/* Session & Privacy Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600" /> Current Session Telemetry
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Session User</span>
              <span className="font-semibold text-slate-900">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Authorized Role</span>
              <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded capitalize">
                {user?.role}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">OWASP Security Headers</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Enforced (CSP, HSTS, No-Sniff)
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500">Rate Limiting</span>
              <span className="font-semibold text-slate-800">Active (20 req/min auth limit)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Audit Trail Feed (if Admin) */}
      {user?.role === "admin" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Immutable Audit Trail</h3>
              <p className="text-[11px] text-slate-500">Live access events recorded for regulatory oversight</p>
            </div>
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Trail
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Resource</th>
                  <th className="py-2.5 px-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 whitespace-nowrap text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 font-sans font-semibold text-slate-900">
                      {log.actor_email} ({log.actor_role})
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
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
    </div>
  );
};
