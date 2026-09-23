import { notFound } from "next/navigation"

import { PostEditor, type EditorPost } from "@/components/post-editor"
import { readPost } from "@/lib/posts-fs"

export const dynamic = "force-dynamic"

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await readPost(slug)
  if (!post) notFound()
  const initial: EditorPost = {
    slug: post.slug,
    title: post.title,
    date: post.date,
    author: post.author,
    summary: post.summary,
    cover: post.cover,
    tags: post.tags ?? [],
    draft: post.draft,
    content: post.content,
  }
  return <PostEditor initial={initial} mode="edit" />
}
