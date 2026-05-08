"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const adminLinks = [
  { href: "/dashboard/admin", label: "Accueil", icon: "🏠" },
  { href: "/dashboard/admin/users", label: "Utilisateurs", icon: "👥" },
  { href: "/dashboard/admin/classes", label: "Classes", icon: "🏫" },
  { href: "/dashboard/admin/courses", label: "Cours", icon: "📚" },
  { href: "/dashboard/admin/messages", label: "Messagerie", icon: "💬" },
];

const teacherLinks = [
  { href: "/dashboard/teacher", label: "Accueil", icon: "🏠" },
  { href: "/dashboard/teacher/courses", label: "Mes cours", icon: "📖" },
  { href: "/dashboard/teacher/assignments", label: "Devoirs à corriger", icon: "✏️" },
  { href: "/dashboard/teacher/messages", label: "Messagerie", icon: "💬" },
];

const studentLinks = [
  { href: "/dashboard/student", label: "Accueil", icon: "🏠" },
  { href: "/dashboard/student/courses", label: "Mes cours", icon: "📖" },
  { href: "/dashboard/student/assignments", label: "Mes devoirs", icon: "✏️" },
  { href: "/dashboard/student/schedule", label: "Emploi du temps", icon: "📅" },
  { href: "/dashboard/student/grades", label: "Mes notes", icon: "🏆" },
  { href: "/dashboard/student/messages", label: "Messagerie", icon: "💬" },
];

type Notification = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

const ROLE_CONFIG = {
  ADMIN: {
    label: "Administration",
    color: "bg-purple-600",
    badge: "bg-purple-100 text-purple-700",
    accent: "bg-purple-50 text-purple-700 border-purple-200",
    links: adminLinks,
  },
  TEACHER: {
    label: "Professeur",
    color: "bg-blue-600",
    badge: "bg-blue-100 text-blue-700",
    accent: "bg-blue-50 text-blue-700 border-blue-200",
    links: teacherLinks,
  },
  STUDENT: {
    label: "Élève",
    color: "bg-green-600",
    badge: "bg-green-100 text-green-700",
    accent: "bg-green-50 text-green-700 border-green-200",
    links: studentLinks,
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = session?.user?.role as "ADMIN" | "TEACHER" | "STUDENT" | undefined;
  const config = role ? ROLE_CONFIG[role] : ROLE_CONFIG.STUDENT;
  const links = config.links;

  const initials = session?.user?.name
    ?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) ?? "??";

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function loadNotifications() {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      setNotifications(data);
      return data as Notification[];
    }
    return [];
  }

  async function markAllRead(notifList = notifications) {
    const unread = notifList.filter((n) => !n.isRead).map((n) => n.id);
    if (unread.length === 0) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: unread }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  useEffect(() => {
    if (!session) return;
    loadNotifications().then((notifs) => {
      if (notifs && notifs.length > 0) {
        // Marquer comme lues après 4 secondes si le panneau est fermé
        const timer = setTimeout(() => markAllRead(notifs), 4000);
        return () => clearTimeout(timer);
      }
    });
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Logo + nom plateforme */}
      <div className={`${config.color} px-5 py-5`}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🎓</span>
          <div>
            <p className="text-white font-bold text-base leading-tight">Educ'Harmonia</p>
            <p className="text-white/60 text-xs">Plateforme scolaire</p>
          </div>
        </div>

        {/* Profil utilisateur */}
        {session?.user && (
          <div className="bg-white/15 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/30 text-white flex items-center justify-center text-sm font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white font-semibold text-sm truncate">{session.user.name}</p>
              <span className="text-white/70 text-xs">{config.label}</span>
            </div>
            {/* Cloche notifications */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllRead(); }}
                className="relative p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition"
              >
                <span className="text-base">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dropdown notifications */}
      {showNotifs && (
        <div className="mx-3 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
          <div className="p-3 border-b border-gray-100 flex justify-between items-center">
            <p className="font-semibold text-sm text-gray-800">Notifications</p>
            <button onClick={() => setShowNotifs(false)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-5">Aucune notification</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`px-4 py-3 border-b border-gray-50 ${n.isRead ? "" : "bg-indigo-50"}`}>
                  <p className="text-sm font-medium text-gray-800">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">Navigation</p>
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? `${config.accent} border font-semibold shadow-sm`
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className="text-lg shrink-0">{link.icon}</span>
              <span>{link.label}</span>
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-current" />}
            </Link>
          );
        })}
      </nav>

      {/* Bas de sidebar */}
      <div className="px-3 pb-4 border-t border-gray-100 pt-3 space-y-1">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">Compte</p>
        <Link
          href="/dashboard/profile"
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            pathname === "/dashboard/profile"
              ? `${config.accent} border font-semibold shadow-sm`
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <span className="text-lg">👤</span>
          <span>Mon profil</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <span className="text-lg">🚪</span>
          <span>Se déconnecter</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col shrink-0 fixed top-0 left-0 h-full z-30">
        <SidebarContent />
      </aside>

      {/* Sidebar mobile — overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-white flex flex-col h-full z-50 shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Barre mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎓</span>
          <span className="font-bold text-gray-900">Educ'Harmonia</span>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition"
        >
          <span className="text-xl">☰</span>
        </button>
      </div>

      {/* Contenu principal */}
      <main
        className="flex-1 md:ml-64 overflow-auto min-h-screen pt-16 md:pt-0"
        onClick={() => setShowNotifs(false)}
      >
        {children}
      </main>
    </div>
  );
}
