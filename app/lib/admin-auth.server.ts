import { redirect, createCookieSessionStorage } from "@remix-run/node";
import bcrypt from "bcryptjs";
import { prisma } from "./db.server";
import type { AdminUser, AdminRole } from "@prisma/client";

// Admin session storage
const sessionSecret = process.env.ADMIN_SECRET_KEY || "default-secret-key-change-in-production";

const { getSession, commitSession, destroySession } = createCookieSessionStorage({
  cookie: {
    name: "__admin_session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
});

export async function createAdminSession(adminId: string, redirectTo: string) {
  const session = await getSession();
  session.set("adminId", adminId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export async function getAdminSession(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  return session;
}

export async function getAdminId(request: Request): Promise<string | null> {
  const session = await getAdminSession(request);
  const adminId = session.get("adminId");
  return adminId || null;
}

export async function requireAdminId(request: Request): Promise<string> {
  const adminId = await getAdminId(request);
  if (!adminId) {
    throw redirect("/admin/login");
  }
  return adminId;
}

export async function requireAdmin(request: Request): Promise<AdminUser> {
  const adminId = await requireAdminId(request);
  
  const admin = await prisma.adminUser.findUnique({
    where: { id: adminId },
  });
  
  if (!admin || !admin.isActive) {
    throw await logout(request);
  }
  
  // Update last login
  await prisma.adminUser.update({
    where: { id: adminId },
    data: { lastLoginAt: new Date() },
  });
  
  return admin;
}

export async function requireSuperAdmin(request: Request): Promise<AdminUser> {
  const admin = await requireAdmin(request);
  
  if (admin.role !== "SUPER_ADMIN") {
    throw new Response("Forbidden - Super Admin access required", { status: 403 });
  }
  
  return admin;
}

export async function logout(request: Request) {
  const session = await getAdminSession(request);
  return redirect("/admin/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

export async function verifyLogin(email: string, password: string): Promise<AdminUser | null> {
  const admin = await prisma.adminUser.findUnique({
    where: { email },
  });
  
  if (!admin || !admin.isActive) {
    return null;
  }
  
  const isValid = await bcrypt.compare(password, admin.passwordHash);
  
  if (!isValid) {
    return null;
  }
  
  return admin;
}

export async function createAdminUser(
  email: string,
  password: string,
  name: string,
  role: AdminRole = "ADMIN"
): Promise<AdminUser> {
  const passwordHash = await bcrypt.hash(password, 10);
  
  return prisma.adminUser.create({
    data: {
      email,
      passwordHash,
      name,
      role,
    },
  });
}

export function hasPermission(admin: AdminUser, permission: string): boolean {
  const rolePermissions: Record<AdminRole, string[]> = {
    SUPER_ADMIN: ["*"], // All permissions
    ADMIN: [
      "sections:read",
      "sections:write",
      "bundles:read",
      "bundles:write",
      "analytics:read",
      "customers:read",
      "support:read",
      "support:write",
      "settings:read",
    ],
    CONTENT_MANAGER: [
      "sections:read",
      "sections:write",
      "bundles:read",
      "bundles:write",
      "content:read",
      "content:write",
    ],
    SUPPORT_AGENT: [
      "customers:read",
      "support:read",
      "support:write",
      "sections:read",
    ],
  };
  
  const permissions = rolePermissions[admin.role] || [];
  
  return permissions.includes("*") || permissions.includes(permission);
}

export async function logAdminActivity(
  adminId: string,
  action: string,
  resource: string,
  resourceId?: string,
  details?: any,
  request?: Request
) {
  const ipAddress = request?.headers.get("x-forwarded-for") || request?.headers.get("x-real-ip") || undefined;
  const userAgent = request?.headers.get("user-agent") || undefined;
  
  await prisma.adminActivity.create({
    data: {
      adminId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
    },
  });
}
