import Link from "next/link"

import { listPosts } from "@/lib/posts-fs"
import { LogoutBtn } from "./logout-btn"

export const dynamic = "force-dynamic"

export default async function BlogAdmin() {
  const posts = await listPosts()
  return (
    <div className="mx-auto max-w-5xl p-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--fg)]">
            Blog
          </h1>
          <p className="mt-1 text-sm text-[color:var(--fg-muted)]">
            {posts.length} {posts.length === 1 ? "post" : "posts"}. Writes
            land directly in <code className="font-mono text-xs">apps/landing/content/blog/</code>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LogoutBtn />
          <Link
            href="/blog/new"
            className="inline-flex h-9 items-center rounded-md bg-[color:var(--fg)] px-4 text-sm font-medium text-[color:var(--bg)] hover:opacity-90"
          >
            New post
          </Link>
        </div>
      </header>

      <ul className="mt-8 divide-y divide-[color:var(--border)] rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-elevated)]">
        {posts.length === 0 && (
          <li className="p-8 text-center text-sm text-[color:var(--fg-muted)]">
            No posts yet. <Link className="underline" href="/blog/new">Write the first one.</Link>
          </li>
        )}
        {posts.map((p) => (
          <li key={p.slug} className="flex items-center justify-between gap-6 p-4">
            <div className="min-w-0 flex-1">
              <Link
                href={`/blog/edit/${p.slug}`}
                className="block truncate text-sm font-medium text-[color:var(--fg)] hover:underline"
              >
                {p.title}
              </Link>
              <div className="mt-1 truncate text-xs text-[color:var(--fg-subtle)]">
                <span className="font-mono">{p.date}</span> · {p.author} · {p.slug}
                {p.draft && (
                  <span className="ml-2 rounded bg-[color:var(--warning)]/10 px-1.5 py-0.5 text-[color:var(--warning)]">
                    draft
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <a
                href={`http://localhost:3000/blog/${p.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[color:var(--fg-muted)] underline"
              >
                Preview
              </a>
              <Link
                href={`/blog/edit/${p.slug}`}
                className="text-[color:var(--accent)] underline"
              >
                Edit
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
