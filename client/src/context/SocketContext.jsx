import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { BASE_URL } from "../api";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});

  useEffect(() => {
    if (!token || !user?._id) {
      if (socket) socket.disconnect();
      setSocket(null);
      return;
    }

    const nextSocket = io(BASE_URL, {
      transports: ["websocket"],
      auth: { token }
    });
    setSocket(nextSocket);

    nextSocket.on("connect", () => {
      nextSocket.emit("user:join", user._id);
    });

    nextSocket.on("presence:update", ({ userId, online }) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: online }));
    });

    return () => {
      nextSocket.disconnect();
      setSocket(null);
    };
  }, [token, user?._id]);

  const value = useMemo(() => ({
    socket,
    onlineUsers
  }), [onlineUsers, socket]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSocket() {
  return useContext(SocketContext);
}
