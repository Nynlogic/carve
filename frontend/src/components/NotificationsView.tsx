"use client";

import React, { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import {
  Bell,
  CheckCircle2,
  Calendar,
  Pill,
  FileText,
  AlertCircle,
  Clock
} from "lucide-react";

export const NotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const data = await apiRequest("/notifications/");
      setNotifications(data || []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-xs font-semibold mb-1">
            <Bell className="w-4 h-4 text-teal-600" />
            Alerts & Reminders
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notification Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Appointment confirmations, telehealth room reminders, and record alerts.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading alerts...</div>
      ) : notifications.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start justify-between gap-4 transition ${
                n.is_read ? "bg-white" : "bg-teal-50/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                    {!n.is_read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {!n.is_read && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 flex-shrink-0"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <Bell className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">All caught up</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You do not have any unread notifications or upcoming appointment alerts.
          </p>
        </div>
      )}
    </div>
  );
};
