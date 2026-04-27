import { useState } from "react";
import Layout from "../components/Layout";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { updateProfile } from "../api";
import toast from "react-hot-toast";

export default function Settings() {
  const { dark, toggleDark } = useTheme();
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    email: user?.email || "",
    password: "",
    isPrivate: Boolean(user?.isPrivate),
    hideLikesDefault: false,
    notificationsEnabled: true
  });

  const saveAccount = async (e) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      payload.append("email", form.email);
      payload.append("password", form.password);
      payload.append("isPrivate", String(form.isPrivate));
      const { data } = await updateProfile(payload);
      updateUser(data);
      toast.success("Settings updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save settings");
    }
  };

  return (
    <Layout>
      <form onSubmit={saveAccount} className="space-y-4">
        <section className="rounded-3xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Account</h2>
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            <input value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Email" className="min-h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            <input type="password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} placeholder="Change password" className="min-h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>
        </section>
        <section className="rounded-3xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy</h2>
          <label className="mt-2 flex min-h-11 items-center justify-between rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            Private account
            <input type="checkbox" checked={form.isPrivate} onChange={(e) => setForm((prev) => ({ ...prev, isPrivate: e.target.checked }))} />
          </label>
          <label className="mt-2 flex min-h-11 items-center justify-between rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            Hide like count by default
            <input type="checkbox" checked={form.hideLikesDefault} onChange={(e) => setForm((prev) => ({ ...prev, hideLikesDefault: e.target.checked }))} />
          </label>
        </section>
        <section className="rounded-3xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
          <label className="mt-2 flex min-h-11 items-center justify-between rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            Enable push-style updates
            <input type="checkbox" checked={form.notificationsEnabled} onChange={(e) => setForm((prev) => ({ ...prev, notificationsEnabled: e.target.checked }))} />
          </label>
        </section>
        <section className="rounded-3xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Theme</h2>
          <button type="button" onClick={toggleDark} className="mt-2 min-h-11 rounded-xl bg-gray-100 px-4 py-2 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            Switch to {dark ? "light" : "dark"} mode
          </button>
        </section>
        <section className="rounded-3xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Blocked users</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Manage blocked accounts from profile actions.</p>
        </section>
        <section className="rounded-3xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">About</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Modichat v2.0 · Built with React, Express, MongoDB, Cloudinary.</p>
        </section>
        <button type="submit" className="min-h-11 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Save settings</button>
      </form>
    </Layout>
  );
}
