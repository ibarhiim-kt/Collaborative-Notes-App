"use client";
import { useState } from "react";
import Layout from "./components/Layout";
import NoteCard from "./components/NoteCard";
import CreateNoteModal from "./components/CreateNoteModal";
import ShareNoteModal from "./components/ShareNoteModal";

export default function Home() {
  const [notes, setNotes] = useState([
    { title: "First Note", content: "This is my first note", sharedWith: [] },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [editingNote, setEditingNote] = useState(null);
  const [sharingNote, setSharingNote] = useState(null);

  // Create / Edit
  const handleSaveNote = (note) => {
    if (editingNote !== null) {
      setNotes(notes.map((n, idx) => (idx === editingNote ? { ...n, ...note } : n)));
      setEditingNote(null);
    } else {
      setNotes([{ ...note, sharedWith: [] }, ...notes]);
    }
  };

  // Delete
  const handleDelete = (index) => {
    if (confirm("Delete note?")) {
      setNotes(notes.filter((_, idx) => idx !== index));
    }
  };

  // Share
  const handleShare = (email) => {
    setNotes(notes.map((n, idx) =>
      idx === sharingNote ? { ...n, sharedWith: [...n.sharedWith, email] } : n
    ));
  };

  return (
    <Layout>

      <button 
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4 hover:bg-blue-600"
        onClick={() => setIsModalOpen(true)}>
        + Create Note
      </button>

      {/* Notes List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {notes.map((note, i) => (
          <NoteCard
            key={i}
            title={note.title}
            content={note.content}
            onEdit={() => { setEditingNote(i); setIsModalOpen(true); }}
            onDelete={() => handleDelete(i)}
            onShare={() => { setSharingNote(i); setIsShareModalOpen(true); }}
          />
        ))}
      </div>

      {/* Create / Edit Modal */}
      <CreateNoteModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingNote(null); }}
        onSave={handleSaveNote}
        initialData={editingNote !== null ? notes[editingNote] : null}
      />

      {/* Share Modal */}
      <ShareNoteModal
        isOpen={isShareModalOpen}
        onClose={() => { setIsShareModalOpen(false); setSharingNote(null); }}
        onShare={handleShare}
      />
    </Layout>
  );
}
