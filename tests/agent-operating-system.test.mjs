import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { agentRegistry, getAgentDefinition } from "../lib/agents/agent-registry.ts";
import { canOperateAt, requiresHumanApproval } from "../lib/agents/autonomy.ts";
import { isRiskyTool } from "../lib/agents/permissions.ts";
import { blockedByDefaultTools } from "../lib/agents/tools.ts";

const persistenceSource = readFileSync(new URL("../lib/agents/persistence.ts", import.meta.url), "utf8");

test("registry keeps every agent uniquely identified and blocks default-risk tools", () => {
  const agentIds = agentRegistry.map((agent) => agent.agent_id);

  assert.equal(new Set(agentIds).size, agentIds.length);
  assert.equal(getAgentDefinition("regional-coverage-agent")?.autonomy_level, "write_internal");
  assert.equal(getAgentDefinition("matching-agent")?.enabled, false);

  for (const agent of agentRegistry) {
    assert.deepEqual(
      agent.allowed_tools.filter((tool) => blockedByDefaultTools.includes(tool)),
      [],
      `${agent.agent_id} darf keine standardmäßig blockierten Tools erhalten`,
    );
    assert.equal(
      agent.allowed_tools.some(isRiskyTool),
      false,
      `${agent.agent_id} darf keine riskanten Tool-Klassen ohne separates Freigabemodell erhalten`,
    );
  }
});

test("autonomy contract keeps public and destructive actions behind human approval", () => {
  assert.equal(canOperateAt("write_internal", "write_public"), false);
  assert.equal(canOperateAt("external_action", "write_public"), true);
  assert.equal(requiresHumanApproval("write_internal"), false);
  assert.equal(requiresHumanApproval("write_public"), true);
  assert.equal(requiresHumanApproval("external_action"), true);
  assert.equal(requiresHumanApproval("destructive"), true);
});

test("persistence keeps the migration fallback and dry-run audit boundaries", () => {
  assert.match(persistenceSource, /export function agentOsTablesAvailableError\(error: unknown\)/);
  assert.match(persistenceSource, /message\.includes\("schema cache"\)/);
  assert.match(persistenceSource, /public_data_changed: publicWrittenTables\.length \? "unknown" : detail\.run\.dry_run \? "nein"/);
  assert.match(persistenceSource, /risky_actions_blocked: hasRiskQueueItems \? "ja, als Review\/Approval\/Outbox festgehalten"/);
});
