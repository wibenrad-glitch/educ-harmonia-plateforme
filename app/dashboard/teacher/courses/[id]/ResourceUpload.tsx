"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ResourceUpload({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !name.trim()) return;

    setUploading(true);
    setStatus("Envoi en cours...");

    const fd = new FormData();
    fd.append("file", file);
    const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      setStatus(uploadData.error ?? "Erreur lors de l'upload");
      setUploading(false);
      return;
    }

    const type = file.type === "application/pdf" ? "PDF" : "IMAGE";

    await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, name: name.trim(), url: uploadData.url, type }),
    });

    setStatus("✅ Fichier ajouté !");
    setName("");
    if (fileRef.current) fileRef.current.value = "";
    setUploading(false);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h3 className="font-medium mb-3 text-gray-700">Uploader un fichier (PDF ou image)</h3>
      <form onSubmit={handleUpload} className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Nom (ex: Fiche de leçon — Les additions)"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 transition">
          <span>📎</span>
          <span>Choisir un fichier (PDF, image — max 5 Mo)</span>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            ref={fileRef}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setStatus(`Fichier sélectionné : ${f.name}`);
            }}
          />
        </label>
        <button
          type="submit"
          disabled={uploading}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition"
        >
          {uploading ? "Envoi..." : "Uploader"}
        </button>
        {status && <p className="text-xs text-indigo-600">{status}</p>}
      </form>
    </div>
  );
}
