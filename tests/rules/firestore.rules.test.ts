/**
 * Firestore security rules tests, run against the local emulator (§6.5, §12).
 *
 * Requires the Firebase emulator suite locally (Java + `firebase-tools`),
 * neither of which is available in this environment — this file is a
 * scaffold to run once that's set up:
 *
 *   firebase emulators:exec --only firestore "vitest run tests/rules"
 *
 * It is intentionally excluded from the default `npm run test` (vitest.config.ts
 * only picks up tests/unit) so CI doesn't fail without the emulator installed.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "fitcheck-rules-test",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

const sampleRun = {
  createdAt: Date.now(),
  jobTitle: "Senior Frontend Engineer",
  score: 80,
};

describe("firestore.rules", () => {
  it("lets a user read their own runs", async () => {
    const uidA = testEnv.authenticatedContext("uid-a").firestore();
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection("users/uid-a/runs").doc("run-1").set(sampleRun);
    });

    await assertSucceeds(uidA.collection("users/uid-a/runs").doc("run-1").get());
  });

  it("denies a user reading another user's runs", async () => {
    const uidB = testEnv.authenticatedContext("uid-b").firestore();
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection("users/uid-a/runs").doc("run-1").set(sampleRun);
    });

    await assertFails(uidB.collection("users/uid-a/runs").doc("run-1").get());
  });

  it("denies any client write, even to your own uid", async () => {
    const uidA = testEnv.authenticatedContext("uid-a").firestore();
    await assertFails(uidA.collection("users/uid-a/runs").doc("run-2").set(sampleRun));
    await assertFails(
      uidA.collection("users").doc("uid-a").set({ runCount: 999 })
    );
  });

  it("denies unauthenticated reads entirely", async () => {
    const anon = testEnv.unauthenticatedContext().firestore();
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection("users/uid-a/runs").doc("run-1").set(sampleRun);
    });

    await assertFails(anon.collection("users/uid-a/runs").doc("run-1").get());
  });
});
