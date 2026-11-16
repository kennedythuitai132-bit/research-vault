"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DollarSign, Calendar, Building, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function GrantsPage() {
  const [grants, setGrants] = useState<any[]>([]);
  const [role, setRole] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [funder, setFunder] = useState("");
  const [amount, setAmount] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadPageData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const h = { Authorization: `Bearer ${session.access_token}` };
    const [grantRes, meRes] = await Promise.all([
      fetch("${process.env.NEXT_PUBLIC_API_URL}/enterprise/grants", { headers: h }),
      fetch("${process.env.NEXT_PUBLIC_API_URL}/users/me", { headers: h })
    ]);
    if (meRes.ok) setRole((await meRes.json()).role);
    if (grantRes.ok) setGrants(await grantRes.json());
  };

  useEffect(() => { loadPageData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch("${process.env.NEXT_PUBLIC_API_URL}/enterprise/grants", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ name, funder, amount: Number(amount), endDate: new Date(endDate) }),
    });
    if (res.ok) { toast.success("Grant created"); setIsCreating(false); setName(""); setFunder(""); setAmount(""); setEndDate(""); loadPageData(); }
    else { toast.error("Failed to create grant"); }
  };

  const isAdmin = role === 'INSTITUTION_ADMIN' || role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold">Research Grants & Funding</h1>
          <p className="text-muted-foreground mt-1">Track institutional funding, budgets, and deadlines.</p>
        </div>
        {isAdmin && <Button onClick={() => setIsCreating(!isCreating)}><Plus className="mr-2 h-4 w-4" /> Add Grant</Button>}
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="p-4 border border-border rounded-lg bg-card grid grid-cols-2 gap-4 max-w-2xl">
          <div className="col-span-2"><label className="text-sm font-medium">Grant Name</label><input required value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-sm" /></div>
          <div><label className="text-sm font-medium">Funder</label><input required value={funder} onChange={e => setFunder(e.target.value)} className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-sm" /></div>
          <div><label className="text-sm font-medium">Amount (USD)</label><input type="number" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-sm" /></div>
          <div className="col-span-2"><label className="text-sm font-medium">End Date</label><input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-sm" /></div>
          <div className="col-span-2 flex gap-2"><Button type="submit">Save Grant</Button><Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button></div>
        </form>
      )}

      {grants.length === 0 ? (
        <div className="text-center py-20 border border-border rounded-lg border-dashed bg-card"><DollarSign className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" /><h3 className="text-lg font-semibold">No active grants</h3></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {grants.map((g) => (
            <div key={g.id} className="p-6 border border-border rounded-lg bg-card">
              <div className="flex justify-between items-start mb-4"><DollarSign className="h-8 w-8 text-green-500" /><span className="text-2xl font-bold text-green-500">{g.currency} {g.amount.toLocaleString()}</span></div>
              <h3 className="font-semibold text-lg">{g.name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><Building className="h-3 w-3" /> {g.funder}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><Calendar className="h-3 w-3" /> Ends: {new Date(g.endDate).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}