import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"
import type { Metadata } from "next"
import type { Locale } from "@vettguard/i18n/config"

import { FF, T } from "@/components/landing/dsl"
import { LandingNav } from "@/components/landing/hero"
import { LandingFooter } from "@/components/landing/sections"
import { listSlugs, readPost } from "@/lib/posts"

export const dynamic = "force-static"
export const revalidate = 60

export async function generateStaticParams() {
  const slugs = await listSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await readPost(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.summary,
      publishedTime: post.date,
      authors: [post.author],
      images: post.cover ? [{ url: post.cover }] : undefined,
    },
  }
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const post = await readPost(slug)
  if (!post || post.draft) notFound()

  return (
    <div style={{ background: T.bg, color: T.text, minHeight: "100vh" }}>
      <LandingNav locale={locale as Locale} />

      <article
        style={{
          padding: "72px 56px 96px",
          maxWidth: 760,
          marginInline: "auto",
        }}
      >
        <div
          style={{
            fontFamily: FF.mono,
            fontSize: 11,
            color: T.textMute,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          {post.date} · {post.author}
        </div>
        <h1
          style={{
            fontFamily: FF.display,
            fontSize: 48,
            fontWeight: 600,
            lineHeight: 1.08,
            letterSpacing: "-0.035em",
            margin: "0 0 18px",
            color: T.text,
          }}
        >
          {post.title}
        </h1>
        {post.summary && (
          <p
            style={{
              fontSize: 19,
              lineHeight: 1.55,
              color: T.textDim,
              margin: "0 0 32px",
              maxWidth: 680,
            }}
          >
            {post.summary}
          </p>
        )}
        {post.cover && (
          <img
            src={post.cover}
            alt=""
            style={{
              width: "100%",
              aspectRatio: "16 / 9",
              objectFit: "cover",
              borderRadius: 14,
              marginBottom: 36,
            }}
          />
        )}
        <div
          // Prose styles for the rendered markdown — inline since the rest
          // of the landing avoids global Tailwind plugins.
          style={{
            fontSize: 17,
            lineHeight: 1.7,
            color: T.text,
            fontFamily: FF.sans,
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={proseComponents}
          >
            {post.content}
          </ReactMarkdown>
        </div>
      </article>

      <LandingFooter />
    </div>
  )
}

import type { ComponentProps } from "react"

const proseComponents = {
  h2: (p: ComponentProps<"h2">) => (
    <h2
      style={{
        fontFamily: FF.display,
        fontSize: 28,
        fontWeight: 600,
        letterSpacing: "-0.02em",
        marginTop: 40,
        marginBottom: 14,
        color: T.text,
      }}
      {...p}
    />
  ),
  h3: (p: ComponentProps<"h3">) => (
    <h3
      style={{
        fontFamily: FF.display,
        fontSize: 22,
        fontWeight: 600,
        letterSpacing: "-0.015em",
        marginTop: 28,
        marginBottom: 10,
        color: T.text,
      }}
      {...p}
    />
  ),
  p: (p: ComponentProps<"p">) => (
    <p style={{ margin: "0 0 18px", color: T.textDim }} {...p} />
  ),
  a: (p: ComponentProps<"a">) => (
    <a
      style={{ color: T.orangeDeep, textDecoration: "underline" }}
      target={
        typeof p.href === "string" && /^https?:\/\//.test(p.href) ? "_blank" : undefined
      }
      rel={
        typeof p.href === "string" && /^https?:\/\//.test(p.href)
          ? "noopener noreferrer"
          : undefined
      }
      {...p}
    />
  ),
  strong: (p: ComponentProps<"strong">) => (
    <strong style={{ color: T.text, fontWeight: 600 }} {...p} />
  ),
  ul: (p: ComponentProps<"ul">) => (
    <ul style={{ paddingLeft: 22, margin: "0 0 18px", color: T.textDim }} {...p} />
  ),
  ol: (p: ComponentProps<"ol">) => (
    <ol style={{ paddingLeft: 22, margin: "0 0 18px", color: T.textDim }} {...p} />
  ),
  li: (p: ComponentProps<"li">) => <li style={{ marginBottom: 6 }} {...p} />,
  code: (p: ComponentProps<"code">) => (
    <code
      style={{
        fontFamily: FF.mono,
        fontSize: "0.9em",
        background: T.surfaceAlt,
        padding: "2px 6px",
        borderRadius: 4,
        color: T.text,
      }}
      {...p}
    />
  ),
  blockquote: (p: ComponentProps<"blockquote">) => (
    <blockquote
      style={{
        borderLeft: `3px solid ${T.orange}`,
        paddingLeft: 18,
        margin: "0 0 18px",
        color: T.textDim,
        fontStyle: "italic",
      }}
      {...p}
    />
  ),
  img: (p: ComponentProps<"img">) => (
    <img
      {...p}
      alt={p.alt ?? ""}
      style={{
        width: "100%",
        borderRadius: 12,
        margin: "18px 0",
        border: `1px solid ${T.border}`,
      }}
    />
  ),
}
