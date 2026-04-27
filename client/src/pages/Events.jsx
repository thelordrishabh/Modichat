import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import EventCard from "../components/EventCard";
import { createEvent, getEvents, rsvpEvent } from "../api";

const DEFAULT_FORM = {
  title: "",
  date: "",
  location: "",
  description: "",
  coverImage: ""
};

export default function Events() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);

  const loadEvents = async () => {
    const { data } = await getEvents();
    setEvents(data);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await createEvent(form);
      setForm(DEFAULT_FORM);
      await loadEvents();
      toast.success("Event created");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create event");
    }
  };

  const handleRsvp = async (eventId, status) => {
    await rsvpEvent(eventId, status);
    await loadEvents();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <form onSubmit={submit} className="rounded-3xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Events</h1>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Event title" className="min-h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            <input type="datetime-local" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} className="min-h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            <input value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} placeholder="Location" className="min-h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            <input value={form.coverImage} onChange={(e) => setForm((prev) => ({ ...prev, coverImage: e.target.value }))} placeholder="Cover image URL" className="min-h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>
          <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Description" rows={3} className="mt-3 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          <button className="mt-3 min-h-11 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Create Event</button>
        </form>
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <EventCard key={event._id} event={event} onRsvp={(status) => handleRsvp(event._id, status)} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
