import type { Resume } from "@/features/resume/schema";
import type { JobDescription } from "@/features/job-description/schema";

export const fixtureResume: Resume = {
  basics: {
    name: "Jane Doe",
    title: "Senior Frontend Engineer",
    email: "jane@example.com",
    phone: "+1 555 0100",
    location: "Remote",
    links: [],
  },
  summary: "Frontend engineer focused on performant, accessible interfaces.",
  experience: [
    {
      id: "exp-1",
      company: "Acme Corp",
      role: "Senior Frontend Engineer",
      start: "2022-01",
      end: null,
      bullets: [
        { id: "b1", text: "Led migration of the dashboard to TypeScript." },
        { id: "b2", text: "Built the design system used across React apps." },
        { id: "b3", text: "Mentored two junior engineers on component architecture." },
      ],
    },
    {
      id: "exp-2",
      company: "Widgets Inc",
      role: "Frontend Engineer",
      start: "2019-01",
      end: "2022-01",
      bullets: [
        { id: "b4", text: "Shipped the customer-facing React app from scratch." },
        { id: "b5", text: "Reduced bundle size by 30% through code splitting." },
      ],
    },
  ],
  projects: [],
  skills: [
    { category: "Languages", items: ["TypeScript", "JavaScript"] },
    { category: "Frameworks", items: ["React", "Next.js"] },
  ],
  education: [],
  certifications: [],
};

export const fixtureJobDescription: JobDescription = {
  title: "Senior Frontend Engineer",
  company: "Test Co",
  seniority: "senior",
  yearsRequired: 5,
  hardSkills: [
    { term: "TypeScript", aliases: [], required: true },
    { term: "React", aliases: [], required: true },
    { term: "GraphQL", aliases: [], required: true },
    { term: "Docker", aliases: ["Containerization"], required: false },
  ],
  softSkills: ["communication"],
  responsibilities: ["Build and maintain frontend applications"],
};

/** Fixed "now" so experience-match tests are reproducible regardless of run date. */
export const fixtureReferenceDate = new Date(2026, 0, 1);
