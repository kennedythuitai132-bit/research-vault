"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Database, Search, FileText, Lock, ShieldAlert, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CataloguePage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [classification, setClassification] = useState("PUBLIC");

  const loadPageData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const h = { Authorization: `Bearer ${session.access_token}` };
    const [catRes, meRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/enterprise/catalogue?search=${search}`, { headers: h }),
      fetch("${process.env.NEXT_PUBLIC_API_URL}/users/me", { headers: h })
    ]);
    if (meRes.ok) setRole((await meRes.json()).role);
    if (catRes.ok) setDatasets(await catRes.json());
  };

  useEffect(() => { const t = setTimeout(() => loadPageData(), 300); return () => clearTimeout(t); }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch("${process.env.NEXT_PUBLIC_API_URL}/enterprise/catalogue", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ name, description, classification }),
    });
    if (res.ok) { toast.success("Dataset created"); setIsCreating(false); setName(""); setDescription(""); loadPageData(); }
    else { toast.error("Failed to create dataset"); }
  };

  const isAdmin = role === 'INSTITUTION_ADMIN' || role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold">Research Data Catalogue</h1>
          <p className="text-muted-foreground mt-1">Discover and request access to institutional datasets.</p>
        </div>
        {isAdmin && <Button onClick={() => setIsCreating(!isCreating)}><Plus className="mr-2 h-4 w-4" /> Add Dataset</Button>}
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="p-4 border border-border rounded-lg bg-card space-y-4 max-w-xl">
          <div><label className="text-sm font-medium">Dataset Name</label><input required value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-sm" /></div>
          <div><label className="text-sm font-medium">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-sm resize-none" rows={2} /></div>
          <div><label className="text-sm font-medium">Classification</label><select value={classification} onChange={e => setClassification(e.target.value)} className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-sm"><option value="PUBLIC">Public</option><option value="RESTRICTED">Restricted</option></select></div>
          <div className="flex gap-2"><Button type="submit">Save Dataset</Button><Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button></div>
        </form>
      )}

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <input type="text" placeholder="Search datasets..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
      </div>

      {datasets.length === 0 ? (
        <div className="text-center py-20 border border-border rounded-lg border-dashed bg-card"><Database className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" /><h3 className="text-lg font-semibold">No datasets found</h3></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {datasets.map((d) => (
            <div key={d.id} className="p-6 border border-border rounded-lg bg-card flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <Database className="h-8 w-8 text-primary" />
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 rounded ${d.classification === 'RESTRICTED' ? 'text-red-500 bg-red-500/10' : 'text-green-500 bg-green-500/10'}`}>{d.classification === 'RESTRICTED' ? <ShieldAlert className="h-3 w-3" /> : null} {d.classification}</span>
                </div>
                <h3 className="font-semibold text-lg">{d.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{d.description || "No description"}</p>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Dataset</span><span className="flex items-center gap-1"><Lock className="h-3 w-3" /> {d.classification}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}