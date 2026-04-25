import MobileLayout from "../../components/mobile/MobileLayout";
import Feed from "../../components/Feed";
import PageFade from "../../components/PageFade";

export default function MobileHome() {
  return (
    <MobileLayout>
      <PageFade className="pb-24 pt-4">
        <Feed />
      </PageFade>
    </MobileLayout>
  );
}
