export default function EventCard({ event, onRsvp }) {
  const goingCount = event.attendees?.filter((entry) => entry.status === "going").length || 0;

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {event.coverImage ? <img src={event.coverImage} alt={event.title} className="mb-3 h-44 w-full rounded-2xl object-cover" /> : null}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{event.title}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{new Date(event.date).toLocaleString()} · {event.location}</p>
      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{event.description}</p>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{goingCount} going</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => onRsvp?.("going")} className="min-h-11 rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white">Going</button>
        <button type="button" onClick={() => onRsvp?.("interested")} className="min-h-11 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white">Interested</button>
        <button type="button" onClick={() => onRsvp?.("not_going")} className="min-h-11 rounded-xl bg-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">Not going</button>
      </div>
    </div>
  );
}
