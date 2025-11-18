"use client";
import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import NoteCard from "./components/NoteCard";
import CreateNoteModal from "./components/CreateNoteModal";
import ShareNoteModal from "./components/ShareNoteModal";
import ProtectedRoute from "./components/ProtectedRoute";
import { supabaseClient } from "@/app/supabase/supabaseClient";

export default function Home() {
  const [notes, setNotes] = useState([]);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [sharedByMeNotes, setSharedByMeNotes] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [editingSharedNote, setEditingSharedNote] = useState(null);
  const [sharingNote, setSharingNote] = useState(null);

  // ------------------- FETCH NOTES & INITIAL DATA -------------------
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      // Get all users
      const { data: users } = await supabaseClient.from("users").select("id, email");
      const userMap = Object.fromEntries(users.map(u => [u.id, u.email]));

      // Owner's notes
      const { data: ownedNotes } = await supabaseClient
        .from("notes")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      setNotes(ownedNotes || []);

      // Notes shared to the user
      const { data: sharedData } = await supabaseClient
        .from("note_shares")
        .select(`note_id(id, title, content, owner_id), user_id, shared_at`)
        .eq("user_id", user.id)
        .order("shared_at", { ascending: false });

      setSharedNotes((sharedData || []).map(s => ({
        ...s.note_id,
        sharedByEmail: userMap[s.note_id.owner_id] || "Unknown"
      })));

      // Shared by me
      const { data: allShares } = await supabaseClient
        .from("note_shares")
        .select(`note_id(id, title, content, owner_id), user_id, shared_at`)
        .order("shared_at", { ascending: false });

      const sharedByMeData = (allShares || []).filter(s => s.note_id?.owner_id === user.id);
      setSharedByMeNotes(sharedByMeData);

      // Build activity logs
      const logs = [];
      const received = (allShares || []).filter(s => s.user_id === user.id && s.note_id?.owner_id !== user.id);
      received.forEach(s => logs.push({
        isOwner: false,
        noteTitle: s.note_id.title,
        ownerEmail: userMap[s.note_id.owner_id] || "Unknown",
        sharedAt: s.shared_at,
        type: "share"
      }));
      sharedByMeData.forEach(s => logs.push({
        isOwner: true,
        noteTitle: s.note_id.title,
        recipientEmail: userMap[s.user_id] || "Unknown",
        sharedAt: s.shared_at,
        type: "share"
      }));
      logs.sort((a, b) => new Date(b.sharedAt) - new Date(a.sharedAt));
      setActivityLogs(logs);
    };

    fetchData();

    // ------------------- REALTIME SUBSCRIPTIONS -------------------
    const shareChannel = supabaseClient
  .channel("note_shares_changes")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "note_shares" },
    async (payload) => {
      const share = payload.new;
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      const { data: noteData } = await supabaseClient
        .from("notes")
        .select("*")
        .eq("id", share.note_id)
        .single();

      // OWNER shares a note
      if (noteData.owner_id === user.id) {
        const { data: sharedUser } = await supabaseClient
          .from("users")
          .select("email")
          .eq("id", share.user_id)
          .single();

        setSharedByMeNotes(prev => [
          { note_id: noteData, user_id: share.user_id, shared_at: share.shared_at, userEmail: sharedUser?.email || "Unknown" },
          ...prev
        ]);

        setActivityLogs(prev => [
          { isOwner: true, noteTitle: noteData.title, recipientEmail: sharedUser?.email || "Unknown", sharedAt: share.shared_at, type: "share" },
          ...prev
        ]);
      }
      // RECEIVER gets a shared note
      else if (share.user_id === user.id) {
        // Fetch owner email
        const { data: ownerData } = await supabaseClient
          .from("users")
          .select("email")
          .eq("id", noteData.owner_id)
          .single();

        setSharedNotes(prev => [
          { ...noteData, sharedByEmail: ownerData?.email || "Unknown" },
          ...prev
        ]);

        setActivityLogs(prev => [
          { isOwner: false, noteTitle: noteData.title, ownerEmail: ownerData?.email || "Unknown", sharedAt: share.shared_at, type: "share" },
          ...prev
        ]);
      }
    }
  )
  .subscribe();
// ------------------- REALTIME UPDATE SUBSCRIPTION -------------------
const notesChannel = supabaseClient
  .channel("notes_changes")
  .on(
    "postgres_changes",
    { event: "UPDATE", schema: "public", table: "notes" },
    async (payload) => {
      const updatedNote = payload.new;
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      // Update notes, sharedNotes, sharedByMeNotes
      setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
      setSharedNotes(prev => prev.map(n => n.id === updatedNote.id ? { ...updatedNote, sharedByEmail: n.sharedByEmail } : n));
      setSharedByMeNotes(prev => prev.map(s => s.note_id.id === updatedNote.id ? { ...s, note_id: updatedNote } : s));

      // Add update to activity log
      setActivityLogs(prev => [
        { isOwner: updatedNote.owner_id === user.id, noteTitle: updatedNote.title, sharedAt: new Date(), type: "update" },
        ...prev
      ]);
    }
  )
  .subscribe();
  // ------------------- REALTIME DELETE SUBSCRIPTION -------------------
