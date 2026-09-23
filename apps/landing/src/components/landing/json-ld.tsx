// Tiny JSON-LD helper — emits a <script type="application/ld+json"> tag.
// Keep schema objects narrow and well-typed at the call site; this just
// stringifies and ships.

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // The string is server-rendered from a known shape, never user input —
      // safe to dangerouslySetInnerHTML (no escaping issues).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
