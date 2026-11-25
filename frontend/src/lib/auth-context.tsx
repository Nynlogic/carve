"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { apiRequest, setAuthToken, removeAuthToken, getAuthToken } from "./api";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "patient" | "doctor" | "admin";
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  quickDemoLogin: (role: "patient" | "doctor" | "admin") => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = getAuthToken();
    const cachedUser = localStorage.getItem("careflow_user");
    if (token && cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch {
        removeAuthToken();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: pass }),
      });

      const loggedUser: AuthUser = {
        id: data.user_id,
        name: data.name,
        email: data.email,
        role: data.role,
      };

      setAuthToken(data.access_token);
      localStorage.setItem("careflow_user", JSON.stringify(loggedUser));
      setUser(loggedUser);
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = async (role: "patient" | "doctor" | "admin") => {
    const credentials = {
      admin: { email: "admin@careflow.health", pass: "CareFlowAdmin123!" },
      doctor: { email: "dr.iyer@careflow.health", pass: "DoctorPass123!" },
      patient: { email: "patient.aarav@example.com", pass: "PatientPass123!" },
    }[role];

    try {
      await login(credentials.email, credentials.pass);
    } catch (err: any) {
      if (role !== "admin") {
        throw new Error(
          `Clean Canvas is active: No mock ${role}s exist. Sign in as an administrator and click "+ Add Doctor" or "+ Add Patient" to register your own!`
        );
      }
      throw err;
    }
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, quickDemoLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
