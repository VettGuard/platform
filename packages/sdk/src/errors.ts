export class VettGuardError extends Error {
  readonly code: string
  readonly status: number
  readonly requestId: string | undefined

  constructor(opts: { code: string; status: number; message: string; requestId?: string }) {
    super(opts.message)
    this.name = "VettGuardError"
    this.code = opts.code
    this.status = opts.status
    this.requestId = opts.requestId
  }
}

export function isVettGuardError(value: unknown): value is VettGuardError {
  return value instanceof VettGuardError
}
