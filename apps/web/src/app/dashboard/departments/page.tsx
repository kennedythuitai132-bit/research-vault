"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [name, setName] = useState("");

  const fetchDeps = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch("http://localhost:4000/departments", { headers: { Authorization: `Bearer ${session.access_token}` } });
    if (res.ok) setDepartments(await res.json());
  };

  useEffect(() => { fetchDeps(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch("http://localhost:4000/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ name })
    });
    setName("");
    fetchDeps();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-display font-bold">Departments</h1>
      <form onSubmit={handleCreate} className="flex gap-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New department" className="flex-1 px-3 py-2 border border-border rounded-md bg-background" />
        <Button type="submit">Add</Button>
      </form>
      <div className="space-y-2">
        {departments.map(d => (
          <div key={d.id} className="p-4 border border-border rounded-lg bg-card font-medium">{d.name}</div>
        ))}
      </div>
    </div>
  );
}