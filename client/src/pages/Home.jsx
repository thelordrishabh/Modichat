import Layout from "../components/Layout";
import Feed from "../components/Feed";
import PageFade from "../components/PageFade";

export default function Home() {
  return (
    <Layout>
      <PageFade className="mx-auto w-full max-w-xl py-2 md:py-6 px-4 sm:px-0">
        <Feed />
      </PageFade>
    </Layout>
  );
}
