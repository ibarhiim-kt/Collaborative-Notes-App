"use client";

import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { supabaseClient } from "@/app/supabase/supabaseClient";

export default function ShareNoteModal({ isOpen, onClose, onShare }) {
  const [email, setEmail] = useState("");
  const [users, setUsers] = useState([]);

  // Fetch all registered users
 useEffect(() => {
  if (!isOpen) return;

  const fetchUsers = async () => {
    // Get the currently logged-in user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError) {
      console.error("Error getting current user:", userError.message);
      return;
    }
    if (!user) return;

    // Fetch all users
    const { data, error } = await supabaseClient
      .from("users") // your public.users table
      .select("id, email")
      .order("email");

    if (error) {
      console.error("Error fetching users:", error.message);
    } else {
      // Filter out null emails and the current user
      setUsers(data.filter(u => u.email && u.id !== user.id));
    }
  };

  fetchUsers();
}, [isOpen]);

  const handleShareEmail = () => {
    if (!email.trim()) return;
    onShare(email);
    setEmail("");
    onClose();
  };

  const handleShareUser = (userEmail) => {
    onShare(userEmail);
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

        {/* Manual email input */}
        <input
          type="email"
          placeholder="Enter user email..."
          className="w-full p-2 border border-gray-300 rounded mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button 
          onClick={handleShareEmail}
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
                onClick={() => handleShareUser(user.email)}
                className="flex items-center space-x-3 w-full p-2 hover:bg-gray-100 rounded"
              >
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">
                  {initials}
                </div>
                <span>{user.email}</span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
