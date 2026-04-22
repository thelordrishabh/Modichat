import { useState } from "react";
import { createPost } from "../api";
import toast from "react-hot-toast";

export default function CreatePostModal({ onClose }) {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please select an image");

    setLoading(true);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("caption", caption);

    try {
      await createPost(formData);
      toast.success("Post created successfully!");
      onClose();
      // Optional: trigger a feed refresh
      window.location.reload(); 
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create new post</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-white transition">
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center relative overflow-hidden group">
            {file ? (
              <img src={URL.createObjectURL(file)} alt="Preview" className="object-cover w-full h-full" />
            ) : (
              <div className="text-center p-6 cursor-pointer" onClick={() => document.getElementById("file-upload").click()}>
                <span className="text-4xl block mb-2">📸</span>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Click to upload photo</p>
              </div>
            )}
            <input 
              id="file-upload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => setFile(e.target.files[0])} 
            />
          </div>

          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
            rows="3"
          />

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? "Sharing..." : "Share"}
          </button>
        </form>
      </div>
    </div>
  );
}
