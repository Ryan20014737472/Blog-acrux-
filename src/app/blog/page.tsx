import { BlogIndex } from "@/features/blog/blog-index";
import { publicPageMetadata } from "@/lib/seo/public-metadata";

export const metadata = publicPageMetadata({
  path: "/blog/",
  title: "Blog",
  description: "Notícias, projetos, bastidores e histórias da ACRUX ROBOCEP.",
});

export default function BlogPage() {
  return <BlogIndex />;
}

