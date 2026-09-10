import "server-only";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function getAdminApp(): App {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase admin credentials are not set");
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

let cachedAuth: Auth | null = null;
let cachedFirestore: Firestore | null = null;

/**
 * Lazy on purpose: initializing eagerly at module load would crash every
 * page (build and dev server) whenever Firebase env vars are unset, even
 * for routes that never touch auth. Credentials are only required once a
 * request actually calls this.
 */
export function getAdminAuth(): Auth {
  if (!cachedAuth) cachedAuth = getAuth(getAdminApp());
  return cachedAuth;
}

export function getAdminFirestore(): Firestore {
  if (!cachedFirestore) cachedFirestore = getFirestore(getAdminApp());
  return cachedFirestore;
}
