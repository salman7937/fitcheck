import { writeFile } from "node:fs/promises";
import { renderResumePdf, exportFilename } from "../features/export/render";
import type { Resume } from "../features/resume/schema";

const sampleResume: Resume = {
  basics: {
    name: "Jane Doe",
    title: "Senior Frontend Engineer",
    email: "jane@example.com",
    phone: "+1 555 0100",
    location: "Remote",
    links: [{ label: "GitHub", url: "https://github.com/janedoe" }],
  },
  summary: "Frontend engineer focused on performant, accessible interfaces.",
  experience: [
    {
      id: "exp-1",
      company: "Acme Corp",
      role: "Senior Frontend Engineer",
      location: "Remote",
      start: "2022-01",
      end: null,
      bullets: [
        { id: "b1", text: "Led migration of the dashboard to TypeScript, cutting build errors by 40%." },
        { id: "b2", text: "Built the design system used across 6 React apps." },
        { id: "b3", text: "Mentored two junior engineers on component architecture." },
      ],
    },
  ],
  projects: [],
  skills: [
    { category: "Languages", items: ["TypeScript", "JavaScript"] },
    { category: "Frameworks", items: ["React", "Next.js"] },
  ],
  education: [
    { id: "edu-1", institution: "State University", degree: "B.S. Computer Science", year: "2018" },
  ],
  certifications: [],
};

async function main() {
  const buffer = await renderResumePdf(sampleResume);
  const filename = exportFilename(sampleResume, "Senior Frontend Engineer");
  await writeFile(`./${filename}`, buffer);
  console.log(`Wrote ${filename}, ${buffer.length} bytes`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
