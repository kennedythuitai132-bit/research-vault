"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { ShieldAlert, Play, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AnonymisePage() {
  const [datasetId, setDatasetId] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAnonymise = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/enterprise/anonymise`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ datasetId }),
    });

    if (res.ok) { setSuccess(true); toast.success("Anonymisation job started"); }
    else { toast.error("Failed to start job"); }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-display font-bold">Data Anonymisation</h1>
        <p className="text-muted-foreground mt-1">Generate privacy-protected copies of research datasets.</p>
      </div>

      <div className="p-6 border border-border rounded-lg bg-card">
        <form onSubmit={handleAnonymise} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Dataset ID or Name</label>
            <input required value={datasetId} onChange={(e) => setDatasetId(e.target.value)} className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-sm" placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000" />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Processing..." : <><ShieldAlert className="mr-2 h-4 w-4" /> Start Anonymisation</>}
          </Button>
        </form>
      </div>

      {success && (
        <div className="p-6 border border-green-500/30 bg-green-500/10 rounded-lg flex items-start gap-4">
          <CheckCircle2 className="h-6 w-6 text-green-500 mt-1" />
          <div>
            <h3 className="font-semibold text-green-500">Job Queued Successfully</h3>
            <p className="text-sm text-muted-foreground mt-1">The dataset is being processed. An authorised reviewer must approve the release before it becomes available in the catalogue.</p>
          </div>
        </div>
      )}
    </div>
  );
}