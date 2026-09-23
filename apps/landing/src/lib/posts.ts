// File-system blog loader. Posts live in apps/landing/content/blog/*.md
// with gray-matter frontmatter. The admin editor writes back to the same
// directory; we read it here at request time (Next 15 caches the page).
//
// Phase 4 / scale plan: swap this loader for a DB-backed implementation
// (Postgres `blog_posts` table + MinIO for images). The shape of `Post`
// stays the same so consumers don't care.

import fs from "node:fs/promises"
import path from "node:path"

import matter from "gray-matter"

export type Post = {
  slug: string
  title: string
  date: string // ISO yyyy-mm-dd
  author: string
  summary: string
  cover?: string // /uploads/...png
  tags?: string[]
  content: string // raw markdown body
  draft?: boolean
}

const POSTS_DIR = path.join(process.cwd(), "content", "blog")

async function safeReaddir(dir: string): Promise<string[]> {
  try {
    return await fs.readdir(dir)
  } catch {
    return []
  }
}

export async function listPosts(opts: { includeDrafts?: boolean } = {}): Promise<Post[]> {
  const files = (await safeReaddir(POSTS_DIR)).filter((f) => f.endsWith(".md"))
  const posts = await Promise.all(files.map((f) => readPost(f.replace(/\.md$/, ""))))
  return posts
    .filter((p): p is Post => p !== null)
    .filter((p) => opts.includeDrafts || !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export async function readPost(slug: string): Promise<Post | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null
  const file = path.join(POSTS_DIR, `${slug}.md`)
  let raw: string
  try {
    raw = await fs.readFile(file, "utf8")
  } catch {
    return null
  }
  const parsed = matter(raw)
  const data = parsed.data as Partial<Post>
  return {
    slug,
    title: typeof data.title === "string" ? data.title : slug,
    date: typeof data.date === "string" ? data.date : "1970-01-01",
    author: typeof data.author === "string" ? data.author : "VettGuard",
    summary: typeof data.summary === "string" ? data.summary : "",
    cover: typeof data.cover === "string" ? data.cover : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
    draft: Boolean(data.draft),
    content: parsed.content,
  }
}

export async function listSlugs(): Promise<string[]> {
  const files = await safeReaddir(POSTS_DIR)
  return files.filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, ""))
}
