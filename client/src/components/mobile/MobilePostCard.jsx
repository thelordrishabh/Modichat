import { Link } from "react-router-dom";
import Avatar from "../Avatar";
import { getAssetUrl } from "../../api";

export default function MobilePostCard({ post }) {
  return (
    <div className="bg-white dark:bg-black border-b border-gray-50 dark:border-gray-900 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Avatar user={post.userId} size="h-9 w-9" />
          <div className="flex flex-col">
            <span className="text-sm font-bold dark:text-white leading-tight">{post.userId.name}</span>
            <span className="text-xs text-gray-400">@{post.userId.username}</span>
          </div>
        </div>
        <button className="text-gray-400">•••</button>
      </div>

      {/* Media */}
      <div className="w-full aspect-square bg-gray-100 dark:bg-gray-900 overflow-hidden">
        <img 
          src={getAssetUrl(post.imageUrl)} 
          className="w-full h-full object-cover" 
          alt="post" 
        />
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center gap-5 mb-2">
          <button className="text-2xl">🤍</button>
          <button className="text-2xl">💬</button>
          <button className="text-2xl">✈️</button>
        </div>
        <div className="text-sm font-bold dark:text-white mb-1">{post.likes.length} likes</div>
        <div className="text-sm dark:text-gray-200">
          <span className="font-bold mr-2">{post.userId.name}</span>
          {post.caption}
        </div>
        <div className="text-[10px] text-gray-400 uppercase mt-2 tracking-widest">
          {new Date(post.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
