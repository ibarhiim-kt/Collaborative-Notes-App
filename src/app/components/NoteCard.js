import { FiShare2, FiEdit, FiTrash2 } from "react-icons/fi";

export default function NoteCard({ title, content, onEdit, onDelete, onShare }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-bold">{title}</h3>
        <div className="flex space-x-2 text-gray-500">
          <FiEdit className="cursor-pointer" onClick={onEdit} />
          <FiShare2 className="cursor-pointer" onClick={onShare} />
          <FiTrash2 className="cursor-pointer" onClick={onDelete} />
        </div>
      </div>
      <p className="text-gray-600 mt-2">{content}</p>
    </div>
  );
}
