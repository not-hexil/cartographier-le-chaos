import { posts } from "#velite";

const isVisible = (post: (typeof posts)[number]) =>
  process.env.NODE_ENV !== "production" || !post.draft;

export function getPublishedPosts() {
  return posts.filter(isVisible).sort((a, b) => b.date.localeCompare(a.date));
}

export function getPostBySlug(slug: string) {
  return getPublishedPosts().find((post) => post.slug === slug);
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

export function formatDate(iso: string) {
  return dateFormat.format(new Date(iso));
}
