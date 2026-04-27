import { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout";
import { useSocket } from "../context/SocketContext";

export default function LiveStream() {
  const { socket } = useSocket();
  const videoRef = useRef(null);
  const [streamId, setStreamId] = useState("");
  const [live, setLive] = useState(false);
  const [chat, setChat] = useState([]);
  const [text, setText] = useState("");
  const [viewers, setViewers] = useState(0);

  useEffect(() => {
    if (!socket) return;
    const onStreamMessage = (message) => setChat((prev) => [...prev, message]);
    const onViewers = (payload) => {
      if (payload.streamId === streamId) setViewers(payload.viewers || 0);
    };
    socket.on("stream-message", onStreamMessage);
    socket.on("stream:viewers", onViewers);
    return () => {
      socket.off("stream-message", onStreamMessage);
      socket.off("stream:viewers", onViewers);
    };
  }, [socket, streamId]);

  const startLive = async () => {
    const nextStreamId = `stream-${Date.now()}`;
    const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (videoRef.current) videoRef.current.srcObject = media;
    setStreamId(nextStreamId);
    setLive(true);
    socket?.emit("join-stream", { streamId: nextStreamId, user: { role: "broadcaster" } });
  };

  const endLive = () => {
    const tracks = videoRef.current?.srcObject?.getTracks?.() || [];
    tracks.forEach((track) => track.stop());
    socket?.emit("leave-stream", { streamId });
    setLive(false);
    setStreamId("");
    setViewers(0);
  };

  const sendStreamMessage = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const payload = { from: "Host", text, createdAt: new Date().toISOString() };
    socket?.emit("stream-message", { streamId, message: payload });
    setText("");
  };

  return (
    <Layout>
      <div className="mx-auto w-full max-w-5xl rounded-3xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Go Live</h1>
          {live ? <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">LIVE · {viewers} viewers</span> : null}
        </div>
        <video ref={videoRef} autoPlay muted playsInline className="aspect-video w-full rounded-2xl bg-black object-cover" />
        <div className="mt-3 flex gap-2">
          {!live ? (
            <button type="button" onClick={startLive} className="min-h-11 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white">Start Live</button>
          ) : (
            <button type="button" onClick={endLive} className="min-h-11 rounded-xl bg-gray-700 px-4 py-2 text-sm font-semibold text-white">End Live</button>
          )}
        </div>
        <div className="mt-4 rounded-2xl border border-gray-200 p-3 dark:border-gray-700">
          <div className="max-h-40 space-y-2 overflow-y-auto">
            {chat.map((item, index) => (
              <p key={`${item.createdAt}-${index}`} className="text-sm text-gray-700 dark:text-gray-200"><span className="font-semibold">{item.from}: </span>{item.text}</p>
            ))}
          </div>
          <form onSubmit={sendStreamMessage} className="mt-2 flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Chat..." className="min-h-11 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            <button type="submit" className="min-h-11 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white">Send</button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
