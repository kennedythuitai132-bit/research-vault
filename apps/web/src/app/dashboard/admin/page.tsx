"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  // Mock data for UI demonstration
  const [users, setUsers] = useState([
    { id: "1", name: "Boniface Matage", email: "bonifacematage31@gmail.com", role: "Institution Admin" },
    { id: "2", name: "Dr. Sarah Jenkins", email: "s.jenkins@test.edu", role: "Research Lead" },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-bold">Admin Panel</h1>
        <Button>Invite User</Button>
      </div>
      
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm">Manage</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}