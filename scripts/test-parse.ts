/**
 * Manual verification script for Phase 1.
 * Usage: npx tsx scripts/test-parse.ts <path-to-cv.pdf>
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseResume } from "../features/resume/parse";

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/test-parse.ts <path-to-cv.(pdf|docx)>");
    process.exit(1);
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeType =
    ext === ".docx"
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/pdf";

  const file = await readFile(filePath);
  const resume = await parseResume(file, mimeType);

  console.log(JSON.stringify(resume, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
