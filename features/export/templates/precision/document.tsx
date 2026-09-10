import { Document, Page } from "@react-pdf/renderer";
import type { Resume } from "@/features/resume/schema";
import { styles } from "./styles";
import {
  Basics,
  Summary,
  Experience,
  Projects,
  Skills,
  Education,
  Certifications,
} from "./sections";

/**
 * Precision template: single column, A4, no tables/columns/images/icons —
 * ATS-safe by construction. Zero conditional layout logic beyond
 * "hide empty sections" (each section component returns null when empty).
 */
export function PrecisionDocument({ resume }: { resume: Resume }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Basics basics={resume.basics} />
        <Summary summary={resume.summary} />
        <Experience experience={resume.experience} />
        <Projects projects={resume.projects} />
        <Skills skills={resume.skills} />
        <Education education={resume.education} />
        <Certifications certifications={resume.certifications} />
      </Page>
    </Document>
  );
}
