import type { OrgRole } from "@prisma/client";

import { ALL_PERMISSIONS, type Permission } from "./types";

const OWNER_PERMISSIONS: Permission[] = [...ALL_PERMISSIONS];

const ADMIN_PERMISSIONS: Permission[] = ALL_PERMISSIONS.filter(
  (permission) => permission !== "org:delete",
);

const MANAGER_PERMISSIONS: Permission[] = [
  "org:read",
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
];

const EDITOR_PERMISSIONS: Permission[] = [
  "org:read",
  "event:read",
  "event:create",
  "event:update",
  "guest:read",
  "guest:create",
  "guest:update",
  "guest:import",
  "task:read",
  "task:update",
  "message:read",
  "media:read",
  "media:manage",
];

const VIEWER_PERMISSIONS: Permission[] = [
  "org:read",
  "event:read",
  "guest:read",
  "task:read",
  "message:read",
  "media:read",
];

const ROLE_PERMISSIONS: Record<OrgRole, readonly Permission[]> = {
  OWNER: OWNER_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  MANAGER: MANAGER_PERMISSIONS,
  EDITOR: EDITOR_PERMISSIONS,
  VIEWER: VIEWER_PERMISSIONS,
};

export function getPermissions(role: OrgRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function can(role: OrgRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
