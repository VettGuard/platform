import { NextResponse } from "next/server"

import { deletePost } from "@/lib/posts-fs"

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await ctx.params
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "invalid slug" }, { status: 400 })
  }
  await deletePost(slug)
  return NextResponse.json({ ok: true })
}
