"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Folder, Trash2, Search, FileText } from "lucide-react";
import { toast } from "sonner";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const h = { Authorization: `Bearer ${session.access_token}` };
    
    const [pRes, dRes, meRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, { headers: h }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments`, { headers: h }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, { headers: h })
    ]);

    if (meRes.ok) { const me = await meRes.json(); setRole(me.role); }
    if (pRes.ok) setProjects(await pRes.json());
    if (dRes.ok) {
      const deps = await dRes.json();
      setDepartments(deps);
      if (deps.length > 0) setSelectedDept(deps[0].id);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName || !selectedDept) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ name: newProjectName, departmentId: selectedDept })
    });
    if (res.ok) { toast.success("Project created"); setNewProjectName(""); fetchData(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.access_token}` } });
    if (res.ok) { toast.success("Project deleted"); fetchData(); }
  };

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  if (loading) return <div className="p-8 animate-pulse text-muted-foreground">Loading projects...</div>;

  const isAdmin = role === "INSTITUTION_ADMIN" || role === "SUPER_ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <h1 className="text-3xl font-display font-bold">Projects</h1>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-border rounded-md bg-background text-sm" />
        </div>
      </div>

      {isAdmin && (
        <form onSubmit={handleCreate} className="flex gap-4 p-4 border border-border rounded-lg bg-card">
          <input placeholder="New project name" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-sm" />
          <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="w-48 px-3 py-2 border border-border rounded-md bg-background text-sm">
            {departments.length === 0 && <option value="">Create a department first</option>}
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <Button type="submit" disabled={departments.length === 0}>Create</Button>
        </form>
      )}

      {filteredProjects.length === 0 ? (
        <div className="text-center py-20 border border-border rounded-lg border-dashed bg-card">
          <Folder className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No projects found</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => (
            <div key={p.id} className="relative group p-6 border border-border rounded-lg bg-card hover:border-primary/50 transition-all">
              <Link href={`/dashboard/projects/${p.id}`} className="block">
                <Folder className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-lg">{p.name}</h3>
                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {p._count?.resources || 0} files</span>
                </div>
              </Link>
              {isAdmin && (
                <button onClick={(e) => { e.preventDefault(); handleDelete(p.id); }} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-red-500 rounded-md hover:bg-red-500/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}