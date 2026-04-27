import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import PageFade from "../components/PageFade";
import { getConversationSummaries } from "../api";
import Avatar from "../components/Avatar";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function Messages() {
  const { user, token } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getConversationSummaries();
        setConversations(data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
    const intervalId = setInterval(load, 15000);
    return () => clearInterval(intervalId);
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    const onIncoming = () => {
      getConversationSummaries().then(({ data }) => setConversations(data)).catch(() => {});
    };
    socket.on("dm:new", onIncoming);
    return () => socket.off("dm:new", onIncoming);
  }, [socket]);

  return (
    <Layout>
      <PageFade className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
        <div className="space-y-2">
          {conversations.map((conv) => {
            const otherUser = conv.members.find((member) => String(member._id) !== String(user._id));
            const unread = conv.unreadCount || 0;
            const online = otherUser?._id ? Boolean(onlineUsers[otherUser._id]) : false;
            return (
              <Link
                key={conv._id}
                to={`/chat/${otherUser?._id || ""}`}
                className="flex min-h-11 items-center justify-between rounded-2xl border border-gray-200 p-3 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar user={otherUser} size="h-12 w-12" />
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 ${online ? "bg-green-500" : "bg-gray-400"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900 dark:text-white">{otherUser?.name || "User"}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{conv.lastMessage?.messageType === "voice" ? "🎤 Voice message" : conv.lastMessage?.text || "Start chatting"}</p>
                  </div>
                </div>
                {unread > 0 ? (
                  <span className="rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">{unread > 99 ? "99+" : unread}</span>
                ) : null}
              </Link>
            );
          })}
          {conversations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              No conversations yet.
            </div>
          ) : null}
        </div>
      </PageFade>
    </Layout>
  );
}
