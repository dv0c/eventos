export type Permission =
  | "org:read"
  | "org:update"
  | "org:delete"
  | "org:manage_members"
  | "org:manage_billing"
  | "org:manage_settings"
  | "event:read"
  | "event:create"
  | "event:update"
  | "event:delete"
  | "event:publish"
  | "guest:read"
  | "guest:create"
  | "guest:update"
  | "guest:delete"
  | "guest:import"
  | "guest:export"
  | "task:read"
  | "task:update"
  | "message:read"
  | "message:send"
  | "media:read"
  | "media:manage"
  | "collaborator:manage"
  | "audit:read";

export const ALL_PERMISSIONS: readonly Permission[] = [
  "org:read",
  "org:update",
  "org:delete",
  "org:manage_members",
  "org:manage_billing",
  "org:manage_settings",
  "event:read",
  "event:create",
  "event:update",
  "event:delete",
  "event:publish",
  "guest:read",
  "guest:create",
  "guest:update",
  "guest:delete",
  "guest:import",
  "guest:export",
  "task:read",
  "task:update",
  "message:read",
  "message:send",
  "media:read",
  "media:manage",
  "collaborator:manage",
  "audit:read",
] as const;
