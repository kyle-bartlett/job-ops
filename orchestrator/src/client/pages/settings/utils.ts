/**
 * Settings page helpers.
 */

import type { ResumeProjectsSettings } from "@shared/types"

export function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

export function resumeProjectsEqual(a: ResumeProjectsSettings, b: ResumeProjectsSettings) {
  return (
    a.maxProjects === b.maxProjects &&
    arraysEqual(a.lockedProjectIds, b.lockedProjectIds) &&
    arraysEqual(a.aiSelectableProjectIds, b.aiSelectableProjectIds)
  )
}

export function clampInt(value: number, min: number, max: number) {
  const int = Math.floor(value)
  if (Number.isNaN(int)) return min
  return Math.min(max, Math.max(min, int))
}
