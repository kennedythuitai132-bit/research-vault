"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Trash2, RotateCcw, FileText } from "lucide-react";
import { toast } from "sonner";

export default function TrashPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrash = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch("${process.env.NEXT_PUBLIC_API_URL}/resources/trash", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) setResources(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchTrash(); }, []);

  const handleRestore = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resources/${id}/restore`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      toast.success("File restored");
      fetchTrash();
    } else {
      toast.error("Failed to restore file");
    }
  };

  if (loading) return <div className="p-8 text-muted-foreground animate-pulse">Loading trash...</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold">Trash</h1>
          <p className="text-muted-foreground mt-1">Deleted files are preserved for audit purposes.</p>
        </div>
      </div>

      {resources.length === 0 ? (
        <div className="text-center py-20 border border-border rounded-lg border-dashed bg-card">
          <Trash2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">Trash is empty</h3>
        </div>
      ) : (
        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Deleted At</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((r) => (
                <tr key={r.id} className="border-b border-border">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{(Number(r.sizeBytes) / 1024).toFixed(1)} KB</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(r.deletedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="sm" onClick={() => handleRestore(r.id)}>
                      <RotateCcw className="h-3 w-3 mr-1" /> Restore
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}