import { useState } from "react";
import { FiX } from "react-icons/fi";

export default function ShareNoteModal({ isOpen, onClose, onShare }) {
  const [email, setEmail] = useState("");

  const handleShare = () => {
    if (!email.trim()) return;
    onShare(email);
    setEmail("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-11/12 max-w-md shadow-lg relative">
        
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-600 hover:text-gray-900">
          <FiX size={24} />
        </button>

        <h2 className="text-xl font-bold mb-4">Share Note</h2>

        <input
          type="email"
          placeholder="Enter user email..."
          className="w-full p-2 border border-gray-300 rounded mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button 
          onClick={handleShare}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Share
        </button>
      </div>
    </div>
  );
}
