"use client";
import { useState, useEffect } from "react";
import { supabaseClient } from "@/app/supabase/supabaseClient";
import realtimeUpdates from "@/app/supabase/realtimeUpdates";

export default function useNotes() {
    const [notes, setNotes] = useState([]);
    const [sharedNotes, setSharedNotes] = useState([]);
    const [sharedByMeNotes, setSharedByMeNotes] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);

    // Initialize realtime updates
    realtimeUpdates({ setNotes, setSharedNotes, setSharedByMeNotes, setActivityLogs });

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) return;

            const { data: users } = await supabaseClient.from("users").select("id, email");
            const userMap = Object.fromEntries(users.map(u => [u.id, u.email]));

            // 1️⃣ Fetch owner's notes
            const { data: ownedNotes } = await supabaseClient
                .from("notes")
                .select("*")
                .eq("owner_id", user.id)
                .order("created_at", { ascending: false });
            setNotes(ownedNotes || []);

            // 2️⃣ Fetch user_roles
            const { data: rolesData } = await supabaseClient
                .from("user_roles")
                .select(`id, note_id(id, title, content, owner_id, created_at), user_id, role, created_at`)
                .order("created_at", { ascending: false });

            // Shared to me
            const sharedToMe = (rolesData || [])
                .filter(r => r.user_id === user.id)
                .map(r => ({
                    ...r.note_id,
                    role: r.role,
                    sharedByEmail: userMap[r.note_id.owner_id] || "Unknown",
                    sharedAt: r.created_at
                }));
            setSharedNotes(sharedToMe);

            // Shared by me
            const sharedByMeData = (rolesData || [])
                .filter(r => r.note_id.owner_id === user.id && r.user_id !== user.id)
                .map(r => ({
                    note_id: r.note_id,
                    user_id: r.user_id,
                    role: r.role,
                    userEmail: userMap[r.user_id] || "Unknown",
                    sharedAt: r.created_at
                }));
            setSharedByMeNotes(sharedByMeData);

            // Activity logs
            const logs = [];
            sharedToMe.forEach(s => logs.push({
                isOwner: false,
                noteTitle: s.title,
                ownerEmail: s.sharedByEmail,
                sharedAt: s.sharedAt,
                type: "share"
            }));
            sharedByMeData.forEach(s => logs.push({
                isOwner: true,
                noteTitle: s.note_id.title,
                recipientEmail: s.userEmail,
                sharedAt: s.sharedAt,
                type: "share"
            }));
            logs.sort((a, b) => new Date(b.sharedAt) - new Date(a.sharedAt));
            setActivityLogs(logs);
        };

        fetchData();
    }, []);

    // Save or update note
    const saveNote = async (note, editingNote = null) => {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        try {
            if (editingNote) {
                const { data } = await supabaseClient.from("notes")
                    .update({ title: note.title, content: note.content })
                    .eq("id", editingNote.id)
                    .select();

                const updatedNote = data[0];

                // Update notes
                setNotes(prev => prev.map(n => n.id === editingNote.id ? updatedNote : n));

                // Update sharedNotes while preserving role & sharedByEmail
                setSharedNotes(prev =>
                    prev.map(n =>
                        n.id === editingNote.id
                            ? {
                                ...updatedNote,
                                role: n.role || 'editor', // fallback if role is missing
                                sharedByEmail: n.sharedByEmail,
                                sharedAt: n.sharedAt
                            }
                            : n
                    )
                );

                // Update sharedByMeNotes
                setSharedByMeNotes(prev =>
                    prev.map(s =>
                        s.note_id.id === editingNote.id
                            ? { ...s, note_id: updatedNote }
                            : s
                    )
                );

            } else {
                const { data } = await supabaseClient.from("notes")
                    .insert([{ title: note.title, content: note.content, owner_id: user.id }])
                    .select();

                setNotes(prev => [data[0], ...prev]);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to save note");
        }
    };

    // Delete note
    const deleteNote = async (note) => {
        if (!confirm("Delete note?")) return;
        try {
            const { error } = await supabaseClient.from("notes").delete().eq("id", note.id);
            if (error) throw error;

            setNotes(prev => prev.filter(n => n.id !== note.id));
            setSharedNotes(prev => prev.filter(n => n.id !== note.id));
            setSharedByMeNotes(prev => prev.filter(s => s.note_id.id !== note.id));
        } catch (err) {
            console.error(err);
            alert("Failed to delete note");
        }
    };

    // Share note
    const shareNote = async (note, email, role) => {
        if (!note) return;

        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) return;

            // Find target user
            const { data: targetUser } = await supabaseClient
                .from("users")
                .select("id, email")
                .eq("email", email)
                .single();

            if (!targetUser) return alert("User not found");

            // Check if already shared
           const { data: existing } = await supabaseClient
      .from("user_roles")
      .select("*")
      .eq("note_id", note.id)
      .eq("user_id", targetUser.id)
      .maybeSingle();

    if (existing) {
      alert("This note is already shared with this user");
      return;
    }
   

            // Insert into user_roles
            const { error } = await supabaseClient
                .from("user_roles")
                .insert([{ note_id: note.id, user_id: targetUser.id, role }]);
           
    if (error) {
      // Catch unique constraint violation
      if (error.code === "23505") {
        return alert("This note is already shared with this user");
      }
      throw error;
    }


            // Update sharedByMeNotes immediately
            setSharedByMeNotes(prev => [
                { note_id: note, user_id: targetUser.id, role, userEmail: targetUser.email, sharedAt: new Date() },
                ...prev
            ]);
            

            // Update activity logs
            setActivityLogs(prev => [
                { type: "share", isOwner: true, noteTitle: note.title, recipientEmail: targetUser.email, sharedAt: new Date() },
                ...prev
            ]);

            alert(`Note shared with ${email} as ${role}`);
        } catch (err) {
            console.error(err);
            alert("Failed to share note");
        }
    };

    return {
        notes,
        sharedNotes,
        sharedByMeNotes,
        activityLogs,
        saveNote,
        deleteNote,
        shareNote
    };
}
