import { Text, View } from "@react-pdf/renderer";
import type { Resume } from "@/features/resume/schema";
import { styles } from "./styles";

function formatDateRange(start: string, end: string | null): string {
  return `${start} — ${end ?? "Present"}`;
}

export function Basics({ basics }: { basics: Resume["basics"] }) {
  const contactParts = [
    basics.email,
    basics.phone,
    basics.location,
    ...basics.links.map((l) => l.url),
  ].filter(Boolean);

  return (
    <View>
      <Text style={styles.name}>{basics.name}</Text>
      {basics.title && <Text style={styles.contactLine}>{basics.title}</Text>}
      {contactParts.length > 0 && (
        <Text style={styles.contactLine}>{contactParts.join("  ·  ")}</Text>
      )}
    </View>
  );
}

export function Summary({ summary }: { summary?: string }) {
  if (!summary) return null;
  return (
    <View>
      <Text style={styles.sectionHeading}>Summary</Text>
      <Text style={styles.summary}>{summary}</Text>
    </View>
  );
}

function Bullets({ bullets }: { bullets: { id: string; text: string }[] }) {
  return (
    <>
      {bullets.map((b) => (
        <View key={b.id} style={styles.bulletRow}>
          <Text style={styles.bulletMarker}>•</Text>
          <Text style={styles.bulletText}>{b.text}</Text>
        </View>
      ))}
    </>
  );
}

export function Experience({ experience }: { experience: Resume["experience"] }) {
  if (experience.length === 0) return null;
  return (
    <View>
      <Text style={styles.sectionHeading}>Experience</Text>
      {experience.map((exp) => (
        <View key={exp.id} style={styles.block}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryTitle}>
              {exp.role}, {exp.company}
            </Text>
            <Text style={styles.entryDates}>{formatDateRange(exp.start, exp.end)}</Text>
          </View>
          {exp.location && <Text style={styles.entrySubtitle}>{exp.location}</Text>}
          <Bullets bullets={exp.bullets} />
        </View>
      ))}
    </View>
  );
}

export function Projects({ projects }: { projects: Resume["projects"] }) {
  if (projects.length === 0) return null;
  return (
    <View>
      <Text style={styles.sectionHeading}>Projects</Text>
      {projects.map((proj) => (
        <View key={proj.id} style={styles.block}>
          <Text style={styles.entryTitle}>{proj.name}</Text>
          {(proj.tech.length > 0 || proj.url) && (
            <Text style={styles.entrySubtitle}>
              {[proj.tech.join(", "), proj.url].filter(Boolean).join("  ·  ")}
            </Text>
          )}
          <Bullets bullets={proj.bullets} />
        </View>
      ))}
    </View>
  );
}

export function Skills({ skills }: { skills: Resume["skills"] }) {
  const nonEmpty = skills.filter((s) => s.items.length > 0);
  if (nonEmpty.length === 0) return null;
  return (
    <View>
      <Text style={styles.sectionHeading}>Skills</Text>
      {nonEmpty.map((group) => (
        <Text key={group.category} style={styles.skillLine}>
          {group.category}: {group.items.join(", ")}
        </Text>
      ))}
    </View>
  );
}

export function Education({ education }: { education: Resume["education"] }) {
  if (education.length === 0) return null;
  return (
    <View>
      <Text style={styles.sectionHeading}>Education</Text>
      {education.map((edu) => (
        <View key={edu.id} style={styles.entryHeader}>
          <Text style={styles.entryTitle}>
            {edu.degree}, {edu.institution}
          </Text>
          {edu.year && <Text style={styles.entryDates}>{edu.year}</Text>}
        </View>
      ))}
    </View>
  );
}

export function Certifications({
  certifications,
}: {
  certifications: Resume["certifications"];
}) {
  if (certifications.length === 0) return null;
  return (
    <View>
      <Text style={styles.sectionHeading}>Certifications</Text>
      {certifications.map((cert) => (
        <View key={cert.id} style={styles.entryHeader}>
          <Text style={styles.entryTitle}>
            {cert.name}
            {cert.issuer ? `, ${cert.issuer}` : ""}
          </Text>
          {cert.year && <Text style={styles.entryDates}>{cert.year}</Text>}
        </View>
      ))}
    </View>
  );
}
