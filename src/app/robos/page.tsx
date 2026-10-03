import { RobotsIndex } from "@/features/robots/robots-index";
import { publicPageMetadata } from "@/lib/seo/public-metadata";

export const metadata = publicPageMetadata({
  path: "/robos/",
  title: "Robôs",
  description: "Conheça os robôs, mecanismos e temporadas da ACRUX ROBOCEP.",
});

export default function RobotsPage() {
  return <RobotsIndex />;
}

