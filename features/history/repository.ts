import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { Resume } from "@/features/resume/schema";
import type { JobDescription } from "@/features/job-description/schema";
import type { Analysis } from "@/features/analysis/schema";
import type { Change } from "@/features/improve/schema";
import { type Run, MAX_FINDINGS_PERSISTED } from "./schema";

/**
 * All writes go through the Admin SDK, server-only — the client never
 * writes to Firestore directly (§6.5). This is what keeps score integrity
 * server-side.
 */
export async function saveRun(params: {
  uid: string;
  isAnonymous: boolean;
  resume: Resume;
  jd: JobDescription;
  analysis: Analysis;
  changes: Change[];
}): Promise<string> {
  const { uid, isAnonymous, resume, jd, analysis, changes } = params;
  const db = getAdminFirestore();

  const userRef = db.collection("users").doc(uid);
  const runRef = userRef.collection("runs").doc();

  // A run document stays comfortably under Firestore's 1MB limit for any
  // realistic CV; truncate the one field that can grow unbounded rather
  // than ever splitting a run across documents (§6.4).
  const truncatedAnalysis: Analysis = {
    ...analysis,
    findings: analysis.findings.slice(0, MAX_FINDINGS_PERSISTED),
  };

  const run: Omit<Run, "id"> = {
    createdAt: Date.now(),
    jobTitle: jd.title,
    company: jd.company ?? null,
    score: analysis.score,
    subscores: analysis.subscores,
    resume,
    analysis: truncatedAnalysis,
    changes,
  };

  await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);

    if (!userSnap.exists) {
      tx.set(userRef, {
        createdAt: FieldValue.serverTimestamp(),
        lastSeenAt: FieldValue.serverTimestamp(),
        isAnonymous,
        runCount: 1,
      });
    } else {
      tx.update(userRef, {
        lastSeenAt: FieldValue.serverTimestamp(),
        isAnonymous,
        runCount: FieldValue.increment(1),
      });
    }

    tx.set(runRef, run);
  });

  return runRef.id;
}

/**
 * Handles `auth/credential-already-in-use` (§6.1): the Google account the
 * user just signed into already existed as a separate uid from the
 * anonymous one they were using. Copies the anonymous user's runs onto the
 * real account rather than losing them, then leaves the anonymous
 * account's own data for the 30-day retention cleanup.
 */
export async function migrateRuns(fromUid: string, toUid: string): Promise<number> {
  if (fromUid === toUid) return 0;

  const db = getAdminFirestore();
  const fromRunsSnap = await db.collection("users").doc(fromUid).collection("runs").get();
  if (fromRunsSnap.empty) return 0;

  const toRunsRef = db.collection("users").doc(toUid).collection("runs");
  const batch = db.batch();
  for (const doc of fromRunsSnap.docs) {
    batch.set(toRunsRef.doc(doc.id), doc.data());
  }
  batch.set(
    db.collection("users").doc(toUid),
    { runCount: FieldValue.increment(fromRunsSnap.size), lastSeenAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
  await batch.commit();

  return fromRunsSnap.size;
}

export async function listRuns(uid: string): Promise<Run[]> {
  const db = getAdminFirestore();
  try {
    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("runs")
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Run);
  } catch (err) {
    console.error("Firestore listRuns error:", err);
    return [];
  }
}

/** Deletes the user document and every run beneath it (§6.7, §11.9b). Auth record deletion happens separately. */
export async function deleteAllUserData(uid: string): Promise<void> {
  const db = getAdminFirestore();
  const userRef = db.collection("users").doc(uid);

  const runsSnap = await userRef.collection("runs").get();
  const batch = db.batch();
  for (const doc of runsSnap.docs) batch.delete(doc.ref);
  batch.delete(userRef);
  await batch.commit();
}
