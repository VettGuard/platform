import { setRequestLocale } from "next-intl/server"
import type { Locale } from "@vettguard/i18n/config"

import { FF, T } from "@/components/landing/dsl"
import { LandingNav, Hero } from "@/components/landing/hero"
import { LandingFooter } from "@/components/landing/sections"
import { listPosts } from "@/lib/posts"

export const dynamic = "force-static"
export const revalidate = 60 // re-read content/blog after 60s (admin edits)

// Voiding the unused-Hero import bothered me less than touching the
// LandingNav import path. Hero isn't referenced here.
void Hero

export default async function Blog({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const posts = await listPosts()
  const localePrefix = locale === "en" ? "" : `/${locale}`

  return (
    <div style={{ background: T.bg, color: T.text, minHeight: "100vh" }}>
      <LandingNav locale={locale as Locale} />

      <section
        style={{
          padding: "96px 56px 32px",
          background: T.bg,
          maxWidth: 1080,
          marginInline: "auto",
        }}
      >
        <div
          style={{
            fontFamily: FF.sans,
            fontSize: 12,
            fontWeight: 600,
            color: T.orange,
            letterSpacing: "-0.005em",
            textTransform: "uppercase",
          }}
        >
          Blog
        </div>
        <h1
          style={{
            fontFamily: FF.display,
            fontSize: 56,
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
            margin: "10px 0 18px",
            color: T.text,
          }}
        >
          Notes from the road
        </h1>
        <p
          style={{
            fontSize: 19,
            lineHeight: 1.5,
            color: T.textDim,
            letterSpacing: "-0.005em",
            margin: 0,
            maxWidth: 720,
          }}
        >
          Product launches, engineering deep dives, and field notes from the
          dispatchers who run on VettGuard.
        </p>
      </section>

      <section
        style={{
          padding: "32px 56px 96px",
          background: T.bg,
          maxWidth: 1080,
          marginInline: "auto",
        }}
      >
        {posts.length === 0 ? (
          <div
            style={{
              padding: "32px 28px",
              background: T.surfaceAlt,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              color: T.textDim,
              fontSize: 15,
              textAlign: "center",
            }}
          >
            No posts yet. Check back soon.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 18,
            }}
          >
            {posts.map((p) => (
              <a
                key={p.slug}
                href={`${localePrefix}/blog/${p.slug}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: 14,
                  overflow: "hidden",
                  textDecoration: "none",
                  color: "inherit",
                  boxShadow: "0 1px 2px rgba(10,14,20,0.04)",
                }}
              >
                {p.cover && (
                  <img
                    src={p.cover}
                    alt=""
                    style={{
                      width: "100%",
                      aspectRatio: "16 / 9",
                      objectFit: "cover",
                      borderBottom: `1px solid ${T.border}`,
                    }}
                  />
                )}
                <div style={{ padding: 24 }}>
                  <div
                    style={{
                      fontFamily: FF.mono,
                      fontSize: 11,
                      color: T.textMute,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: 10,
                    }}
                  >
                    {p.date} · {p.author}
                  </div>
                  <h2
                    style={{
                      fontFamily: FF.display,
                      fontSize: 24,
                      fontWeight: 600,
                      lineHeight: 1.18,
                      letterSpacing: "-0.015em",
                      margin: "0 0 10px",
                      color: T.text,
                    }}
                  >
                    {p.title}
                  </h2>
                  <p
                    style={{
                      fontSize: 14.5,
                      color: T.textDim,
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {p.summary}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      <LandingFooter />
    </div>
  )
}
