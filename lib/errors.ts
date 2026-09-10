export type AppErrorCode =
  | "FILE_TOO_LARGE"
  | "SCANNED_PDF"
  | "JD_TOO_SHORT"
  | "LLM_MALFORMED"
  | "RATE_LIMITED"
  | "UNAUTHENTICATED";

export class AppError extends Error {
  code: AppErrorCode;

  constructor(code: AppErrorCode, message?: string) {
    super(message ?? code);
    this.name = "AppError";
    this.code = code;
  }
}
