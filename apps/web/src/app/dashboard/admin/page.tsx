"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";

const ROLES = ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'RESEARCHER', 'AUDITOR'];

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, { headers: { Authorization: `Bearer ${session.access_token}` } });
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/role`, {
      method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) { setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u)); toast.success("Role updated"); }
  };

  const handleApprove = async (userId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/approve`, {
      method: "PATCH", headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) { setUsers(prev => prev.map(u => u.id === userId ? { ...u, isApproved: true } : u)); toast.success("User approved"); }
  };

  if (loading) return <div className="p-8 text-muted-foreground animate-pulse">Loading users...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold">Admin Panel</h1>
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{getInitials(u.fullName)}</div>
                    <div><p className="font-medium text-foreground">{u.fullName}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)} className="px-2 py-1 border border-border rounded-md bg-background text-xs">
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  {u.isApproved ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-500"><CheckCircle2 className="h-3 w-3" /> Approved</span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-500"><XCircle className="h-3 w-3" /> Pending</span>
                      <Button size="sm" onClick={() => handleApprove(u.id)}>Approve</Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}