import { createContext, useContext, useEffect, useState } from "react";
import { getNotifications, markNotificationsRead } from "../api";
import { useAuth } from "./AuthContext";

const NotificationsContext = createContext();

export function NotificationsProvider({ children }) {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const refreshNotifications = async () => {
    if (!token) {
      setNotifications([]);
      return [];
    }

    const { data } = await getNotifications();
    setNotifications(data);
    return data;
  };

  const markAllAsRead = async () => {
    if (!token) return;

    await markNotificationsRead();
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) => ({
        ...notification,
        read: true
      }))
    );
  };

  useEffect(() => {
    let isCancelled = false;

    const syncNotifications = async () => {
      if (!token) {
        setNotifications([]);
        return;
      }

      try {
        const { data } = await getNotifications();
        if (!isCancelled) {
          setNotifications(data);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Failed to fetch notifications", err);
        }
      }
    };

    syncNotifications();

    if (!token) {
      return () => {
        isCancelled = true;
      };
    }

    const intervalId = setInterval(syncNotifications, 30000);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [token]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        refreshNotifications,
        markAllAsRead
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
