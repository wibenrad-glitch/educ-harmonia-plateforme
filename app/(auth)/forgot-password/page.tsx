"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-50 via-white to-purple-50">

      {/* ── Panneau gauche ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 flex-col items-center justify-center p-16 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
        <div className="relative z-10 text-center">
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center text-5xl mb-8 mx-auto shadow-2xl backdrop-blur-sm">
            🎓
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Éduc&apos;Harmonia</h1>
          <p className="text-indigo-200 text-lg leading-relaxed max-w-sm">
            La plateforme d&apos;enseignement en ligne pensée pour vos élèves et vos enseignants.
          </p>
        </div>
      </div>

      {/* ── Panneau droit ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Logo mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg shadow-indigo-200">
              🎓
            </div>
            <h1 className="text-2xl font-bold text-indigo-700">Éduc&apos;Harmonia</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8 md:p-10">

            {!submitted ? (
              <>
                <div className="mb-8">
                  <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-2xl mb-4">
                    🔑
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Mot de passe oublié</h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Indiquez votre adresse email. Votre administrateur sera notifié pour réinitialiser votre accès.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Adresse email
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">✉️</span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                        className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-4 py-3 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-md shadow-indigo-200 hover:shadow-lg"
                  >
                    Envoyer la demande →
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-5">
                  ✅
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Demande envoyée</h2>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                  Votre administrateur a été notifié. Il vous contactera pour réinitialiser votre mot de passe.
                </p>
                <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-sm text-indigo-700">
                  Email transmis : <span className="font-bold">{email}</span>
                </div>
              </div>
            )}

            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <Link href="/login" className="text-sm text-indigo-600 font-medium hover:underline">
                ← Retour à la connexion
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            © {new Date().getFullYear()} Éduc&apos;Harmonia — Tous droits réservés
          </p>
        </div>
      </div>

    </div>
  );
}
