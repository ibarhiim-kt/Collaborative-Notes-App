"use client";

import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { supabaseClient } from "@/app/supabase/supabaseClient";

export default function ShareNoteModal({ isOpen, onClose, onShare }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer"); // default role
  const [users, setUsers] = useState([]);
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  // Fetch all registered users
  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      const { data: { user }, error } = await supabaseClient.auth.getUser();
      if (error || !user) return;

      setCurrentUserEmail(user.email);

      const { data, error: usersError } = await supabaseClient
        .from("users")
        .select("id, email")
        .order("email", { ascending: true });

      if (usersError) {
        console.error("Error fetching users:", usersError.message);
      } else {
        // Remove current user + null emails
        setUsers(data.filter(u => u.email && u.email !== user.email));
      }
    };

    fetchUsers();
  }, [isOpen]);

  const share = () => {
    if (!email.trim()) return;
    if (email === currentUserEmail) return alert("You cannot share with yourself");

    onShare(email, role);
    setEmail("");
    setRole("viewer");
    onClose();
  };

  const shareWithUser = (userEmail) => {
    if (userEmail === currentUserEmail) return alert("You cannot share with yourself");

    onShare(userEmail, role);
    setRole("viewer");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-11/12 max-w-md shadow-lg relative max-h-[80vh] overflow-y-auto">

        <button onClick={onClose} className="absolute top-3 right-3 text-gray-600 hover:text-gray-900">
          <FiX size={24} />
        </button>

        <h2 className="text-xl font-bold mb-4">Share Note</h2>

        {/* Role selection */}
        <label className="text-sm font-medium text-gray-700 mb-1 block">Select role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-3"
        >
          <option value="viewer">Viewer (can only read)</option>
          <option value="editor">Editor (can edit)</option>
        </select>

        {/* Manual email input */}
        <input
          type="email"
          placeholder="Enter user email..."
          className="w-full p-2 border border-gray-300 rounded mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={share}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mb-4 w-full"
        >
          Share by Email
        </button>

        <hr className="my-3" />

        {/* List of registered users */}
        <div className="space-y-2">
          {users.map((user) => {
            const initials = user.email ? user.email.charAt(0).toUpperCase() : "?";
            return (
              <button
                key={user.id}
                onClick={() => shareWithUser(user.email)}
                className="flex items-center space-x-3 w-full p-2 hover:bg-gray-100 rounded"
              >
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">
                  {initials}
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-medium">{user.email}</span>
                  <span className="text-xs text-gray-500">Tap to share as: {role}</span>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
