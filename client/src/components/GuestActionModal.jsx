import { Link } from "react-router-dom";

export default function GuestActionModal({ open, action, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center sm:p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Log in to continue</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              You need to sign in to {action}. Create an account or log in to join the community.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-2 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            Close
          </button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            to="/login"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Log In
          </Link>
          <Link
            to="/register"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
