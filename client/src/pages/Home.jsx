import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Feed from "../components/Feed";
import PageFade from "../components/PageFade";
import StoryRow from "../components/StoryRow";
import StoryViewer from "../components/StoryViewer";
import MusicPicker from "../components/MusicPicker";
import { createStory, getStories, viewStory } from "../api";
import toast from "react-hot-toast";

export default function Home() {
  const [stories, setStories] = useState([]);
  const [activeStory, setActiveStory] = useState(null);
  const [uploadingStory, setUploadingStory] = useState(false);

  const loadStories = async () => {
    try {
      const { data } = await getStories();
      setStories(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  const openCreateStory = async () => {
    if (uploadingStory) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        setUploadingStory(true);
        const form = new FormData();
        form.append("media", file);
        form.append("mediaType", file.type.startsWith("video") ? "video" : "image");
        await createStory(form);
        toast.success("Story uploaded");
        await loadStories();
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to upload story");
      } finally {
        setUploadingStory(false);
      }
    };
    input.click();
  };

  return (
    <Layout>
      <PageFade className="mx-auto w-full max-w-xl py-2 md:py-6 px-4 sm:px-0">
        <StoryRow stories={stories} onOpenStory={setActiveStory} onCreateStory={openCreateStory} />
        <div className="mb-4 rounded-3xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
          <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">Add music to story</p>
          <MusicPicker onSelect={() => {}} />
        </div>
        <Feed />
      </PageFade>
      {activeStory ? (
        <StoryViewer
          stories={stories}
          initialIndex={stories.findIndex((story) => story._id === activeStory._id)}
          onClose={() => setActiveStory(null)}
          onView={(story) => viewStory(story._id).catch(() => {})}
        />
      ) : null}
    </Layout>
  );
}
