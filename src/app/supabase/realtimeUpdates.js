"use client";
import { useEffect } from "react";
import { supabaseClient } from "@/app/supabase/supabaseClient";

export default function RealtimeUpdates({
  setNotes,
  setSharedNotes,
  setSharedByMeNotes,
  setActivityLogs
}) {
  useEffect(() => {
    let shareChannel, notesChannel, deleteChannel;

    const initRealtime = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      // ------------------- SHARE INSERT -------------------
      shareChannel = supabaseClient
        .channel("note_shares_changes")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "note_shares" },
          async ({ new: share }) => {
            const { data: noteData } = await supabaseClient
              .from("notes")
              .select("*")
              .eq("id", share.note_id)
              .single();

            const { data: sharedUser } = await supabaseClient
              .from("users")
              .select("email")
              .eq("id", share.user_id)
              .single();

            const { data: ownerData } = await supabaseClient
              .from("users")
              .select("email")
              .eq("id", noteData.owner_id)
              .single();

            // Owner → Shared By Me
            if (noteData.owner_id === user.id) {
              setSharedByMeNotes(prev => [
                { note_id: noteData, user_id: share.user_id, shared_at: share.shared_at, userEmail: sharedUser?.email },
                ...prev,
              ]);

              setActivityLogs(prev => [
                { type: "share", isOwner: true, noteTitle: noteData.title, recipientEmail: sharedUser?.email, sharedAt: share.shared_at },
                ...prev,
              ]);
            }

            // Receiver → Shared Notes
            if (share.user_id === user.id) {
              setSharedNotes(prev => [
                { ...noteData, sharedByEmail: ownerData?.email },
                ...prev,
              ]);

              setActivityLogs(prev => [
                { type: "share", isOwner: false, noteTitle: noteData.title, ownerEmail: ownerData?.email, sharedAt: share.shared_at },
                ...prev,
              ]);
            }
          }
        )
        .subscribe();

      // ------------------- NOTE UPDATE -------------------
      notesChannel = supabaseClient
        .channel("notes_changes")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "notes" },
          async ({ new: updatedNote }) => {
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

      // ------------------- NOTE DELETE -------------------
      deleteChannel = supabaseClient
        .channel("notes_delete")
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "notes" },
          ({ old }) => {
            setNotes(prev => prev.filter(n => n.id !== old.id));
            setSharedNotes(prev => prev.filter(n => n.id !== old.id));
            setSharedByMeNotes(prev => prev.filter(s => s.note_id.id !== old.id));
          }
        )
        .subscribe();
    };

    initRealtime();

    return () => {
      if (shareChannel) supabaseClient.removeChannel(shareChannel);
      if (notesChannel) supabaseClient.removeChannel(notesChannel);
      if (deleteChannel) supabaseClient.removeChannel(deleteChannel);
    };
  }, [setNotes, setSharedNotes, setSharedByMeNotes, setActivityLogs]);
}
