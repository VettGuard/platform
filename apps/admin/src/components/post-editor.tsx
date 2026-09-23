"use client"

import { useRouter } from "next/navigation"
import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from "react"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"

export type EditorPost = {
  slug: string
  title: string
  date: string
  author: string
  summary: string
  cover?: string
  tags?: string[]
  draft?: boolean
  content: string
}

type Status = "idle" | "saving" | "saved" | "error"

export function PostEditor({
  initial,
  mode,
}: {
  initial: EditorPost
  mode: "new" | "edit"
}) {
  const router = useRouter()
  const [post, setPost] = useState(initial)
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [tagsRaw, setTagsRaw] = useState((initial.tags ?? []).join(", "))
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function setField<K extends keyof EditorPost>(k: K, v: EditorPost[K]) {
    setPost((p) => ({ ...p, [k]: v }))
  }

  // Save → POST /api/posts. The slug in the URL identifies updates;
  // server falls back to slug-from-title for new posts.
  async function save() {
    setStatus("saving")
    setErrorMsg("")
    try {
      const body = {
        ...post,
        tags: tagsRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      }
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? `HTTP ${res.status}`)
      }
      const json = (await res.json()) as { slug: string }
      setStatus("saved")
      // After a successful new-post save, navigate to the canonical edit URL.
      if (mode === "new" || json.slug !== post.slug) {
        router.replace(`/blog/edit/${json.slug}`)
      } else {
        router.refresh()
      }
    } catch (err) {
      setStatus("error")
      setErrorMsg(err instanceof Error ? err.message : "Save failed")
    }
  }

  async function deletePost() {
    if (!confirm(`Delete "${post.title}"? This can't be undone.`)) return
    const res = await fetch(`/api/posts/${post.slug}`, { method: "DELETE" })
    if (res.ok) router.replace("/blog")
  }

  // Upload an image and insert the markdown reference at the caret.
  const uploadImage = useCallback(
    async (file: File): Promise<string | null> => {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (!res.ok) return null
      const json = (await res.json()) as { url: string }
      return json.url
    },
    [],
  )

  function insertAtCaret(snippet: string) {
    const ta = textareaRef.current
    if (!ta) {
      setField("content", post.content + snippet)
      return
    }
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const next = post.content.slice(0, start) + snippet + post.content.slice(end)
    setField("content", next)
    // Move caret to end of insertion next tick.
    requestAnimationFrame(() => {
      ta.focus()
      ta.selectionStart = ta.selectionEnd = start + snippet.length
    })
  }

  async function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    e.target.value = ""
    const url = await uploadImage(f)
    if (url) insertAtCaret(`\n![](${url})\n`)
  }

  async function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = Array.from(e.clipboardData.items)
    const image = items.find((i) => i.type.startsWith("image/"))
    if (!image) return
    e.preventDefault()
    const file = image.getAsFile()
    if (!file) return
    const url = await uploadImage(file)
    if (url) insertAtCaret(`\n![](${url})\n`)
  }

  async function onDrop(e: DragEvent<HTMLTextAreaElement>) {
    const file = e.dataTransfer.files?.[0]
    if (!file?.type.startsWith("image/")) return
    e.preventDefault()
    const url = await uploadImage(file)
    if (url) insertAtCaret(`\n![](${url})\n`)
  }

  function setCover() {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = async () => {
      const f = input.files?.[0]
      if (!f) return
      const url = await uploadImage(f)
      if (url) setField("cover", url)
    }
    input.click()
  }

  return (
    <div className="mx-auto max-w-6xl p-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <a
            href="/blog"
            className="text-xs text-[color:var(--fg-muted)] underline"
          >
            ← All posts
          </a>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[color:var(--fg)]">
            {mode === "new" ? "New post" : "Edit post"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {status === "saved" && (
            <span className="text-xs text-[color:var(--success)]">Saved.</span>
          )}
          {status === "error" && (
            <span className="text-xs text-[color:var(--danger)]">{errorMsg}</span>
          )}
          {mode === "edit" && (
            <button
              onClick={deletePost}
              className="h-9 rounded-md border border-[color:var(--danger)]/40 px-3 text-xs font-medium text-[color:var(--danger)] hover:bg-[color:var(--danger)]/10"
            >
              Delete
            </button>
          )}
          <button
            onClick={save}
            disabled={status === "saving"}
            className="inline-flex h-9 items-center rounded-md bg-[color:var(--fg)] px-4 text-sm font-medium text-[color:var(--bg)] hover:opacity-90 disabled:opacity-50"
          >
            {status === "saving" ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      {/* Metadata grid */}
      <div className="grid grid-cols-1 gap-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-5 md:grid-cols-2">
        <Field label="Title">
          <input
            value={post.title}
            onChange={(e) => setField("title", e.target.value)}
            className={fieldClass}
            placeholder="The dispatcher's copilot ships"
          />
        </Field>
        <Field label="Slug">
          <input
            value={post.slug}
            onChange={(e) =>
              setField(
                "slug",
                e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
              )
            }
            className={`${fieldClass} font-mono`}
            placeholder="auto-from-title"
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            value={post.date}
            onChange={(e) => setField("date", e.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field label="Author">
          <input
            value={post.author}
            onChange={(e) => setField("author", e.target.value)}
            className={fieldClass}
            placeholder="VettGuard Team"
          />
        </Field>
        <Field label="Summary" wide>
          <input
            value={post.summary}
            onChange={(e) => setField("summary", e.target.value)}
            className={fieldClass}
            placeholder="One-sentence hook shown on /blog and in OG previews."
          />
        </Field>
        <Field label="Tags (comma separated)">
          <input
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            className={fieldClass}
            placeholder="product, launch"
          />
        </Field>
        <Field label="Cover image">
          <div className="flex items-center gap-2">
            <input
              value={post.cover ?? ""}
              onChange={(e) => setField("cover", e.target.value || undefined)}
              className={`${fieldClass} font-mono text-xs`}
              placeholder="/uploads/…"
            />
            <button
              onClick={setCover}
              className="h-9 shrink-0 rounded-md border border-[color:var(--border)] px-3 text-xs text-[color:var(--fg)] hover:bg-[color:var(--bg-subtle)]"
            >
              Upload…
            </button>
          </div>
        </Field>
        <Field label="Status">
          <label className="inline-flex items-center gap-2 text-sm text-[color:var(--fg)]">
            <input
              type="checkbox"
              checked={Boolean(post.draft)}
              onChange={(e) => setField("draft", e.target.checked)}
            />
            Draft (won&apos;t show on /blog)
          </label>
        </Field>
      </div>

      {/* Editor + preview */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-elevated)]">
          <div className="flex items-center justify-between border-b border-[color:var(--border)] px-4 py-2">
            <span className="text-xs font-medium text-[color:var(--fg-muted)]">
              Markdown
            </span>
            <label className="cursor-pointer text-xs text-[color:var(--accent)] underline">
              Insert image
              <input type="file" accept="image/*" className="hidden" onChange={onPickFile} />
            </label>
          </div>
          <textarea
            ref={textareaRef}
            value={post.content}
            onChange={(e) => setField("content", e.target.value)}
            onPaste={onPaste}
            onDrop={onDrop}
            spellCheck
            className="block min-h-[70vh] w-full resize-y bg-transparent p-4 font-mono text-sm text-[color:var(--fg)] focus-visible:outline-none"
            placeholder="# Write your post in markdown.

Paste, drop, or use the **Insert image** button to upload pictures."
          />
        </div>

        <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg)]">
          <div className="border-b border-[color:var(--border)] px-4 py-2 text-xs font-medium text-[color:var(--fg-muted)]">
            Preview
          </div>
          <article className="prose-vg max-w-none p-6 text-[color:var(--fg)]">
            <h1 className="text-3xl font-semibold tracking-tight">
              {post.title || "Untitled"}
            </h1>
            <p className="mt-1 text-sm text-[color:var(--fg-muted)]">
              {post.date} · {post.author}
              {post.draft && (
                <span className="ml-2 rounded bg-[color:var(--warning)]/10 px-1.5 py-0.5 text-[color:var(--warning)]">
                  draft
                </span>
              )}
            </p>
            {post.summary && (
              <p className="mt-3 text-lg text-[color:var(--fg-muted)]">
                {post.summary}
              </p>
            )}
            {post.cover && (
              <img
                src={post.cover}
                className="mt-4 w-full rounded-md border border-[color:var(--border)]"
              />
            )}
            <div className="mt-6 leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              >
                {post.content}
              </ReactMarkdown>
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}

const fieldClass =
  "block h-9 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--bg)] px-3 text-sm text-[color:var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"

function Field({
  label,
  children,
  wide,
}: {
  label: string
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <label className={`block ${wide ? "md:col-span-2" : ""}`}>
      <span className="block text-xs font-medium text-[color:var(--fg-muted)]">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  )
}
