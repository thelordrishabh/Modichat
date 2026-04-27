import { useState } from "react";
import { createReport } from "../api";
import toast from "react-hot-toast";

const REASONS = ["Spam", "Harassment", "Inappropriate content", "Fake account", "Other"];

export default function ReportModal({ targetType, targetId, onClose }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [loading, setLoading] = useState(false);

  const submitReport = async () => {
    try {
      setLoading(true);
      await createReport({ targetType, targetId, reason });
      toast.success("Thanks for your report");
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Report {targetType}</h3>
        <div className="mt-4 space-y-2">
          {REASONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setReason(item)}
              className={`flex min-h-11 w-full items-center rounded-xl px-3 py-2 text-left text-sm ${
                reason === item ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onClose} className="min-h-11 flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-200">Cancel</button>
          <button type="button" disabled={loading} onClick={submitReport} className="min-h-11 flex-1 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white">{loading ? "Sending..." : "Report"}</button>
        </div>
      </div>
    </div>
  );
}
