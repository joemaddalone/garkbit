import type { KVStore } from "norkostrat";
import type { PipelineRecord } from "../types.js";

/**
 * Retrieve a PipelineRecord from the store, or throw if not found.
 */
export function getRecord(store: KVStore, jobId: string): PipelineRecord {
  const record = store.get<PipelineRecord>(jobId);
  if (!record) {
    throw new Error(`Pipeline record not found: ${jobId}`);
  }
  return record;
}

/**
 * Update a PipelineRecord in the store by merging a patch.
 */
export function updateRecord(
  store: KVStore,
  jobId: string,
  patch: Partial<PipelineRecord>,
): void {
  store.update(jobId, patch as unknown as Record<string, unknown>);
}

/**
 * Set a full PipelineRecord in the store (replaces existing).
 */
export function setRecord(
  store: KVStore,
  jobId: string,
  record: PipelineRecord,
): void {
  store.set(jobId, record as unknown as Record<string, unknown>);
}

/**
 * Check whether a step has already been completed for this job.
 */
export function hasCompletedStep(store: KVStore, jobId: string, step: string): boolean {
  const record = getRecord(store, jobId);
  return record.completedSteps.includes(step);
}

/**
 * Mark a step as completed for this job.
 */
export function markCompleted(store: KVStore, jobId: string, step: string): void {
  const record = getRecord(store, jobId);
  if (!record.completedSteps.includes(step)) {
    record.completedSteps.push(step);
    store.update(jobId, { completedSteps: record.completedSteps });
  }
}
