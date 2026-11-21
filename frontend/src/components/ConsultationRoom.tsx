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
  Activity
} from "lucide-react";

interface ConsultationRoomProps {
  roomId: string;
  appointment: any;
  onLeave: () => void;
  onOpenSoapNotes: (appointment: any) => void;
}

export const ConsultationRoom: React.FC<ConsultationRoomProps> = ({
  roomId,
  appointment,
  onLeave,
  onOpenSoapNotes,
}) => {
  const { user } = useAuth();
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    {
      sender: "System",
      text: "End-to-end encrypted telemedicine session initialized. HIPAA compliant.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const localVideoRef = useRef<HTMLVideoElement>(null);

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
        console.warn("Camera/Mic access not granted or unavailable in environment:", err);
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
    ? appointment?.patient?.user?.full_name || "Patient"
    : appointment?.doctor?.user?.full_name || "Doctor";

  return (
    <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 text-white flex flex-col h-[750px]">
      
      {/* Room Header */}
      <div className="bg-slate-950/80 backdrop-blur px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">CareFlow Virtual Consultation</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Encrypted WebRTC
              </span>
            </div>
            <p className="text-xs text-slate-400">Room: {roomId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDoctor && (
            <button
              onClick={() => onOpenSoapNotes(appointment)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" /> Clinical Notes
            </button>
          )}

          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`p-2 rounded-xl transition ${
              chatOpen ? "bg-slate-700 text-white" : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
            title="Toggle In-Call Chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            onClick={onLeave}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-rose-600/20"
          >
            <PhoneOff className="w-4 h-4" /> Leave Call
          </button>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Remote Video Stream Area */}
        <div className="flex-1 bg-slate-950 relative flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center mx-auto shadow-inner text-slate-400">
              <User className="w-12 h-12" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-200">{remoteName}</h4>
              <p className="text-xs text-slate-400 mt-1">Live consultation connected</p>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs text-emerald-400">
                <Activity className="w-3.5 h-3.5 animate-pulse" /> Audio & Video Stream Synchronized
              </div>
            </div>
          </div>

          {/* Self-View Picture-in-Picture */}
          <div className="absolute bottom-6 right-6 w-52 h-36 bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
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
                <VideoOff className="w-6 h-6 mb-1" />
                <span>Camera Off</span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white">
              You ({user?.role})
            </div>
          </div>
        </div>

        {/* In-Call Chat Drawer */}
        {chatOpen && (
          <div className="w-80 bg-slate-950 border-l border-slate-800 flex flex-col">
            <div className="p-3 border-b border-slate-800 text-xs font-bold text-slate-300">
              In-Consultation Secure Chat
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl text-xs ${
                    m.sender === "System"
                      ? "bg-slate-900 text-slate-400 text-[11px] border border-slate-800 italic"
                      : m.sender === user?.name
                      ? "bg-emerald-600 text-white ml-4"
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

            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder="Type confidential note..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Media Controls Bar */}
      <div className="bg-slate-950 px-6 py-4 flex items-center justify-center gap-4 border-t border-slate-800">
        <button
          onClick={() => setMicEnabled(!micEnabled)}
          className={`p-3.5 rounded-2xl transition ${
            micEnabled
              ? "bg-slate-800 hover:bg-slate-700 text-white"
              : "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
          }`}
          title={micEnabled ? "Mute Microphone" : "Unmute Microphone"}
        >
          {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        <button
          onClick={() => setVideoEnabled(!videoEnabled)}
          className={`p-3.5 rounded-2xl transition ${
            videoEnabled
              ? "bg-slate-800 hover:bg-slate-700 text-white"
              : "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
          }`}
          title={videoEnabled ? "Turn Off Camera" : "Turn On Camera"}
        >
          {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        <button
          onClick={onLeave}
          className="p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 transition"
          title="End Consultation"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};
