"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const res = await fetch("http://localhost:4000/audit", { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (res.ok) setLogs(await res.json());
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold">Security Audit Trail</h1>
      <p className="text-muted-foreground">Immutable cryptographic ledger of all institutional activity.</p>
      
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3 font-mono">Row Hash</th>
              <th className="px-4 py-3 font-mono">Prev Hash</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border">
                <td className="px-4 py-3 text-primary font-medium">{log.action}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-green-600 text-xs">{log.rowHash.slice(0, 16)}...</td>
                <td className="px-4 py-3 font-mono text-blue-600 text-xs">{log.prevHash ? log.prevHash.slice(0, 16) + '...' : 'GENESIS'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}