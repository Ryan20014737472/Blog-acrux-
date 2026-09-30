interface PostImages {
  cover_path: string | null;
  image_paths?: string[];
}

/** Keep the cover first and support posts created before multiple images. */
export function getPostImagePaths(post: PostImages): string[] {
  return Array.from(new Set([
    ...(post.cover_path ? [post.cover_path] : []),
    ...(post.image_paths ?? []),
  ].filter(Boolean)));
}
