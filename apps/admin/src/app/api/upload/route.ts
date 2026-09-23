// POST /api/upload — image upload for the blog editor.
//
// Accepts multipart/form-data with a `file` field. Writes the bytes to
// apps/landing/public/uploads/ with a timestamped, sanitised filename and
// returns the public `/uploads/<file>` URL. Phase 4: swap for MinIO presigned
// uploads so the landing process doesn't need a writeable filesystem.

import { NextResponse } from "next/server"

import { saveUpload } from "@/lib/posts-fs"

const MAX_BYTES = 8 * 1024 * 1024 // 8 MB — bigger than any realistic blog image.
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"])

export async function POST(req: Request): Promise<NextResponse> {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: "invalid form data" }, { status: 400 })
  }
  const file = form.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing file" }, { status: 400 })
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: `unsupported type: ${file.type}` }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `file too large (${file.size} bytes)` }, { status: 400 })
  }
  const buf = Buffer.from(await file.arrayBuffer())
  const url = await saveUpload(file.name, buf)
  return NextResponse.json({ url })
}
