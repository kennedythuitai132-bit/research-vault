"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [actionFilter, setActionFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const url = new URL("http://localhost:4000/audit");
    if (actionFilter) url.searchParams.append("action", actionFilter);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.ok) setLogs(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    
    const headers = ["ID", "Action", "Time", "Actor ID", "Row Hash", "Prev Hash"];
    const rows = logs.map((l) => [
      l.id,
      l.action,
      new Date(l.createdAt).toISOString(),
      l.actorId,
      l.rowHash,
      l.prevHash || "GENESIS",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `audit-log-${Date.now()}.csv`);
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold">Security Audit Trail</h1>
          <p className="text-muted-foreground mt-1">Immutable cryptographic ledger of all institutional activity.</p>
        </div>
        <Button onClick={handleExportCSV} disabled={logs.length === 0}>
          Export to CSV
        </Button>
      </div>

      <div className="flex gap-4 p-4 border border-border rounded-lg bg-card">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Filter by Action</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
          >
            <option value="">All Actions</option>
            <option value="UPLOAD_RESOURCE">UPLOAD_RESOURCE</option>
            <option value="DELETE_RESOURCE">DELETE_RESOURCE</option>
            <option value="CHANGE_USER_ROLE">CHANGE_USER_ROLE</option>
          </select>
        </div>
      </div>

      <div className="border border-border rounded-lg bg-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No logs found for the selected filter.</div>
        ) : (
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
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-green-600 text-xs" title={log.rowHash}>
                    {log.rowHash.slice(0, 16)}...
                  </td>
                  <td className="px-4 py-3 font-mono text-blue-600 text-xs" title={log.prevHash || 'GENESIS'}>
                    {log.prevHash ? log.prevHash.slice(0, 16) + '...' : 'GENESIS'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}