const deleteChannel = supabaseClient
  .channel("notes_deletes")
  .on(
    "postgres_changes",
    { event: "DELETE", schema: "public", table: "notes" },
    async (payload) => {
      const deletedNote = payload.old; // note data before deletion
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      // Remove from owner's notes
      setNotes(prev => prev.filter(n => n.id !== deletedNote.id));

      // Remove from shared notes where the note exists
      setSharedNotes(prev => prev.filter(n => n.id !== deletedNote.id));

      // Remove from SharedByMe notes
      setSharedByMeNotes(prev => prev.filter(s => s.note_id.id !== deletedNote.id));

      // Optionally update activity logs
      // setActivityLogs(prev => [
      //   { isOwner: deletedNote.owner_id === user.id, noteTitle: deletedNote.title, sharedAt: new Date(), type: "delete" },
      //   ...prev
      // ]);
    }
  )
  .subscribe();

    return () => {
      supabaseClient.removeChannel(shareChannel);
      supabaseClient.removeChannel(notesChannel);
      supabaseClient.removeChannel(deleteChannel);
    };
  }, []);

  // ------------------- HANDLERS -------------------
  const handleSaveNote = async (note) => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    try {
      if (editingNote) {
        const { data } = await supabaseClient.from("notes").update({ title: note.title, content: note.content }).eq("id", editingNote.id).select();
        setNotes(prev => prev.map(n => n.id === editingNote.id ? data[0] : n));
        setEditingNote(null);
      } else if (editingSharedNote) {
        const { data } = await supabaseClient.from("notes").update({ title: note.title, content: note.content }).eq("id", editingSharedNote.id).select();
        setSharedNotes(prev => prev.map(n => n.id === editingSharedNote.id ? data[0] : n));
        setEditingSharedNote(null);
      } else {
        const { data } = await supabaseClient.from("notes").insert([{ title: note.title, content: note.content, owner_id: user.id }]).select();
        setNotes(prev => [data[0], ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) { console.error(err); alert("Failed to save note"); }
  };

  const handleDelete = async (note) => {
    if (!confirm("Delete note?")) return;
    try {
      const { error } = await supabaseClient.from("notes").delete().eq("id", note.id);
      if (error) throw error;
      setNotes(prev => prev.filter(n => n.id !== note.id));
    } catch (err) { console.error(err); alert("Failed to delete note"); }
  };

  const handleShare = async (email) => {
    if (!sharingNote) return;
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      const { data: users } = await supabaseClient.from("users").select("id, email").eq("email", email).limit(1);
      if (!users || users.length === 0) return alert("User not found");

      const sharedUserId = users[0].id;
      const { error } = await supabaseClient.from("note_shares").insert([{ note_id: sharingNote.id, user_id: sharedUserId, shared_at: new Date() }]);
      if (error) throw error;

      alert(`Note shared with ${email}`);
      setIsShareModalOpen(false);
      setSharingNote(null);
    } catch (err) { console.error(err); alert("Failed to share note"); }
  };

  // ------------------- RENDER -------------------
  return (
    <ProtectedRoute>
      <Layout
        sharedNotes={sharedNotes}
        sharedByMeNotes={sharedByMeNotes}
        activityLogs={activityLogs}
        onEditShared={(note) => { setEditingSharedNote(note); setEditingNote(null); setIsModalOpen(true); }}
      >
        <button className="bg-blue-500 text-white px-4 py-2 rounded mb-4 hover:bg-blue-600" onClick={() => setIsModalOpen(true)}>+ Create Note</button>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {notes.map(note => (
            <NoteCard
              key={note.id}
              title={note.title}
              content={note.content}
              onEdit={() => { setEditingNote(note); setIsModalOpen(true); }}
              onDelete={() => handleDelete(note)}
              onShare={() => { setSharingNote(note); setIsShareModalOpen(true); }}
            />
          ))}
        </div>

      </Layout>

      <CreateNoteModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingNote(null); setEditingSharedNote(null); }}
        onSave={handleSaveNote}
        initialData={editingNote || editingSharedNote || null}
      />

      <ShareNoteModal
        isOpen={isShareModalOpen}
        onClose={() => { setIsShareModalOpen(false); setSharingNote(null); }}
        onShare={handleShare}
      />
    </ProtectedRoute>
  );
}
