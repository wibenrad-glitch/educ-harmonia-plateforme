import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">

        {/* Illustration */}
        <div className="relative mb-8 inline-block">
          <div className="w-32 h-32 bg-indigo-100 rounded-3xl flex items-center justify-center text-7xl mx-auto shadow-lg">
            🔍
          </div>
          <div className="absolute -top-2 -right-2 w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-xl shadow-sm">
            ❓
          </div>
        </div>

        {/* Code */}
        <p className="text-8xl font-black text-indigo-200 leading-none mb-2">404</p>

        {/* Texte */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Page introuvable</h1>
        <p className="text-gray-500 text-base leading-relaxed mb-8">
          Oups ! La page que tu cherches n&apos;existe pas ou a été déplacée.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition shadow-md shadow-indigo-200"
          >
            🏠 Retour au tableau de bord
          </Link>
          <Link
            href="/login"
            className="bg-white text-gray-700 border-2 border-gray-200 px-6 py-3 rounded-xl font-bold text-sm hover:border-gray-400 transition"
          >
            🔑 Se connecter
          </Link>
        </div>

        {/* Branding */}
        <p className="text-xs text-gray-400 mt-10">Éduc&apos;Harmonia</p>
      </div>
    </div>
  );
}
