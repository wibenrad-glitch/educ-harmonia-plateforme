import Link from "next/link";

const classes = [
  {
    short: "GS",
    name: "Grande Section",
    desc: "Apprendre en jouant, découvrir en s'éveillant.",
    img: "/carte-primaire.jpeg",
    // position de la carte dans l'image (1ère sur 3)
    pos: "0%",
    border: "border-pink-400",
    accent: "text-pink-500",
    bg: "bg-pink-50",
    dots: "bg-pink-400",
  },
  {
    short: "CP",
    name: "Cours Préparatoire",
    desc: "Entrer dans la lecture, apprentissage de la lecture et initiation au calcul.",
    img: "/carte-primaire.jpeg",
    pos: "33.33%",
    border: "border-orange-400",
    accent: "text-orange-500",
    bg: "bg-orange-50",
    dots: "bg-orange-400",
  },
  {
    short: "CE1",
    name: "Cours Élémentaire 1ère année",
    desc: "Consolider les apprentissages et gagner en autonomie.",
    img: "/carte-primaire.jpeg",
    pos: "66.66%",
    border: "border-blue-400",
    accent: "text-blue-500",
    bg: "bg-blue-50",
    dots: "bg-blue-400",
  },
  {
    short: "CE2",
    name: "Cours Élémentaire 2e année",
    desc: "Approfondir les apprentissages et développer la compréhension.",
    img: "/carte-primaire-1.jpeg",
    pos: "0%",
    border: "border-green-400",
    accent: "text-green-500",
    bg: "bg-green-50",
    dots: "bg-green-400",
  },
  {
    short: "CM1",
    name: "Cours Moyen 1ère année",
    desc: "Renforcer les connaissances et gagner en méthode et en autonomie.",
    img: "/carte-primaire-1.jpeg",
    pos: "33.33%",
    border: "border-purple-400",
    accent: "text-purple-500",
    bg: "bg-purple-50",
    dots: "bg-purple-400",
  },
  {
    short: "CM2",
    name: "Cours Moyen 2e année",
    desc: "Se préparer au collège et devenir acteur de ses apprentissages.",
    img: "/carte-primaire-1.jpeg",
    pos: "66.66%",
    border: "border-blue-500",
    accent: "text-blue-600",
    bg: "bg-blue-50",
    dots: "bg-blue-500",
  },
];

const valeurs = [
  {
    emoji: "🌱",
    titre: "Épanouissement",
    texte: "Chaque enfant est unique. Nous adaptons notre pédagogie pour que chaque élève progresse à son rythme, en confiance et en sérénité.",
  },
  {
    emoji: "📚",
    titre: "Instruction solide",
    texte: "Des programmes rigoureux alignés sur les fondamentaux : lecture, écriture, calcul, compréhension. Rien n'est laissé au hasard.",
  },
  {
    emoji: "🏠",
    titre: "100% en ligne",
    texte: "Des cours en direct par Zoom, des devoirs, des ressources pédagogiques et un suivi personnalisé — depuis n'importe où.",
  },
];

const etapes = [
  { num: "1", titre: "Inscription", texte: "Créez votre compte et choisissez la classe de votre enfant. L'accueil est personnalisé dès le premier jour." },
  { num: "2", titre: "Cours en direct", texte: "Des sessions Zoom avec des professeurs qualifiés, dans un cadre bienveillant et structuré." },
  { num: "3", titre: "Suivi et progrès", texte: "Devoirs corrigés, notes, ressources de cours et messagerie avec les enseignants. Tout en un seul endroit." },
];

