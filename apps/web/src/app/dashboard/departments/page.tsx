"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Building, Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const fetchDeps = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const h = { Authorization: `Bearer ${session.access_token}` };
    
    const [res, meRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments`, { headers: h }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, { headers: h })
    ]);
    
    if (meRes.ok) { const me = await meRes.json(); setRole(me.role); }
    if (res.ok) setDepartments(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchDeps(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ name })
    });

    if (res.ok) { toast.success("Department added"); setName(""); fetchDeps(); }
    else { toast.error("Failed to add department"); }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return toast.error("Name cannot be empty");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ name: editName })
    });

    if (res.ok) { toast.success("Department updated"); setEditingId(null); fetchDeps(); }
    else { toast.error("Failed to update"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? Projects inside this department will also be deleted.")) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` }
    });

    if (res.ok) { toast.success("Department deleted"); fetchDeps(); }
    else { toast.error("Failed to delete."); }
  };

  if (loading) return <div className="p-8 text-muted-foreground animate-pulse">Loading departments...</div>;

  const isAdmin = role === "INSTITUTION_ADMIN" || role === "SUPER_ADMIN";

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-display font-bold">Departments</h1>
      
      {isAdmin && (
        <form onSubmit={handleCreate} className="flex gap-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New department" className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-sm" />
          <Button type="submit">Add Department</Button>
        </form>
      )}

      {departments.length === 0 ? (
        <div className="text-center py-16 border border-border rounded-lg border-dashed bg-card">
          <Building className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No departments yet</h3>
        </div>
      ) : (
        <div className="space-y-2">
          {departments.map(d => (
            <div key={d.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card transition-colors">
              {editingId === d.id ? (
                <div className="flex-1 flex gap-2 items-center mr-4">
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 px-3 py-1 border border-border rounded-md bg-background text-sm" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(d.id); if (e.key === 'Escape') setEditingId(null); }} />
                  <Button type="button" size="sm" onClick={() => handleSaveEdit(d.id)}><Check className="h-4 w-4" /></Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                </div>
              ) : (
                <span className="font-medium">{d.name}</span>
              )}

              {isAdmin && editingId !== d.id && (
                <div className="flex gap-2">
                  <button onClick={() => { setEditingId(d.id); setEditName(d.name); }} className="p-2 text-muted-foreground hover:text-primary rounded-md hover:bg-primary/10 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(d.id)} className="p-2 text-muted-foreground hover:text-red-500 rounded-md hover:bg-red-500/10 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}