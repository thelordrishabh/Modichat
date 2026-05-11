import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import Avatar from "../components/Avatar";
import PageFade from "../components/PageFade";
import { useNotifications } from "../context/NotificationsContext";
import { getAssetUrl } from "../api";

const notificationCopy = {
  like: "liked your post",
  comment: "commented on your post",
  follow: "started following you",
  mention: "mentioned you",
  collab: "invited you to collaborate",
  tip: "sent you a tip",
  badge: "sent you a badge",
  live: "started a live stream",
  follow_request: "requested to follow you"
};

const MotionDiv = motion.div;

export default function Notifications() {
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  return (
    <Layout>
      <PageFade className="mx-auto w-full max-w-4xl space-y-6">
        <div className="glass-panel rounded-3xl border border-white/15 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {unreadCount > 0 ? `${unreadCount} unread updates` : "You're all caught up."}
              </p>
            </div>
            <button
              onClick={markAllAsRead}
              className="min-h-11 rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              Mark all as read
            </button>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="glass-panel rounded-3xl border border-dashed border-white/20 p-10 text-center text-gray-500 dark:text-gray-400">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification, index) => (
              <MotionDiv
                key={notification._id}
                initial={{ opacity: 0, y: 28, scale: 0.94, filter: "blur(12px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                transition={{ delay: index * 0.045, duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  to={notification.sender?._id ? `/profile/${notification.sender._id}` : "/"}
                  className={`notification-reveal flex flex-col gap-4 rounded-3xl border p-4 shadow-sm transition sm:flex-row sm:items-center ${
                    notification.read
                      ? "border-white/15 bg-white/10"
                      : "border-blue-300/40 bg-blue-500/15"
                  }`}
                >
                  <Avatar user={notification.sender} size="h-12 w-12" textSize="text-lg" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <span className="font-semibold">{notification.sender?.name || "Someone"}</span>{" "}
                      {notificationCopy[notification.type] || "sent you an update"}
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(notification.createdAt).toLocaleString()}
                    </div>
                    {notification.post?.caption ? (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                        {notification.post.caption}
                      </p>
                    ) : null}
                  </div>
                  {notification.post?.imageUrl ? (
                    <img
                      src={getAssetUrl(notification.post.imageUrl)}
                      alt="Related post"
                      className="h-16 w-16 rounded-2xl object-cover"
                    />
                  ) : null}
                </Link>
              </MotionDiv>
            ))}
          </div>
        )}
      </PageFade>
    </Layout>
  );
}
