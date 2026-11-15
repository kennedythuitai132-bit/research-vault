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
  const [uploading, setUploading] = useState(false);
  
  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string | null>(null);

  // Share state
  const [shareResource, setShareResource] = useState<any>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const fetchResources = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`http://localhost:4000/resources?projectId=${projectId}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) setResources(await res.json());
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

    if (!res.ok) alert("Failed to upload");
    else { setFile(null); fetchResources(); }
    setUploading(false);
  };

  const handlePreview = async (filePath: string, mimeType: string) => {
    const { data } = await supabase.storage.from("research-vault").createSignedUrl(filePath, 60);
    if (data) {
      setPreviewUrl(data.signedUrl);
      setPreviewType(mimeType);
    }
  };

  const handleDownload = async (filePath: string) => {
    const { data } = await supabase.storage.from("research-vault").createSignedUrl(filePath, 60);
    if (data) window.open(data.signedUrl, "_blank");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this file?")) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`http://localhost:4000/resources/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    fetchResources();
  };

  const handleCreateShare = async (resource: any, hours: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const res = await fetch(`http://localhost:4000/share/${resource.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ expiresInHours: hours }),
    });

    if (res.ok) {
      const data = await res.json();
      setShareUrl(data.url);
    } else {
      alert("Failed to generate share link");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-3xl font-display font-bold">Project Files</h1>
      
      <form onSubmit={handleUpload} className="flex gap-4">
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="flex-1 p-2 border border-border rounded-md bg-background" />
        <Button type="submit" disabled={!file || uploading}>{uploading ? "Uploading..." : "Upload"}</Button>
      </form>

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
            {resources.map((r) => (
              <tr key={r.id} className="border-b border-border">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{(Number(r.sizeBytes) / 1024).toFixed(1)} KB</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => { setShareResource(r); setShareUrl(null); }}>Share</Button>
                  {(r.mimeType.startsWith('image/') || r.mimeType === 'application/pdf') && (
                    <Button variant="outline" size="sm" onClick={() => handlePreview(r.filePath, r.mimeType)}>Preview</Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => handleDownload(r.filePath)}>Download</Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(r.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setPreviewUrl(null)}>
          <div className="bg-card p-4 rounded-lg max-w-4xl w-full max-h-screen overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4">
              <h3 className="font-bold">File Preview</h3>
              <Button variant="ghost" onClick={() => setPreviewUrl(null)}>Close</Button>
            </div>
            {previewType === 'application/pdf' ? (
              <iframe src={previewUrl} className="w-full h-[70vh] border-0" title="PDF Preview" />
            ) : (
              <img src={previewUrl} alt="Preview" className="max-w-full mx-auto" />
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareResource && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card p-6 rounded-lg max-w-lg w-full space-y-4">
            <h3 className="font-bold text-lg">Share "{shareResource.name}"</h3>
            
            {!shareUrl ? (
              <>
                <p className="text-sm text-muted-foreground">Select how long this external link should be valid:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <Button type="button" variant="outline" onClick={() => handleCreateShare(shareResource, 1)}>1 Hour</Button>
                  <Button type="button" variant="outline" onClick={() => handleCreateShare(shareResource, 24)}>24 Hours</Button>
                  <Button type="button" variant="outline" onClick={() => handleCreateShare(shareResource, 168)}>7 Days</Button>
                  <Button type="button" variant="outline" onClick={() => handleCreateShare(shareResource, 720)}>1 Month</Button>
                  <Button type="button" variant="outline" onClick={() => handleCreateShare(shareResource, 8760)}>1 Year</Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-green-500 font-medium">✅ Link generated successfully!</p>
                <div className="flex gap-2">
                  <input type="text" readOnly value={shareUrl} className="flex-1 p-2 text-xs border border-border rounded bg-background" />
                  <Button type="button" onClick={() => { navigator.clipboard.writeText(shareUrl); alert("Copied!"); }}>Copy</Button>
                </div>
                <p className="text-xs text-muted-foreground">Anyone with this link can download the file. It will automatically expire.</p>
              </>
            )}

            <div className="flex justify-end mt-4">
              <Button type="button" variant="ghost" onClick={() => { setShareResource(null); setShareUrl(null); }}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}