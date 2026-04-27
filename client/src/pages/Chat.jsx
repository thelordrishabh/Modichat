import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import Avatar from "../components/Avatar";
import { getMessagesByUser, sendMessageToUser } from "../api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function Chat() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [messages, setMessages] = useState([]);
  const [target, setTarget] = useState(null);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    const loadConversation = async () => {
      try {
        const { data } = await getMessagesByUser(userId);
        setMessages(data.messages || []);
        const peer = (data.messages || []).find((entry) => String(entry.senderId?._id) !== String(user?._id))?.senderId;
        setTarget(peer || { _id: userId, name: "User" });
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load chat");
      }
    };
    loadConversation();
  }, [userId, user?._id]);

  useEffect(() => {
    if (!socket) return;
    const onNewMessage = (payload) => {
      const sender = String(payload.senderId?._id || payload.senderId);
      if (sender === userId || sender === String(user?._id)) {
        setMessages((prev) => [...prev, payload]);
      }
    };
    const onTyping = ({ fromUser }) => {
      if (String(fromUser?._id) === userId) {
        setTyping(true);
        setTimeout(() => setTyping(false), 1200);
      }
    };
    socket.on("dm:new", onNewMessage);
    socket.on("dm:typing", onTyping);
    return () => {
      socket.off("dm:new", onNewMessage);
      socket.off("dm:typing", onTyping);
    };
  }, [socket, userId, user?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!recording) return;
    const tick = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(tick);
  }, [recording]);

  const sendText = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const { data } = await sendMessageToUser(userId, { text });
      setMessages((prev) => [...prev, data]);
      setText("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send");
    }
  };

  const startVoice = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = (event) => chunksRef.current.push(event.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("audio", blob, "voice.webm");
      formData.append("messageType", "voice");
      try {
        const { data } = await sendMessageToUser(userId, formData);
        setMessages((prev) => [...prev, data]);
      } catch (err) {
        toast.error(err.response?.data?.message || "Voice send failed");
      }
      stream.getTracks().forEach((track) => track.stop());
    };
    recorder.start();
    setSeconds(0);
    setRecording(true);
  };

  const stopVoice = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const online = useMemo(() => Boolean(onlineUsers[userId]), [onlineUsers, userId]);

  return (
    <Layout>
      <div className="mx-auto flex h-[78vh] w-full max-w-4xl flex-col rounded-3xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-3 border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="relative">
            <Avatar user={target} />
            <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 ${online ? "bg-green-500" : "bg-gray-400"}`} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{target?.name || "Chat"}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{typing ? `${target?.name || "User"} is typing...` : online ? "Online" : "Offline"}</p>
          </div>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {messages.map((message) => {
            const mine = String(message.senderId?._id || message.senderId) === String(user?._id);
            return (
              <div key={message._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100"}`}>
                  {message.messageType === "voice" && message.audioUrl ? (
                    <audio controls src={message.audioUrl} className="h-8 w-full" />
                  ) : (
                    <p>{message.text}</p>
                  )}
                  <div className={`mt-1 text-[10px] ${mine ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>
                    {mine ? (message.seen ? "✓✓ seen" : message.delivered ? "✓✓ delivered" : "✓ sent") : ""}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={sendText} className="flex items-center gap-2 border-t border-gray-200 p-3 dark:border-gray-700">
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              socket?.emit("dm:typing", { toUserId: userId, fromUser: { _id: user?._id, name: user?.name } });
            }}
            placeholder="Message..."
            className="min-h-11 flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-900 outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          {!recording ? (
            <button type="button" onMouseDown={startVoice} onTouchStart={startVoice} className="min-h-11 min-w-11 rounded-full bg-red-500 text-white">🎤</button>
          ) : (
            <button type="button" onMouseUp={stopVoice} onTouchEnd={stopVoice} className="min-h-11 min-w-11 rounded-full bg-gray-700 text-white">{seconds}s</button>
          )}
          <button type="submit" className="min-h-11 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Send</button>
        </form>
      </div>
    </Layout>
  );
}
