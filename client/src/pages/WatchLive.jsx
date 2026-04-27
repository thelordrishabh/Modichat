import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useSocket } from "../context/SocketContext";

export default function WatchLive() {
  const { socket } = useSocket();
  const [streamId, setStreamId] = useState("");
  const [chat, setChat] = useState([]);
  const [text, setText] = useState("");
  const [viewers, setViewers] = useState(0);

  useEffect(() => {
    if (!socket || !streamId) return;
    const onMessage = (message) => setChat((prev) => [...prev, message]);
    const onViewers = (payload) => {
      if (payload.streamId === streamId) setViewers(payload.viewers || 0);
    };
    socket.on("stream-message", onMessage);
    socket.on("stream:viewers", onViewers);
    return () => {
      socket.off("stream-message", onMessage);
      socket.off("stream:viewers", onViewers);
    };
  }, [socket, streamId]);

  const join = () => {
    if (!streamId.trim()) return;
    socket?.emit("join-stream", { streamId, user: { role: "viewer" } });
  };

  const leave = () => {
    socket?.emit("leave-stream", { streamId });
    setChat([]);
    setViewers(0);
  };

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    socket?.emit("stream-message", {
      streamId,
      message: { from: "Viewer", text, createdAt: new Date().toISOString() }
    });
    setText("");
  };

  return (
    <Layout>
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Watch Live</h1>
        <div className="mt-3 flex gap-2">
          <input value={streamId} onChange={(e) => setStreamId(e.target.value)} placeholder="Enter stream id" className="min-h-11 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          <button type="button" onClick={join} className="min-h-11 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white">Join</button>
          <button type="button" onClick={leave} className="min-h-11 rounded-xl bg-gray-700 px-4 py-2 text-sm font-semibold text-white">Leave</button>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Live viewers: {viewers}</p>
        <div className="mt-3 h-56 rounded-2xl bg-black/90 p-4 text-sm text-white">Stream video appears here (WebRTC peer connection ready for host/viewer signaling layer).</div>
        <div className="mt-3 max-h-44 space-y-2 overflow-y-auto rounded-2xl border border-gray-200 p-3 dark:border-gray-700">
          {chat.map((item, index) => (
            <p key={`${item.createdAt}-${index}`} className="text-sm text-gray-700 dark:text-gray-200"><span className="font-semibold">{item.from}: </span>{item.text}</p>
          ))}
        </div>
        <form onSubmit={send} className="mt-3 flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type chat..." className="min-h-11 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          <button className="min-h-11 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Send</button>
        </form>
      </div>
    </Layout>
  );
}
