"use client";
import { useState } from "react";
import { FiPlus, FiUser, FiLogOut, FiShare2 } from "react-icons/fi";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("myNotes"); // "myNotes" or "shared"

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
            className={`cursor-pointer flex items-center p-2 w-full rounded ${
              activeTab === "myNotes" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setActiveTab("myNotes")}
          >
            <FiPlus className="mr-2" /> My Notes
          </button>
          <button
            className={`cursor-pointer flex items-center p-2 w-full rounded ${
              activeTab === "shared" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setActiveTab("shared")}
          >
            <FiShare2 className="mr-2" /> Shared Notes
          </button>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between bg-white shadow p-4">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>☰</button>
          <h2 className="text-xl font-semibold">
            {activeTab === "myNotes" ? "My Notes" : "Shared Notes"}
          </h2>
          <div className="flex items-center space-x-4">
            <FiUser className="text-gray-700 w-6 h-6" />
            <FiLogOut className="text-gray-700 w-6 h-6 cursor-pointer" />
          </div>
        </header>

        {/* Content */}
        <main className="p-4 overflow-y-auto">
          {activeTab === "myNotes" && (
            <div>           
              {children} 
            </div>
          )}
          {activeTab === "shared" && (
            <div>
           
              <p className="text-gray-500">Shared Notes tab content goes here.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
