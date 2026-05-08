"use client";

import { useEffect } from "react";

type Notification = { id: string; title: string; message: string };

export default function NotificationBanner({ notifications }: { notifications: Notification[] }) {
  useEffect(() => {
    if (notifications.length === 0) return;
    const ids = notifications.map((n) => n.id);
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  if (notifications.length === 0) return null;

  return (
    <div className="mb-6 bg-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🔔</span>
        <p className="font-bold text-base">
          {notifications.length} nouvelle{notifications.length > 1 ? "s" : ""} notification{notifications.length > 1 ? "s" : ""}
        </p>
      </div>
      <ul className="space-y-1.5">
        {notifications.map((n) => (
          <li key={n.id} className="text-sm text-indigo-100 flex items-start gap-2">
            <span className="mt-0.5 shrink-0 text-indigo-300">›</span>
            <span>{n.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
