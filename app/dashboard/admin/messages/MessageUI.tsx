"use client";

import { useState, useEffect, useRef } from "react";

type Contact = { id: string; name: string; role: "TEACHER" | "STUDENT" };
type RoomSummary = {
  id: string;
  otherUser: { id: string; name: string } | null;
  lastMessage: { content: string; sentAt: Date } | null;
};
type Message = {
  id: string;
  content: string;
  senderId: string;
  sentAt: string;
  sender: { name: string };
};

export default function MessageUI({
  currentUserId,
  contacts,
  rooms: initialRooms,
}: {
  currentUserId: string;
  currentUserName: string;
  contacts: Contact[];
  rooms: RoomSummary[];
}) {
  const [rooms, setRooms] = useState(initialRooms);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const teachers = contacts.filter((c) => c.role === "TEACHER");
  const students = contacts.filter((c) => c.role === "STUDENT");

  const filteredTeachers = teachers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredStudents = students.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  async function loadMessages(roomId: string) {
    const res = await fetch(`/api/messages?roomId=${roomId}`);
    const data = await res.json();
    setMessages(data);
  }

  useEffect(() => {
    if (!activeRoomId) return;
    loadMessages(activeRoomId);
    const interval = setInterval(() => loadMessages(activeRoomId), 5000);
    return () => clearInterval(interval);
  }, [activeRoomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function openOrCreateRoom(contact: Contact) {
    setActiveContact(contact);
    const existing = rooms.find((r) => r.otherUser?.id === contact.id);
    if (existing) {
      setActiveRoomId(existing.id);
      return;
    }
    const res = await fetch("/api/messages/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherUserId: contact.id }),
    });
    const data = await res.json();
    setRooms((prev) => [
      ...prev,
      { id: data.id, otherUser: { id: contact.id, name: contact.name }, lastMessage: null },
    ]);
    setActiveRoomId(data.id);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoomId) return;
    setSending(true);
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: activeRoomId, content: newMessage.trim() }),
    });
    setNewMessage("");
    await loadMessages(activeRoomId);
    setSending(false);
  }

  const chatName = activeContact?.name ?? rooms.find((r) => r.id === activeRoomId)?.otherUser?.name ?? "";
  const chatRole = activeContact?.role;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar contacts */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-100">
          <h1 className="font-bold text-gray-800 mb-2">Messagerie</h1>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Professeurs */}
          {filteredTeachers.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Professeurs</p>
              <div className="space-y-1">
                {filteredTeachers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openOrCreateRoom(c)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
                      activeContact?.id === c.id
                        ? "bg-indigo-50 text-indigo-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {c.name[0].toUpperCase()}
                    </span>
                    <span className="truncate">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Élèves */}
          {filteredStudents.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Élèves</p>
              <div className="space-y-1">
                {filteredStudents.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openOrCreateRoom(c)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
                      activeContact?.id === c.id
                        ? "bg-indigo-50 text-indigo-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {c.name[0].toUpperCase()}
                    </span>
                    <span className="truncate">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredTeachers.length === 0 && filteredStudents.length === 0 && (
            <p className="text-xs text-gray-400 text-center pt-4">Aucun résultat</p>
          )}
        </div>
      </div>

      {/* Zone de chat */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {!activeRoomId ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-4xl mb-3">💬</p>
              <p className="text-sm">Sélectionne un contact pour commencer</p>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                chatRole === "TEACHER" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
              }`}>
                {chatName[0]?.toUpperCase()}
              </span>
              <div>
                <p className="font-semibold text-gray-800">{chatName}</p>
                {chatRole && (
                  <p className="text-xs text-gray-400">
                    {chatRole === "TEACHER" ? "Professeur" : "Élève"}
                  </p>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-gray-400 text-sm">Aucun message. Écris le premier !</p>
              )}
              {messages.map((m) => {
                const isMe = m.senderId === currentUserId;
                return (
                  <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      {!isMe && (
                        <p className="text-xs text-gray-400 mb-1 px-1">{m.sender.name}</p>
                      )}
                      <div className={`px-4 py-2 rounded-2xl text-sm max-w-xs lg:max-w-md ${
                        isMe
                          ? "bg-indigo-600 text-white rounded-br-sm"
                          : "bg-white text-gray-800 shadow-sm rounded-bl-sm"
                      }`}>
                        {m.content}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 px-1">
                        {new Date(m.sentAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={sendMessage} className="bg-white border-t border-gray-200 p-4 flex gap-3">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrire un message..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="bg-indigo-600 text-white px-5 py-2 rounded-full text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                Envoyer
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
