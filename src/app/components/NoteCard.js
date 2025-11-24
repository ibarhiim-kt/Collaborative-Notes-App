import { FiShare2, FiEdit, FiTrash2, FiDownload, FiUpload, FiTrash } from "react-icons/fi";
import { useState, useEffect } from "react";
import { uploadAttachment, downloadAttachment, deleteAttachment } from "../supabase/supabaseAttachments";

export default function NoteCard({
  id,
  title,
  content,
  role,
  attachments = [],
  onEdit,
  onDelete,
  onShare,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentAttachments, setCurrentAttachments] = useState(attachments);

  useEffect(() => {
    // If parent updates attachments, keep them in sync
    setCurrentAttachments(attachments);
  }, [attachments]);

  const handleUpload = async () => {
    if (!selectedFile) return alert("Select file first");

    const result = await uploadAttachment(id, selectedFile);
    if (!result) return alert("Upload failed");

    // Add newly uploaded attachment to state
    setCurrentAttachments((prev) => [...prev, result]);
    setSelectedFile(null);
    alert("Uploaded!");
  };

  const handleDelete = async (file) => {
    const confirmed = window.confirm(`Delete attachment "${file.filename}"?`);
    if (!confirmed) return;

    const success = await deleteAttachment(file.id, file.path);
    if (!success) return;

    setCurrentAttachments((prev) => prev.filter((f) => f.id !== file.id));
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-bold">{title}</h3>

        <div className="flex space-x-2 text-gray-500">
          {(role === "owner" || role === "editor") && (
            <FiEdit className="cursor-pointer" onClick={onEdit} />
          )}
          {role === "owner" && (
            <FiShare2 className="cursor-pointer" onClick={onShare} />
          )}
          {role === "owner" && (
            <FiTrash2 className="cursor-pointer" onClick={onDelete} />
          )}
        </div>
      </div>

      <p className="text-gray-600 mt-2">{content}</p>

      {/* Attachments List */}
      <div className="mt-3">
        <p className="font-semibold">Attachments:</p>
        {currentAttachments.length === 0 ? (
          <p className="text-sm text-gray-400">No attachments</p>
        ) : (
          currentAttachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between bg-gray-100 p-2 rounded mt-1"
            >
              <span>{file.filename}</span>
              <div className="flex space-x-2">
                <FiDownload
                  className="cursor-pointer"
                  onClick={() => downloadAttachment(file.path, file.filename)}
                />
                {(role === "owner" || role === "editor") && (
                  <FiTrash
                    className="cursor-pointer text-red-500"
                    onClick={() => handleDelete(file)}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Section */}
      {(role === "owner" || role === "editor") && (
        <div className="mt-3">
          <input
            type="file"
            className="mb-2"
            onChange={(e) => setSelectedFile(e.target.files[0])}
          />
          <button
            onClick={handleUpload}
            className="bg-blue-500 text-white px-3 py-1 rounded flex items-center gap-2"
          >
            <FiUpload /> Upload
          </button>
        </div>
      )}
    </div>
  );
}