const matieres = [
  { emoji: "🔢", nom: "Mathématiques" },
  { emoji: "📖", nom: "Français" },
  { emoji: "🌍", nom: "Histoire-Géo" },
  { emoji: "🔬", nom: "Sciences" },
  { emoji: "🎨", nom: "Arts" },
  { emoji: "🏃", nom: "Éducation physique" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎓</span>
            <span className="text-xl font-bold text-indigo-700">Educ'Harmonia</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#valeurs" className="hover:text-indigo-600 transition">Notre approche</a>
            <a href="#classes" className="hover:text-indigo-600 transition">Les classes</a>
            <a href="#fonctionnement" className="hover:text-indigo-600 transition">Fonctionnement</a>
            <a href="#contact" className="hover:text-indigo-600 transition">Contact</a>
          </nav>
          <Link
            href="/login"
            className="bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-indigo-700 transition"
          >
            Accéder à l'espace élève
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            École 100% en ligne · GS au CM2
          </span>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            L'école à la maison,<br />
            <span className="text-indigo-600">sans compromis.</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Educ'Harmonia offre à chaque enfant une instruction solide et bienveillante,
            de la Grande Section au CM2, depuis n'importe où dans le monde.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-indigo-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
            >
              Rejoindre Educ'Harmonia
            </Link>
            <a
              href="#fonctionnement"
              className="border border-gray-300 text-gray-700 px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-50 transition"
            >
              Comment ça marche ?
            </a>
          </div>
        </div>
      </section>

      {/* Chiffres clés */}
      <section className="py-12 bg-indigo-600">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          {[
            { val: "6", label: "Niveaux scolaires" },
            { val: "100%", label: "En ligne" },
            { val: "6", label: "Matières enseignées" },
            { val: "♾️", label: "Accessibilité mondiale" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-4xl font-bold">{item.val}</p>
              <p className="text-indigo-200 text-sm mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Valeurs */}
      <section id="valeurs" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Notre approche pédagogique</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Une école pensée pour l'enfant, pas l'inverse.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {valeurs.map((v) => (
              <div key={v.titre} className="bg-gray-50 rounded-2xl p-8 text-center hover:shadow-md transition">
                <span className="text-5xl block mb-4">{v.emoji}</span>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{v.titre}</h3>
                <p className="text-gray-500 leading-relaxed">{v.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Classes */}
      <section id="classes" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Les classes disponibles</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              De la Grande Section de maternelle au CM2 — le parcours complet de l'école primaire.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((c) => (
              <div
                key={c.short}
                className={`${c.bg} border-2 ${c.border} rounded-3xl p-6 flex flex-col items-center text-center hover:scale-105 transition-transform shadow-sm hover:shadow-md relative overflow-hidden`}
              >
                {/* Cercles décoratifs coins */}
                <div className={`absolute top-0 left-0 w-12 h-12 rounded-full ${c.bg} border-2 ${c.border} -translate-x-5 -translate-y-5`} />
                <div className={`absolute top-0 right-0 w-12 h-12 rounded-full ${c.bg} border-2 ${c.border} translate-x-5 -translate-y-5`} />

                {/* Illustration image dans cercle */}
                <div className={`w-32 h-32 rounded-full border-4 ${c.border} overflow-hidden mb-4 shadow-md bg-white`}>
                  <div
                    className="w-[300%] h-full"
                    style={{ backgroundImage: `url(${c.img})`, backgroundSize: "100% 100%", transform: `translateX(-${c.pos})` }}
                  />
                </div>

                {/* Sigle */}
                <p className={`text-5xl font-extrabold ${c.accent} mb-1`}>{c.short}</p>

                {/* Nom complet */}
                <p className={`text-sm font-semibold ${c.accent} mb-3`}>{c.name}</p>

                {/* Séparateur */}
                <div className={`w-10 h-0.5 ${c.dots} rounded mb-3`} />

                {/* Description */}
                <p className="text-gray-600 text-sm font-medium leading-relaxed">{c.desc}</p>

                {/* Points décoratifs */}
                <div className="flex gap-1.5 mt-5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`w-1.5 h-1.5 rounded-full ${c.dots}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Matières */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Les matières enseignées</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Un programme complet pour une formation équilibrée et solide.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {matieres.map((m) => (
              <div key={m.nom} className="flex items-center gap-4 bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition">
                <span className="text-3xl">{m.emoji}</span>
                <span className="font-semibold text-gray-800">{m.nom}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fonctionnement */}
      <section id="fonctionnement" className="py-24 px-6 bg-indigo-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Comment ça marche ?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Simple, clair, efficace — démarrer chez Educ'Harmonia se fait en 3 étapes.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {etapes.map((e) => (
              <div key={e.num} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-5">
                  {e.num}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{e.titre}</h3>
                <p className="text-gray-500 leading-relaxed">{e.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-24 px-6 bg-gradient-to-br from-indigo-600 to-purple-700 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-5">Prêt à rejoindre Educ'Harmonia ?</h2>
          <p className="text-indigo-200 text-lg mb-10 leading-relaxed">
            Offrez à votre enfant une scolarité sérieuse, épanouissante et adaptée à son rythme.
            L'inscription est simple et rapide.
          </p>
          <Link
            href="/login"
            className="inline-block bg-white text-indigo-700 px-10 py-4 rounded-full text-lg font-bold hover:bg-indigo-50 transition shadow-xl"
          >
            S'inscrire maintenant
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🎓</span>
              <span className="text-white font-bold text-lg">Educ'Harmonia</span>
            </div>
            <p className="text-sm leading-relaxed">
              École primaire 100% en ligne.<br />
              De la Grande Section au CM2.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#valeurs" className="hover:text-white transition">Notre approche</a></li>
              <li><a href="#classes" className="hover:text-white transition">Les classes</a></li>
              <li><a href="#fonctionnement" className="hover:text-white transition">Fonctionnement</a></li>
              <li><Link href="/login" className="hover:text-white transition">Espace élève</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>📧 contact@educharmonia.fr</li>
              <li>🌐 www.educharmonia.fr</li>
            </ul>
          </div>
        </div>
        <div className="max-w-5xl mx-auto border-t border-gray-800 mt-10 pt-6 text-center text-xs">
          © {new Date().getFullYear()} Educ'Harmonia — Tous droits réservés
        </div>
      </footer>

    </div>
  );
}
