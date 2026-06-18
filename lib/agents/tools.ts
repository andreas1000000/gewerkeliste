export const agentToolClasses = [
  "database_read",
  "database_write_internal",
  "database_write_public",
  "web_search",
  "website_fetch",
  "classifier",
  "outbox",
  "email_send",
  "payment",
  "delete",
] as const;

export type AgentToolClass = (typeof agentToolClasses)[number];

export const blockedByDefaultTools: AgentToolClass[] = ["database_write_public", "email_send", "payment", "delete"];
