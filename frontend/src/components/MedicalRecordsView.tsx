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
  X,
  Search,
  Lock,
  Plus
} from "lucide-react";

export const MedicalRecordsView: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload Form state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState("LAB_REPORT");
  const [docDesc, setDocDesc] = useState("");

  const categories = [
    { id: "ALL", label: "All Documents" },
    { id: "LAB_REPORT", label: "Lab Reports" },
    { id: "IMAGING", label: "Imaging & Radiology" },
    { id: "PRESCRIPTION", label: "Prescriptions" },
    { id: "DISCHARGE_SUMMARY", label: "Discharge Summaries" },
    { id: "CLINICAL_NOTE", label: "Clinical Notes" },
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
      
      const fullUrl = downloadUrl.startsWith("http")
        ? downloadUrl
        : `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/api\/v1$/, "")}${downloadUrl}`;

      window.open(fullUrl, "_blank");
    } catch (err: any) {
      alert(err.message || "Failed to download document.");
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setError("Please select a file to upload.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const mimeType = uploadFile.type || "application/octet-stream";

      // 1) Ask the API for a short-lived presigned upload URL
      const ticket = await apiRequest("/medical-records/upload-request", {
        method: "POST",
        body: JSON.stringify({
          title: docTitle,
          category: docCategory,
          description: docDesc || undefined,
          file_name: uploadFile.name,
          file_size_bytes: uploadFile.size,
          mime_type: mimeType,
        }),
      });

      // 2) Upload the file directly to encrypted storage
      const targetUrl = ticket.upload_url.startsWith("http")
        ? ticket.upload_url
        : `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/api\/v1$/, "")}${ticket.upload_url}`;

      const res = await fetch(targetUrl, {
        method: "PUT",
        headers: { "Content-Type": mimeType },
        body: uploadFile,
      });
      if (!res.ok) {
        throw new Error(`Cloud upload failed (${res.status}): ${res.statusText}`);
      }

      // 3) Record the metadata once the object is stored
      await apiRequest("/medical-records/confirm", {
        method: "POST",
        body: JSON.stringify({
          title: docTitle,
          category: docCategory,
          description: docDesc || undefined,
          file_key: ticket.file_key,
          file_name: uploadFile.name,
          file_size_bytes: uploadFile.size,
          mime_type: mimeType,
        }),
      });

      setShowUploadModal(false);
      setDocTitle("");
      setDocDesc("");
      setUploadFile(null);
      await fetchRecords();
    } catch (err: any) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.title?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-xs font-semibold mb-1">
            <Lock className="w-3.5 h-3.5 text-teal-600" />
            Carevia Health Vault • Client-Side Presigned Encryption
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Health Records Vault</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Encrypted diagnostic reports, clinical notes, and medical documents.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records by title, category, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                categoryFilter === cat.id
                  ? "bg-teal-50 text-teal-800 font-bold border border-teal-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading vault documents...</div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No health records found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? "No records matched your search filter."
              : "Upload diagnostic reports, lab blood work, echocardiograms, or MRI scans."}
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-2 text-xs font-bold text-teal-700 hover:text-teal-800"
          >
            + Upload Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecords.map((rec) => {
            const isImaging = rec.category === "IMAGING";
            const sizeKb = Math.round(rec.file_size_bytes / 1024);

            return (
              <div
                key={rec.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-teal-400 hover:shadow-md transition flex flex-col justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isImaging ? "bg-indigo-50 text-indigo-700" : "bg-teal-50 text-teal-700"
                    }`}
                  >
                    {isImaging ? <FileImage className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                        {rec.category.replace("_", " ")}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Encrypted
                      </span>
                      <span className="text-[11px] text-slate-400 ml-auto">{sizeKb} KB</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 truncate mt-1">{rec.title}</h4>
                    {rec.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1">{rec.description}</p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(rec.created_at).toLocaleDateString()}</span>
                  </div>

                  <button
                    onClick={() => handleDownload(rec.id, rec.file_name)}
                    className="bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-800 font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-sm text-xs"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
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
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Upload to Health Vault</h3>
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
                  placeholder="e.g. Complete Blood Count & Lipid Profile"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
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
                  placeholder="e.g. Performed fasting at Apollo Diagnostics..."
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
                  className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <UploadCloud className="w-4 h-4" />
                  {uploading ? "Encrypting & Uploading..." : "Upload Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
