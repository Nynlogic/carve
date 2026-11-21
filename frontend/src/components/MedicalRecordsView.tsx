"use client";

import React, { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { 
  FileText, 
  UploadCloud, 
  Download, 
  ShieldCheck, 
  Filter, 
  FileImage, 
  AlertCircle,
  Clock,
  CheckCircle2,
  X
} from "lucide-react";

export const MedicalRecordsView: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload Form state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState("LAB_REPORT");
  const [docDesc, setDocDesc] = useState("");

  const categories = [
    "ALL",
    "LAB_REPORT",
    "IMAGING",
    "PRESCRIPTION",
    "DISCHARGE_SUMMARY",
    "CLINICAL_NOTE",
  ];

  const fetchRecords = async () => {
    setLoading(true);
    try {
      let query = "/medical-records/?size=50";
      if (categoryFilter !== "ALL") {
        query += `&category=${categoryFilter}`;
      }
      const data = await apiRequest(query);
      setRecords(data.items || []);
    } catch (err) {
      console.error("Failed to load records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [categoryFilter]);

  const handleDownload = async (recordId: number, fileName: string) => {
    try {
      const data = await apiRequest(`/medical-records/${recordId}/download-url`);
      const downloadUrl = data.download_url;
      
      // If relative URL (local fallback), prepend backend host
      const fullUrl = downloadUrl.startsWith("http")
        ? downloadUrl
        : `http://localhost:8000${downloadUrl}`;

      window.open(fullUrl, "_blank");
    } catch (err: any) {
      alert(err.message || "Failed to download document.");
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !docTitle.trim()) {
      setError("Please select a file and enter a title.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // 1. Request Presigned Upload URL from FastAPI
      const presignedData = await apiRequest("/medical-records/upload-request", {
        method: "POST",
        body: JSON.stringify({
          file_name: uploadFile.name,
          mime_type: uploadFile.type || "application/pdf",
          file_size_bytes: uploadFile.size,
          category: docCategory,
          title: docTitle,
          description: docDesc,
        }),
      });

      const { upload_url, file_key } = presignedData;

      // 2. Direct upload to S3 (or local simulation endpoint)
      const targetUploadUrl = upload_url.startsWith("http")
        ? upload_url
        : `http://localhost:8000${upload_url}`;

      const uploadResp = await fetch(targetUploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": uploadFile.type || "application/pdf",
        },
        body: uploadFile,
      });

      if (!uploadResp.ok) {
        throw new Error("Direct storage upload failed.");
      }

      // 3. Confirm record creation in database
      await apiRequest("/medical-records/confirm", {
        method: "POST",
        body: JSON.stringify({
          patient_id: user?.id,
          title: docTitle,
          description: docDesc,
          category: docCategory,
          file_key: file_key,
          file_name: uploadFile.name,
          file_size_bytes: uploadFile.size,
          mime_type: uploadFile.type || "application/pdf",
        }),
      });

      setShowUploadModal(false);
      setUploadFile(null);
      setDocTitle("");
      setDocDesc("");
      fetchRecords();
    } catch (err: any) {
      setError(err.message || "Upload process failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Encrypted Medical Records (EHR)</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> KMS Encrypted
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            HIPAA-compliant document storage using time-limited S3 presigned URLs.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" /> Upload Medical File
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`text-xs px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition ${
              categoryFilter === cat
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {cat.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Records Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-900">No medical records found</h3>
          <p className="text-xs text-slate-500 mt-1">Upload diagnostic blood work, echocardiograms, or MRI scans.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {records.map((rec) => {
            const isImaging = rec.category === "IMAGING";
            const sizeKb = Math.round(rec.file_size_bytes / 1024);

            return (
              <div
                key={rec.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 transition shadow-sm flex flex-col justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      isImaging ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {isImaging ? <FileImage className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase">
                        {rec.category.replace("_", " ")}
                      </span>
                      <span className="text-[11px] text-slate-400">{sizeKb} KB</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 truncate mt-1">{rec.title}</h4>
                    {rec.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1">{rec.description}</p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(rec.created_at).toLocaleDateString()}</span>
                  </div>

                  <button
                    onClick={() => handleDownload(rec.id, rec.file_name)}
                    className="bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-800 font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Presigned Download
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Upload Encrypted Health Document</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleFileUpload} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Comprehensive Metabolic Panel"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="LAB_REPORT">Lab Report</option>
                  <option value="IMAGING">Diagnostic Imaging (X-Ray, MRI, Echo)</option>
                  <option value="PRESCRIPTION">Prescription</option>
                  <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                  <option value="CLINICAL_NOTE">Clinical Note</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select File (PDF, JPEG, PNG, DICOM)</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.dcm"
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Clinical Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={docDesc}
                  onChange={(e) => setDocDesc(e.target.value)}
                  placeholder="e.g. Performed fasting at Quest Diagnostics..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <UploadCloud className="w-4 h-4" />
                  {uploading ? "Encrypting & Uploading..." : "Upload to S3 KMS"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
