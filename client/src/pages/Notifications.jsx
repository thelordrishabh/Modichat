import { Link } from "react-router-dom";
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

export default function Notifications() {
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  return (
    <Layout>
      <PageFade className="mx-auto w-full max-w-4xl space-y-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
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
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Link
                key={notification._id}
                to={notification.sender?._id ? `/profile/${notification.sender._id}` : "/"}
                className={`flex flex-col gap-4 rounded-3xl border p-4 shadow-sm transition hover:border-gray-300 dark:hover:border-gray-600 sm:flex-row sm:items-center ${
                  notification.read
                    ? "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                    : "border-blue-200 bg-blue-50/60 dark:border-blue-800 dark:bg-blue-950/20"
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
            ))}
          </div>
        )}
      </PageFade>
    </Layout>
  );
}
