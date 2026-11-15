"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";

export default function ProjectDetails() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [resources, setResources] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchResources = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch("http://localhost:4000/resources", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) setResources((await res.json()).filter((r: any) => r.projectId === projectId));
  };

  useEffect(() => { fetchResources(); }, [projectId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const filePath = `${session.user.user_metadata.institution_id}/${Date.now()}_${file.name}`;
    await supabase.storage.from("research-vault").upload(filePath, file);

    const res = await fetch("http://localhost:4000/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ projectId, name: file.name, filePath, mimeType: file.type, sizeBytes: file.size }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.message || "Failed to upload");
    } else {
      setFile(null);
      fetchResources();
    }
    setUploading(false);
  };

  const handleDownload = async (filePath: string) => {
    const { data } = await supabase.storage.from("research-vault").createSignedUrl(filePath, 60);
    if (data) window.open(data.signedUrl, "_blank");
  };

  const handleSoftDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this file? It will be hidden but preserved in the audit log.")) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`http://localhost:4000/resources/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.ok) {
      fetchResources();
    } else {
      const err = await res.json();
      alert(err.message || "Failed to delete");
    }
  };

  const filteredResources = resources.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <h1 className="text-3xl font-display font-bold">Project Files</h1>
      </div>
      
      <div className="flex gap-4">
        <form onSubmit={handleUpload} className="flex gap-4 flex-1">
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="flex-1 p-2 border border-border rounded-md bg-background" />
          <Button type="submit" disabled={!file || uploading}>{uploading ? "Uploading..." : "Upload"}</Button>
        </form>
        <input 
          type="text" placeholder="Search files..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-64 px-3 py-2 border border-border rounded-md bg-background"
        />
      </div>

      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredResources.map((r) => (
              <tr key={r.id} className="border-b border-border">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{(Number(r.sizeBytes) / 1024).toFixed(1)} KB</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleDownload(r.filePath)}>Download</Button>
                  <Button variant="danger" size="sm" onClick={() => handleSoftDelete(r.id)}>Delete</Button>
                </td>
              </tr>
            ))}
            {filteredResources.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No files found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}