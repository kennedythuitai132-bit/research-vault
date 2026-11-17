"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ShieldAlert, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${id}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        toast.success("User approved successfully");
        setUsers(users.map(u => u.id === id ? { ...u, isApproved: true } : u));
      }
    } catch (e) {
      toast.error("Failed to approve user");
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        toast.success("Role updated successfully");
        setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
      }
    } catch (e) {
      toast.error("Failed to update role");
    }
  };

  if (loading) return <div className="p-8 text-muted-foreground animate-pulse">Loading users...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold">Admin Panel</h1>
      
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-semibold">User</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {u.fullName?.charAt(0) || u.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{u.fullName || "No Name"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select 
                    value={u.role} 
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="bg-transparent border border-border rounded p-1 text-xs font-semibold focus:ring-1 focus:ring-primary"
                  >
                    <option value="RESEARCHER">RESEARCHER</option>
                    <option value="INSTITUTION_ADMIN">INSTITUTION_ADMIN</option>
                    <option value="AUDITOR">AUDITOR</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  {u.isApproved ? (
                    <span className="flex items-center gap-1.5 text-green-500 text-xs font-medium">
                      <CheckCircle className="h-4 w-4" /> Approved
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-yellow-500 text-xs font-medium">
                      <ShieldAlert className="h-4 w-4" /> Pending
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {!u.isApproved && (
                    <Button 
                      size="sm" 
                      onClick={() => handleApprove(u.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Approve
                    </Button>
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