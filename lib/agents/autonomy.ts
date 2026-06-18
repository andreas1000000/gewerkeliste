export const autonomyLevels = ["read_only", "draft", "write_internal", "write_public", "external_action", "destructive"] as const;

export type AutonomyLevel = (typeof autonomyLevels)[number];

export const autonomyRank: Record<AutonomyLevel, number> = {
  read_only: 0,
  draft: 1,
  write_internal: 2,
  write_public: 3,
  external_action: 4,
  destructive: 5,
};

export function canOperateAt(current: AutonomyLevel, requested: AutonomyLevel) {
  return autonomyRank[current] >= autonomyRank[requested];
}

export function requiresHumanApproval(level: AutonomyLevel) {
  return level === "write_public" || level === "external_action" || level === "destructive";
}
