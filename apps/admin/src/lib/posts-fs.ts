// Admin-side filesystem accessor for blog posts.
//
// The landing app stores posts as markdown files in
// `apps/landing/content/blog/*.md`. In dev (single-machine monorepo) the
// admin process can write to that directory directly via a relative path,
// which is fast enough to author + preview within seconds.
//
// Production migration: swap this module for a Postgres-backed loader
// (table `blog_posts` with columns matching the `Post` shape) and an
// S3/MinIO uploader for cover images. Callers don't care which backend
// they hit because the public functions return the same shapes.

import fs from "node:fs/promises"
import path from "node:path"

import matter from "gray-matter"

const ROOT = path.resolve(process.cwd(), "..", "..", "apps", "landing")
const POSTS_DIR = path.join(ROOT, "content", "blog")
const UPLOADS_DIR = path.join(ROOT, "public", "uploads")

const SLUG_RE = /^[a-z0-9-]+$/

export type PostFrontmatter = {
  title: string
  date: string
  author: string
  summary: string
  cover?: string
  tags?: string[]
  draft?: boolean
}

export type Post = PostFrontmatter & { slug: string; content: string }

export async function ensureDirs(): Promise<void> {
  await fs.mkdir(POSTS_DIR, { recursive: true })
  await fs.mkdir(UPLOADS_DIR, { recursive: true })
}

export async function listPosts(): Promise<Post[]> {
  await ensureDirs()
  const files = (await fs.readdir(POSTS_DIR)).filter((f) => f.endsWith(".md"))
  const posts = await Promise.all(
    files.map(async (f): Promise<Post | null> => {
      const slug = f.replace(/\.md$/, "")
      return readPost(slug)
    }),
  )
  return posts
    .filter((p): p is Post => p !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export async function readPost(slug: string): Promise<Post | null> {
  if (!SLUG_RE.test(slug)) return null
  const file = path.join(POSTS_DIR, `${slug}.md`)
  let raw: string
  try {
    raw = await fs.readFile(file, "utf8")
  } catch {
    return null
  }
  const parsed = matter(raw)
  const data = parsed.data as Partial<PostFrontmatter>
  return {
    slug,
    title: data.title ?? slug,
    date: data.date ?? new Date().toISOString().slice(0, 10),
    author: data.author ?? "VettGuard Team",
    summary: data.summary ?? "",
    cover: data.cover,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
    draft: Boolean(data.draft),
    content: parsed.content,
  }
}

export async function savePost(post: Post): Promise<void> {
  if (!SLUG_RE.test(post.slug)) throw new Error("invalid slug")
  await ensureDirs()
  const fm: PostFrontmatter = {
    title: post.title,
    date: post.date,
    author: post.author,
    summary: post.summary,
    cover: post.cover,
    tags: post.tags,
    draft: post.draft,
  }
  // gray-matter's stringify writes YAML frontmatter + body.
  const body = matter.stringify(post.content, fm)
  await fs.writeFile(path.join(POSTS_DIR, `${post.slug}.md`), body, "utf8")
}

export async function deletePost(slug: string): Promise<void> {
  if (!SLUG_RE.test(slug)) throw new Error("invalid slug")
  await fs.unlink(path.join(POSTS_DIR, `${slug}.md`)).catch(() => undefined)
}

export async function saveUpload(filename: string, buf: Buffer): Promise<string> {
  await ensureDirs()
  const safe = filename.replace(/[^a-z0-9._-]/gi, "-").toLowerCase()
  const stamp = Date.now()
  const finalName = `${stamp}-${safe}`
  await fs.writeFile(path.join(UPLOADS_DIR, finalName), buf)
  return `/uploads/${finalName}`
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/['"`’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}
