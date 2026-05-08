"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type PendingAssignment = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  courseName: string;
  teacherName: string;
};

type SubmittedAssignment = {
  id: string;
  title: string;
  courseName: string;
  submission: {
    content: string | null;
    fileUrl: string | null;
    grade: { score: number; feedback: string | null } | null;
  } | null;
};

function getScoreColor(score: number) {
  if (score >= 16) return "bg-green-100 text-green-700 border-green-200";
  if (score >= 12) return "bg-blue-100 text-blue-700 border-blue-200";
  if (score >= 8) return "bg-orange-100 text-orange-700 border-orange-200";
  return "bg-red-100 text-red-700 border-red-200";
}

function getDaysLeft(dueDate: string) {
  const diff = new Date(dueDate).getTime() - new Date().getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days;
}

export default function StudentAssignmentsClient({
  studentId,
  pending,
  submitted,
}: {
  studentId: string;
  pending: PendingAssignment[];
  submitted: SubmittedAssignment[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>, assignmentId: string) {
    e.preventDefault();
    setFormErrors({});

    const form = e.currentTarget;
    const content = (form.elements.namedItem("content") as HTMLTextAreaElement).value.trim();
    const fileInput = fileRefs.current[assignmentId];
    const file = fileInput?.files?.[0];

    if (!content && !file) {
      setFormErrors((p) => ({ ...p, [assignmentId]: "Tu dois écrire une réponse ou joindre un fichier." }));
      return;
    }

    if (file && file.size > 5 * 1024 * 1024) {
      setFormErrors((p) => ({ ...p, [assignmentId]: "Le fichier dépasse la limite de 5 Mo." }));
      return;
    }

    setSubmitting(assignmentId);
    let fileUrl: string | null = null;

    if (file) {
      setUploadProgress((p) => ({ ...p, [assignmentId]: "Envoi du fichier..." }));
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setFormErrors((p) => ({ ...p, [assignmentId]: data.error ?? "Erreur lors de l'envoi du fichier." }));
        setSubmitting(null);
        setUploadProgress((p) => ({ ...p, [assignmentId]: "" }));
        return;
      }
      fileUrl = data.url;
      setUploadProgress((p) => ({ ...p, [assignmentId]: "" }));
    }

    const res = await fetch("/api/assignments/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId, studentId, content: content || null, fileUrl }),
    });

    setSubmitting(null);

    if (!res.ok) {
      const data = await res.json();
      setFormErrors((p) => ({ ...p, [assignmentId]: data.error ?? "Une erreur est survenue." }));
      return;
    }

    setSubmitSuccess(assignmentId);
    setTimeout(() => {
      setExpanded(null);
      setSubmitSuccess(null);
      router.refresh();
    }, 1200);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <div className="max-w-4xl mx-auto p-6 md:p-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <a href="/dashboard/student" className="text-sm text-gray-400 hover:text-gray-600 transition inline-flex items-center gap-1">
            ← Retour au tableau de bord
          </a>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-3 flex items-center gap-3">
            <span className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">✏️</span>
            Mes devoirs
          </h1>
          <p className="text-gray-500 text-sm mt-1 ml-1">
            {pending.length} à rendre · {submitted.length} rendu{submitted.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* ── Devoirs à rendre ── */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2.5">
            <span className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center font-bold text-orange-600 text-sm">{pending.length}</span>
            Devoirs à rendre
          </h2>

          {pending.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-gray-200">
              <span className="text-5xl block mb-3">🎉</span>
              <p className="text-gray-600 font-semibold text-lg">Tous tes devoirs sont rendus !</p>
              <p className="text-gray-400 text-sm mt-1">Bravo, continue comme ça !</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map((a) => {
                const daysLeft = getDaysLeft(a.dueDate);
                const isUrgent = daysLeft <= 2;
                const isOpen = expanded === a.id;

                return (
                  <div key={a.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition ${isUrgent ? "border-red-200" : "border-gray-100"}`}>

                    {/* En-tête du devoir */}
                    <button
                      onClick={() => setExpanded(isOpen ? null : a.id)}
                      className="w-full px-6 py-5 flex items-center gap-4 text-left hover:bg-gray-50 transition"
                    >
                      <span className={`text-3xl shrink-0 ${isUrgent ? "animate-pulse" : ""}`}>
                        {isUrgent ? "🔥" : "📝"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-base truncate">{a.title}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{a.courseName} · {a.teacherName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                          daysLeft < 0 ? "bg-red-100 text-red-600" :
                          isUrgent ? "bg-orange-100 text-orange-600" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {daysLeft < 0 ? "En retard" : daysLeft === 0 ? "Aujourd'hui" : `${daysLeft} jour${daysLeft > 1 ? "s" : ""}`}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">
                          Limite : {new Date(a.dueDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <span className={`text-gray-400 text-lg transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
                    </button>

                    {/* Formulaire de rendu */}
                    {isOpen && (
                      <div className="px-6 pb-6 border-t border-gray-50 pt-4">
                        {a.description && (
                          <div className="bg-indigo-50 rounded-xl p-3 mb-4 text-sm text-indigo-800">
                            <p className="font-medium mb-1">Instructions :</p>
                            <p>{a.description}</p>
                          </div>
                        )}

                        <form onSubmit={(e) => handleSubmit(e, a.id)} className="space-y-3">
                          <textarea
                            name="content"
                            placeholder="Ta réponse (optionnel si tu joins un fichier)..."
                            rows={4}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition resize-none"
                          />

                          <div className="flex flex-col sm:flex-row gap-3">
                            <label className="flex-1 flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 transition">
                              <span>📎</span>
                              <span>Joindre un fichier (PDF, image — max 5 Mo)</span>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.webp"
                                className="hidden"
                                ref={(el) => { fileRefs.current[a.id] = el; }}
                                onChange={(e) => {
                                  const name = e.target.files?.[0]?.name;
                                  setUploadProgress((p) => ({ ...p, [a.id]: name ? `📎 ${name}` : "" }));
                                }}
                              />
                            </label>
                            <button
                              type="submit"
                              disabled={submitting === a.id}
                              className="shrink-0 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
                            >
                              {submitting === a.id ? "Envoi..." : "Rendre le devoir"}
                            </button>
                          </div>

                          {uploadProgress[a.id] && (
                            <p className="text-xs text-indigo-600">{uploadProgress[a.id]}</p>
                          )}

                          {formErrors[a.id] && (
                            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                              <span className="text-red-500 shrink-0">⚠️</span>
                              <p className="text-red-700 text-sm font-medium">{formErrors[a.id]}</p>
                            </div>
                          )}

                          {submitSuccess === a.id && (
                            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                              <span className="text-green-600 shrink-0">✅</span>
                              <p className="text-green-700 text-sm font-medium">Devoir rendu avec succès !</p>
                            </div>
                          )}
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Devoirs rendus ── */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2.5">
            <span className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center font-bold text-green-700 text-sm">{submitted.length}</span>
            Devoirs rendus
          </h2>

          {submitted.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
              <p className="text-gray-500 font-medium">Aucun devoir rendu pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submitted.map((a) => (
                <div key={a.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 flex items-center gap-4 hover:shadow-md transition">
                  <span className="text-2xl shrink-0">
                    {a.submission?.grade ? "✅" : "⏳"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate text-base">{a.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{a.courseName}</p>
                    {a.submission?.content && (
                      <p className="text-xs text-gray-400 mt-1 truncate italic">"{a.submission.content}"</p>
                    )}
                    {a.submission?.fileUrl && (
                      <a href={a.submission.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:underline mt-0.5 block">
                        📎 Voir le fichier joint
                      </a>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    {a.submission?.grade ? (
                      <div>
                        <span className={`border text-sm font-bold px-3 py-1 rounded-xl inline-block ${getScoreColor(a.submission.grade.score)}`}>
                          {a.submission.grade.score}/20
                        </span>
                        {a.submission.grade.feedback && (
                          <p className="text-xs text-gray-500 mt-1 max-w-[160px] text-right">
                            {a.submission.grade.feedback}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-700 text-xs px-3 py-1 rounded-full font-medium">
                        En attente
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
