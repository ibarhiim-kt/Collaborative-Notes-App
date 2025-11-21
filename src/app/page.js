"use client";
import { useState } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import CreateNoteModal from "./components/CreateNoteModal";
import ShareNoteModal from "./components/ShareNoteModal";
import useNotes from "./hooks/useNotes";

export default function Home() {
  const { notes, sharedNotes, sharedByMeNotes, activityLogs, saveNote, deleteNote, shareNote } = useNotes();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [sharingNote, setSharingNote] = useState(null);

  return (
    <ProtectedRoute>
      <Layout
        notes={notes}
        sharedNotes={sharedNotes}
        sharedByMeNotes={sharedByMeNotes}
        activityLogs={activityLogs} 
        onCreateNote={saveNote}
        // onEditNote={setEditingNote}
        onShareNote={shareNote}
        onDeleteNote={deleteNote}
      />  

      <CreateNoteModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingNote(null); }}
        onSave={(note) => saveNote(note, editingNote)}
        initialData={editingNote}
      />

      <ShareNoteModal
        isOpen={isShareModalOpen}
        onClose={() => { setIsShareModalOpen(false); setSharingNote(null); }}
        onShare={(email) => shareNote(sharingNote, email)}
      />
    </ProtectedRoute>
  );
}
