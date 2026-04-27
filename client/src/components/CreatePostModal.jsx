import { useEffect, useState } from "react";
import { createPost } from "../api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import MentionInput from "./MentionInput";
import FilterPicker from "./FilterPicker";
import StickerCanvas from "./StickerCanvas";

export default function CreatePostModal({ onClose }) {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [selectedFilter, setSelectedFilter] = useState({ name: "normal", css: "none" });
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", "", "", ""]);
  const [hideLikes, setHideLikes] = useState(false);
  const [isExclusive, setIsExclusive] = useState(false);
  const [collaboratorUsername, setCollaboratorUsername] = useState("");
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please select an image");

    setLoading(true);
    const formData = new FormData();
    formData.append("media", file);
    formData.append("caption", caption);
    formData.append("mediaType", mediaType);
    formData.append("filter", selectedFilter.name);
    formData.append("hideLikes", String(hideLikes));
    formData.append("isExclusive", String(isExclusive));
    formData.append("collaboratorUsername", collaboratorUsername);
    if (pollEnabled) {
      formData.append("pollQuestion", pollQuestion);
      pollOptions.forEach((option, index) => {
        if (option.trim()) formData.append(`pollOption${index + 1}`, option.trim());
      });
    }
    formData.append("stickers", JSON.stringify(stickers));

    try {
      await createPost(formData);
      toast.success("Post created successfully!");
      window.dispatchEvent(new Event("modichat:post-created"));
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-0 md:items-center md:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex max-h-[92vh] flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create new post</h2>
          <button onClick={onClose} className="flex min-h-11 min-w-11 items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-white transition">
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 flex flex-col gap-4">
          <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center relative overflow-hidden group">
            {file ? (
              mediaType === "video" ? (
                <video src={previewUrl} className="h-full w-full object-cover" muted controls />
              ) : (
                <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" style={{ filter: selectedFilter.css }} />
              )
            ) : (
              <div className="text-center p-6 cursor-pointer" onClick={() => document.getElementById("file-upload").click()}>
                <span className="text-4xl block mb-2">📸</span>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Click to upload photo</p>
              </div>
            )}
            <input 
              id="file-upload" 
              type="file" 
              accept="image/*,video/*" 
              className="hidden" 
              onChange={(e) => {
                const nextFile = e.target.files[0];
                setFile(nextFile);
                setMediaType(nextFile?.type?.startsWith("video") ? "video" : "image");
              }} 
            />
          </div>

          <MentionInput value={caption} onChange={setCaption} placeholder="Write a caption with #hashtags and @mentions..." />
          <FilterPicker value={selectedFilter} onChange={setSelectedFilter} />
          <StickerCanvas onAddSticker={(emoji) => setStickers((prev) => [...prev, { emoji, x: 50, y: 50 }])} />
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex min-h-11 items-center justify-between rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-200">
              Add poll
              <input type="checkbox" checked={pollEnabled} onChange={(e) => setPollEnabled(e.target.checked)} />
            </label>
            <label className="flex min-h-11 items-center justify-between rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-200">
              Hide likes count
              <input type="checkbox" checked={hideLikes} onChange={(e) => setHideLikes(e.target.checked)} />
            </label>
            <label className="flex min-h-11 items-center justify-between rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-200">
              Subscriber only
              <input type="checkbox" checked={isExclusive} onChange={(e) => setIsExclusive(e.target.checked)} />
            </label>
            <input
              value={collaboratorUsername}
              onChange={(e) => setCollaboratorUsername(e.target.value)}
              placeholder="Collab with @username"
              className="min-h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          {pollEnabled ? (
            <div className="space-y-2 rounded-xl border border-gray-200 p-3 dark:border-gray-600">
              <input value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="Poll question" className="min-h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              {pollOptions.map((option, index) => (
                <input
                  key={index}
                  value={option}
                  onChange={(e) => setPollOptions((prev) => prev.map((entry, entryIndex) => (entryIndex === index ? e.target.value : entry)))}
                  placeholder={`Option ${index + 1}`}
                  className="min-h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              ))}
            </div>
          ) : null}
          <button type="button" onClick={() => navigate("/live")} className="min-h-11 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white">
            Go Live
          </button>

          <button 
            type="submit" 
            disabled={loading}
            className="min-h-11 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? "Sharing..." : "Share"}
          </button>
        </form>
      </div>
    </div>
  );
}
