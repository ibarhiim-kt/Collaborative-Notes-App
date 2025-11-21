"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiPlus, FiUser, FiLogOut, FiShare2, FiShare, FiActivity } from "react-icons/fi";
import NoteCard from "./NoteCard";
import CreateNoteModal from "./CreateNoteModal";
import ShareNoteModal from "./ShareNoteModal";
import { supabaseClient } from "@/app/supabase/supabaseClient";

export default function Layout({
  notes = [],
  sharedNotes = [],
  sharedByMeNotes = [],
  activityLogs = [],
  // onEditNote,
  onDeleteNote,
  onShareNote,
  onCreateNote,
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("myNotes"); // "myNotes", "shared", "sharedByMe", "activity"

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [sharingNote, setSharingNote] = useState(null);

  const handleLogout = async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (!error) router.push("/auth/login");
    else console.error(error.message);
  };

  const openCreateModal = (note = null) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const openShareModal = (note) => {
    setSharingNote(note);
    setIsShareModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 md:translate-x-0 md:static md:inset-auto`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-lg font-bold">NotesApp</h1>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        {/* Tabs */}
        <nav className="p-4 space-y-2">
          <button
            className={`flex items-center p-2 w-full rounded ${activeTab === "myNotes" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-200"}`}
            onClick={() => setActiveTab("myNotes")}
          >
            <FiPlus className="mr-2" /> My Notes
          </button>
          <button
            className={`flex items-center p-2 w-full rounded ${activeTab === "shared" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-200"}`}
            onClick={() => setActiveTab("shared")}
          >
            <FiShare2 className="mr-2" /> Shared Notes
          </button>
          <button
            className={`flex items-center p-2 w-full rounded ${activeTab === "sharedByMe" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-200"}`}
            onClick={() => setActiveTab("sharedByMe")}
          >
            <FiShare className="mr-2" /> Shared By Me
          </button>
          <button
            className={`flex items-center p-2 w-full rounded ${activeTab === "activity" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-200"}`}
            onClick={() => setActiveTab("activity")}
          >
            <FiActivity className="mr-2" /> Activity Logs
          </button>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between bg-white shadow p-4">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>☰</button>
          <h2 className="text-xl font-semibold">
            {activeTab === "myNotes" && "My Notes"}
            {activeTab === "shared" && "Shared Notes"}
            {activeTab === "sharedByMe" && "Shared By Me"}
            {activeTab === "activity" && "Activity Logs"}
          </h2>
          <div className="flex items-center space-x-4">
            <FiUser className="text-gray-700 w-6 h-6" />
            <FiLogOut className="text-gray-700 w-6 h-6 cursor-pointer hover:text-red-500" onClick={handleLogout} />
          </div>
        </header>

        {/* Content */}
        <main className="p-4 overflow-y-auto">
          {activeTab === "myNotes" && (
            <>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded mb-4 hover:bg-blue-600"
                onClick={() => openCreateModal()}
              >
                + Create Note
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {notes.map(note => (
                  <NoteCard
                    key={note.id}
                    title={note.title}
                    content={note.content}
                    role="owner"
                    onEdit={() => openCreateModal(note)}
                    onDelete={() => onDeleteNote(note)}
                    onShare={() => openShareModal(note)}
                  />
                ))}
              </div>
            </>
          )}

          {activeTab === "shared" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {sharedNotes.length > 0 ? sharedNotes.map(note => (
                <NoteCard
                  key={note.id}
                  title={note.title}
                  content={note.content}
                  sharedBy={note.sharedByEmail}
                  role={note.role}
                  onEdit={note.role !== "viewer" ? () => openCreateModal(note) : undefined}
                  // onDelete={() => onDeleteNote(note)}
                />
              )) : <p className="text-gray-500">No notes shared with you yet.</p>}
            </div>
          )}

          {activeTab === "sharedByMe" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {sharedByMeNotes.length > 0 ? sharedByMeNotes.filter(item => item.note_id).map(item => (
                <NoteCard
                  key={item.note_id.id}
                  title={item.note_id.title}
                  content={item.note_id.content}
                  role="owner"
                  sharedBy="You"
                  onEdit={() => openCreateModal(item.note_id)}
                  onDelete={() => onDeleteNote(item.note_id)}
                />
              )) : <p className="text-gray-500">You dont shared any notes yet.</p>}
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-2">
              {activityLogs.length > 0 ? activityLogs.map((log, i) => (
                <div key={i} className="p-2 border rounded bg-white">
                  {log.isOwner ? (
                    <p>You shared <strong>{log.noteTitle}</strong> with <strong>{log.recipientEmail}</strong> on {new Date(log.sharedAt).toLocaleString()}</p>
                  ) : (
                    <p>You received file <strong>{log.noteTitle}</strong> from <strong>{log.ownerEmail}</strong> on {new Date(log.sharedAt).toLocaleString()}</p>
                  )}
                </div>
              )) : <p className="text-gray-500">No activity yet.</p>}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateNoteModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingNote(null); }}
        onSave={(note) => onCreateNote(note, editingNote)}
        initialData={editingNote}
      />

      <ShareNoteModal
        isOpen={isShareModalOpen}
        onClose={() => { setIsShareModalOpen(false); setSharingNote(null); }}
        onShare={(email,role) => onShareNote(sharingNote, email, role)}
      />
    </div>
  );
}
