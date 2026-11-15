"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Folder } from "lucide-react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const h = { Authorization: `Bearer ${session.access_token}` };
    
    const [pRes, dRes] = await Promise.all([
      fetch("http://localhost:4000/projects", { headers: h }),
      fetch("http://localhost:4000/departments", { headers: h })
    ]);
    
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
    
    await fetch("http://localhost:4000/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ name: newProjectName, departmentId: selectedDept })
    });
    setNewProjectName("");
    fetchData();
  };

  if (loading) return <div>Loading projects...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <h1 className="text-3xl font-display font-bold">Projects</h1>
      </div>

      <form onSubmit={handleCreate} className="flex gap-4 p-4 border border-border rounded-lg bg-card">
        <input 
          placeholder="New project name" 
          value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)}
          className="flex-1 px-3 py-2 border border-border rounded-md bg-background" 
        />
        <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="w-48 px-3 py-2 border border-border rounded-md bg-background">
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <Button type="submit">Create</Button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => (
          <Link key={p.id} href={`/dashboard/projects/${p.id}`}>
            <div className="p-6 border border-border rounded-lg bg-card hover:border-primary transition-colors cursor-pointer h-full">
              <Folder className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold text-lg">{p.name}</h3>
              <p className="text-xs text-muted-foreground mt-2">Status: {p.status}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}