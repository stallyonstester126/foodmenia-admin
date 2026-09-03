"use client";

import AdminShell from "@/components/AdminShell";

export default function AdminUsersPage() {
  return (
    <AdminShell>
      <div className="flex flex-col gap-6 animate-in fade-in duration-200">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">User Accounts &amp; Roles</h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage customer profiles, platform roles, and account permissions.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center flex flex-col items-center gap-3 shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-2xl text-amber-600">
            👥
          </div>
          <h3 className="font-bold text-lg text-[#1A1A1A]">Users Management Module</h3>
          <p className="text-xs text-gray-500 max-w-sm">
            Detailed user account management &amp; role assignment controls will be available here in the next platform release.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}
