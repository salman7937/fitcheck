import { renderToBuffer } from "@react-pdf/renderer";
import type { Resume } from "@/features/resume/schema";
import { PrecisionDocument } from "./templates/precision/document";

export async function renderResumePdf(resume: Resume): Promise<Buffer> {
  return renderToBuffer(PrecisionDocument({ resume }));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Filename: {lastname}-{jd-title-slug}.pdf */
export function exportFilename(resume: Resume, jdTitle: string): string {
  const nameParts = resume.basics.name.trim().split(/\s+/);
  const lastname = nameParts[nameParts.length - 1] || "resume";
  return `${slugify(lastname)}-${slugify(jdTitle)}.pdf`;
}
