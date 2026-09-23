// POST /api/posts — create or upsert a blog post.
// Middleware gates this behind the vg_admin cookie.

import { NextResponse } from "next/server"

import { savePost, slugify, type Post } from "@/lib/posts-fs"

type Body = Partial<Post> & { tags?: string[] }

export async function POST(req: Request): Promise<NextResponse> {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 })
  }

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "title required" }, { status: 400 })
  }

  const slug = (body.slug && /^[a-z0-9-]+$/.test(body.slug) ? body.slug : slugify(body.title))
  if (!slug) {
    return NextResponse.json({ error: "could not derive slug" }, { status: 400 })
  }

  const today = new Date().toISOString().slice(0, 10)
  const post: Post = {
    slug,
    title: body.title.trim(),
    date: body.date && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : today,
    author: body.author?.trim() || "VettGuard Team",
    summary: body.summary?.trim() ?? "",
    cover: body.cover?.trim() || undefined,
    tags: Array.isArray(body.tags) ? body.tags.map(String) : undefined,
    draft: Boolean(body.draft),
    content: body.content ?? "",
  }
  await savePost(post)
  return NextResponse.json({ slug: post.slug })
}
