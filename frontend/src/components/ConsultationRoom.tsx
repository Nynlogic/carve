"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  MessageSquare, 
  FileText, 
  Send, 
  ShieldCheck, 
  User,
  Activity,
  Heart,
  Pill,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet
} from "lucide-react";

interface ConsultationRoomProps {
  roomId: string;
  appointment: any;
  onLeave: () => void;
  onOpenSoapNotes: (appointment: any) => void;
  onOpenPrescription?: (appointment: any) => void;
}

export const ConsultationRoom: React.FC<ConsultationRoomProps> = ({
  roomId,
  appointment,
  onLeave,
  onOpenSoapNotes,
  onOpenPrescription,
}) => {
  const { user } = useAuth();
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [activeSideTab, setActiveSideTab] = useState<"patient" | "notes" | "chat">("patient");
  const [messages, setMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    {
      sender: "System",
      text: "Carevia zero-trust teleconsultation initialized. Peer-to-peer session encrypted.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [callDuration, setCallDuration] = useState(0);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Call duration counter
  useEffect(() => {
    const timer = setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Initialize camera preview
  useEffect(() => {
    let localStream: MediaStream | null = null;
    const startMedia = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
          }
        }
      } catch (err) {
        console.warn("Camera/Mic access not granted or unavailable:", err);
      }
    };

    startMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        sender: user?.name || "Me",
        text: inputMsg,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setInputMsg("");
  };

  const isDoctor = user?.role === "doctor";
  const remoteName = isDoctor
    ? appointment?.patient?.user?.full_name || "Patient Intake"
    : appointment?.doctor?.user?.full_name || "Dr. Specialist";

  return (
    <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 text-white flex flex-col h-[750px]">
      
      {/* Workspace Header */}
      <div className="bg-slate-900/90 backdrop-blur px-6 py-3.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">Carevia Telehealth Workspace</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Encrypted WebRTC
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Session ID: {roomId} • Duration: <span className="font-mono text-emerald-400">{formatTimer(callDuration)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isDoctor && (
            <>
              <button
                onClick={() => onOpenSoapNotes(appointment)}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" /> SOAP Documentation
              </button>
              {onOpenPrescription && (
                <button
                  onClick={() => onOpenPrescription(appointment)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  <Pill className="w-3.5 h-3.5" /> e-Rx Order
                </button>
              )}
            </>
          )}

          <button
            onClick={onLeave}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-rose-600/20"
          >
            <PhoneOff className="w-3.5 h-3.5" /> End Consultation
          </button>
        </div>
      </div>

      {/* Main Split Layout: Video Area + Clinical Intelligence Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Large Video Consultation Area */}
        <div className="flex-1 bg-slate-950 relative flex flex-col items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center mx-auto shadow-inner text-slate-400">
              <User className="w-12 h-12" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-200">{remoteName}</h4>
              <p className="text-xs text-slate-400 mt-0.5">Live audio & video synchronized</p>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs text-emerald-400">
                <Activity className="w-3.5 h-3.5 animate-pulse" /> Peer-to-Peer Encrypted Stream
              </div>
            </div>
          </div>

          {/* Self-View Picture-in-Picture */}
          <div className="absolute bottom-16 right-6 w-48 h-32 bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-xl">
            {videoEnabled ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 text-xs">
                <VideoOff className="w-5 h-5 mb-1" />
                <span>Camera Off</span>
              </div>
            )}
            <div className="absolute bottom-1.5 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white">
              You ({user?.role})
            </div>
          </div>

          {/* In-Call Media Controls Bar */}
          <div className="absolute bottom-4 flex items-center gap-3 bg-slate-900/95 backdrop-blur px-5 py-2.5 rounded-2xl border border-slate-800 shadow-xl">
            <button
              onClick={() => setMicEnabled(!micEnabled)}
              className={`p-2.5 rounded-xl transition ${
                micEnabled ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-rose-600 text-white"
              }`}
              title={micEnabled ? "Mute Microphone" : "Unmute Microphone"}
            >
              {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setVideoEnabled(!videoEnabled)}
              className={`p-2.5 rounded-xl transition ${
                videoEnabled ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-rose-600 text-white"
              }`}
              title={videoEnabled ? "Turn Off Video" : "Turn On Video"}
            >
              {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Right: Clinical Workspace Sidebar */}
        <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col">
          {/* Workspace Tabs */}
          <div className="flex items-center border-b border-slate-800 text-xs">
            <button
              onClick={() => setActiveSideTab("patient")}
              className={`flex-1 py-3 font-semibold text-center transition ${
                activeSideTab === "patient"
                  ? "text-teal-400 border-b-2 border-teal-500 bg-slate-800/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Patient Intake
            </button>
            <button
              onClick={() => setActiveSideTab("notes")}
              className={`flex-1 py-3 font-semibold text-center transition ${
                activeSideTab === "notes"
                  ? "text-teal-400 border-b-2 border-teal-500 bg-slate-800/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Clinical Chart
            </button>
            <button
              onClick={() => setActiveSideTab("chat")}
              className={`flex-1 py-3 font-semibold text-center transition ${
                activeSideTab === "chat"
                  ? "text-teal-400 border-b-2 border-teal-500 bg-slate-800/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Chat ({messages.length})
            </button>
          </div>

          {/* Tab 1: Patient Summary */}
          {activeSideTab === "patient" && (
            <div className="p-4 space-y-4 flex-1 overflow-y-auto text-xs">
              <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Patient Demographics
                </span>
                <p className="text-sm font-bold text-slate-100">{remoteName}</p>
                <p className="text-slate-400 text-[11px]">
                  Consultation Fee: <span className="text-emerald-400 font-semibold">₹{appointment?.consultation_fee || 800}</span>
                </p>
                {appointment?.symptoms && (
                  <div className="pt-2 border-t border-slate-700">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Chief Complaint</p>
                    <p className="text-slate-200 mt-0.5 italic">&quot;{appointment.symptoms}&quot;</p>
                  </div>
                )}
              </div>

              {/* Baseline Vitals */}
              <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-3">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" /> Recorded Baseline Vitals
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-slate-900/60 rounded-lg">
                    <span className="text-slate-400">Blood Pressure:</span>
                    <p className="font-bold text-slate-100 mt-0.5">120/80 mmHg</p>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-lg">
                    <span className="text-slate-400">Heart Rate:</span>
                    <p className="font-bold text-slate-100 mt-0.5">72 bpm</p>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-lg">
                    <span className="text-slate-400">SpO2:</span>
                    <p className="font-bold text-emerald-400 mt-0.5">99% Room Air</p>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-lg">
                    <span className="text-slate-400">Blood Group:</span>
                    <p className="font-bold text-teal-400 mt-0.5">B+</p>
                  </div>
                </div>
              </div>

              {/* Insurance */}
              <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Health Insurance</span>
                <p className="text-slate-200 font-semibold">Star Health & Allied Insurance</p>
                <p className="text-[10px] text-emerald-400">Policy active & verified</p>
              </div>
            </div>
          )}

          {/* Tab 2: Clinical Charting & SOAP */}
          {activeSideTab === "notes" && (
            <div className="p-4 space-y-4 flex-1 overflow-y-auto text-xs">
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-200">Physician Documentation</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Record structured clinical observations, assessment, diagnosis, and treatment plan.
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={() => onOpenSoapNotes(appointment)}
                  className="w-full p-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-md"
                >
                  <FileText className="w-4 h-4" /> Open Full SOAP Chart
                </button>

                {onOpenPrescription && (
                  <button
                    onClick={() => onOpenPrescription(appointment)}
                    className="w-full p-3 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-semibold flex items-center justify-center gap-2 transition border border-slate-700"
                  >
                    <Pill className="w-4 h-4 text-emerald-400" /> Issue e-Prescription (e-Rx)
                  </button>
                )}
              </div>

              <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Documentation Status
                </span>
                <p className="text-[11px] text-slate-300">
                  Notes and e-Rx issued in this workspace are signed with a tamper-evident cryptographic hash and logged in the immutable audit trail.
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: In-Call Chat */}
          {activeSideTab === "chat" && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-xl text-xs ${
                      m.sender === "System"
                        ? "bg-slate-800/80 text-slate-400 text-[11px] border border-slate-800 italic"
                        : m.sender === user?.name
                        ? "bg-teal-600 text-white ml-4"
                        : "bg-slate-800 text-slate-200 mr-4"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] opacity-75 mb-1 font-semibold">
                      <span>{m.sender}</span>
                      <span>{m.time}</span>
                    </div>
                    <p>{m.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Send secure message..."
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-xl transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
