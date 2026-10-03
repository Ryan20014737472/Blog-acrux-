import { GalleryIndex } from "@/features/gallery/gallery-index";
import { publicPageMetadata } from "@/lib/seo/public-metadata";

export const metadata = publicPageMetadata({
  path: "/galeria/",
  title: "Galeria",
  description: "Galeria de fotos e vídeos da ACRUX ROBOCEP.",
});

export default function GalleryPage() {
  return <GalleryIndex />;
}
