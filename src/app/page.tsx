import { HomePage } from "@/features/home/home-page";
import { publicPageMetadata } from "@/lib/seo/public-metadata";

export const metadata = publicPageMetadata({ path: "/" });

export default function Home() {
  return <HomePage />;
}

