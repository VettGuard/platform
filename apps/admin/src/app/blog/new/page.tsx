import { PostEditor, type EditorPost } from "@/components/post-editor"

export const dynamic = "force-dynamic"

export default function NewPostPage() {
  const today = new Date().toISOString().slice(0, 10)
  const initial: EditorPost = {
    slug: "",
    title: "",
    date: today,
    author: "VettGuard Team",
    summary: "",
    cover: undefined,
    tags: [],
    draft: true,
    content: "",
  }
  return <PostEditor initial={initial} mode="new" />
}
