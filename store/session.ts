import { create } from "zustand";
import type { Resume } from "@/features/resume/schema";
import type { JobDescription } from "@/features/job-description/schema";
import type { Analysis } from "@/features/analysis/schema";
import type { Change } from "@/features/improve/schema";

type SessionState = {
  resume: Resume | null;
  jdText: string;
  jobDescription: JobDescription | null;
  analysis: Analysis | null;
  changes: Change[] | null;

  setResume: (resume: Resume | null) => void;
  setJdText: (jdText: string) => void;
  setAnalysisResult: (jobDescription: JobDescription, analysis: Analysis) => void;
  setChanges: (changes: Change[]) => void;
  toggleChange: (id: string) => void;
  reset: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  resume: null,
  jdText: "",
  jobDescription: null,
  analysis: null,
  changes: null,

  setResume: (resume) => set({ resume }),
  setJdText: (jdText) => set({ jdText }),
  setAnalysisResult: (jobDescription, analysis) => set({ jobDescription, analysis }),
  setChanges: (changes) => set({ changes }),
  toggleChange: (id) =>
    set((state) => ({
      changes:
        state.changes?.map((c) => (c.id === id ? { ...c, accepted: !c.accepted } : c)) ?? null,
    })),
  reset: () =>
    set({ resume: null, jdText: "", jobDescription: null, analysis: null, changes: null }),
}));
