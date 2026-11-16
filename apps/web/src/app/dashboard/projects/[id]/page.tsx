"use client";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { FileText, ArrowUpDown, Image as ImageIcon, File, History, Filter, UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ProjectDetails() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [resources, setResources] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string | null>(null);
  const [shareResource, setShareResource] = useState<any>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: "asc" | "desc" } | null>(null);
  const [filterType, setFilterType] = useState("ALL");
  const [filterUser, setFilterUser] = useState("ALL");
  
  // Per-row loading state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [versionsResource, setVersionsResource] = useState<any>(null);
  const [versionsList, setVersionsList] = useState<any[]>([]);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-purple-500" />;
    if (mimeType.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />;
    if (mimeType.includes("word")) return <FileText className="h-4 w-4 text-blue-500" />;
    if (mimeType.includes("presentation")) return <FileText className="h-4 w-4 text-orange-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const fetchResources = async (token?: string) => {
    const jwt = token || (await supabase.auth.getSession()).data.session?.access_token;
    if (!jwt) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resources?projectId=${projectId}`, { headers: { Authorization: `Bearer ${jwt}` } });
    if (res.ok) setResources(await res.json());
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setCurrentUser(session.user);
      fetchResources(session?.access_token);
    };
    init();
    const channel = supabase.channel('resource-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'resources', filter: `project_id=eq.${projectId}` }, () => { fetchResources(); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const filePath = `${session.user.user_metadata.institution_id}/${Date.now()}_${file.name}`;
    await supabase.storage.from("research-vault").upload(filePath, file);

    const res = await fetch("${process.env.NEXT_PUBLIC_API_URL}/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ projectId, name: file.name, filePath, mimeType: file.type, sizeBytes: file.size }),
    });

    if (!res.ok) toast.error("Failed to upload file");
    else { toast.success("File uploaded"); setFile(null); }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this file?")) return;
    setDeletingId(id);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resources/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.access_token}` } });
    if (res.ok) toast.success("File deleted");
    setDeletingId(null);
  };

  const handlePreview = async (filePath: string, mimeType: string) => {
    const { data } = await supabase.storage.from("research-vault").createSignedUrl(filePath, 60);
    if (data) { setPreviewUrl(data.signedUrl); setPreviewType(mimeType); }
  };

  const handleDownload = async (filePath: string) => {
    const { data } = await supabase.storage.from("research-vault").createSignedUrl(filePath, 60);
    if (data) window.open(data.signedUrl, "_blank");
  };

  const handleCreateShare = async (resource: any, hours: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/share/${resource.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ expiresInHours: hours }),
    });
    if (res.ok) { const data = await res.json(); setShareUrl(data.url); toast.success("Share link generated"); }
  };

  const handleShowVersions = async (resource: any) => {
    setVersionsResource(resource);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resources/versions?projectId=${projectId}&name=${encodeURIComponent(resource.name)}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
    if (res.ok) setVersionsList(await res.json());
  };

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const filteredAndSortedResources = useMemo(() => {
    let items = [...resources];
    if (filterType !== "ALL") items = items.filter(r => {
      if (filterType === "IMAGE") return r.mimeType.startsWith("image/");
      if (filterType === "PDF") return r.mimeType.includes("pdf");
      if (filterType === "DOC") return r.mimeType.includes("word") || r.mimeType.includes("presentation");
      return true;
    });
    if (filterUser === "ME" && currentUser) items = items.filter(r => r.uploadedBy === currentUser.id);
    if (sortConfig !== null) items.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return items;
  }, [resources, filterType, filterUser, sortConfig, currentUser]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-bold">Project Files</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          Live Updates
        </div>
      </div>
      
      <form onSubmit={handleUpload}>
        <div 
          className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        >
          <input type="file" id="fileUpload" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <label htmlFor="fileUpload" className="cursor-pointer">
            <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-foreground">
              {file ? file.name : "Drag and drop your file here, or click to browse"}
            </p>
          </label>
        </div>
        <div className="flex justify-end mt-4">
          <Button type="submit" disabled={!file || uploading}>
            {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : "Upload File"}
          </Button>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-4 p-4 border border-border rounded-lg bg-card">
        <div className="flex items-center gap-2 text-sm font-medium"><Filter className="h-4 w-4" /> Filters:</div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-1.5 border border-border rounded-md bg-background text-sm">
          <option value="ALL">All File Types</option>
          <option value="IMAGE">Images</option>
          <option value="PDF">PDFs</option>
          <option value="DOC">Documents</option>
        </select>
        <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="px-3 py-1.5 border border-border rounded-md bg-background text-sm">
          <option value="ALL">Uploaded by Anyone</option>
          <option value="ME">Uploaded by Me</option>
        </select>
        <div className="text-xs text-muted-foreground ml-auto">Showing {filteredAndSortedResources.length} of {resources.length}</div>
      </div>

      {filteredAndSortedResources.length === 0 ? (
        <div className="text-center py-20 border border-border rounded-lg border-dashed bg-card">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No files match your filters</h3>
        </div>
      ) : (
        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground select-none">
              <tr>
                <th className="px-4 py-3 cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => requestSort("name")}><div className="flex items-center gap-1">Name <ArrowUpDown className="h-3 w-3" /></div></th>
                <th className="px-4 py-3 cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => requestSort("sizeBytes")}><div className="flex items-center gap-1">Size <ArrowUpDown className="h-3 w-3" /></div></th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedResources.map((r) => {
                const isDeleting = deletingId === r.id;
                return (
                  <tr key={r.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-medium"><div className="flex items-center gap-2">{getFileIcon(r.mimeType)}{r.name}</div></td>
                    <td className="px-4 py-3 text-muted-foreground">{(Number(r.sizeBytes) / 1024).toFixed(1)} KB</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleShowVersions(r)} className="inline-flex items-center gap-1 px-2 py-1 bg-secondary hover:bg-secondary/80 rounded text-xs font-medium transition-colors">
                        <History className="h-3 w-3" /> v{r.version}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => { setShareResource(r); setShareUrl(null); }}>Share</Button>
                      {(r.mimeType.startsWith("image/") || r.mimeType.includes("pdf")) && <Button variant="outline" size="sm" onClick={() => handlePreview(r.filePath, r.mimeType)}>Preview</Button>}
                      <Button variant="outline" size="sm" onClick={() => handleDownload(r.filePath)}>Download</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(r.id)} disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Delete"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {previewUrl && (<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setPreviewUrl(null)}><div className="bg-card p-4 rounded-lg max-w-4xl w-full max-h-screen overflow-auto" onClick={e => e.stopPropagation()}><div className="flex justify-between mb-4"><h3 className="font-bold">Preview</h3><Button variant="ghost" onClick={() => setPreviewUrl(null)}>Close</Button></div>{previewType?.includes("pdf") ? <iframe src={previewUrl} className="w-full h-[70vh] border-0" /> : <img src={previewUrl} alt="Preview" className="max-w-full mx-auto" />}</div></div>)}

      {shareResource && (<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"><div className="bg-card p-6 rounded-lg max-w-lg w-full space-y-4"><h3 className="font-bold text-lg">Share "{shareResource.name}"</h3>{!shareUrl ? (<><p className="text-sm text-muted-foreground">Valid for:</p><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{[1, 24, 168, 720, 8760].map(h => <Button key={h} type="button" variant="outline" onClick={() => handleCreateShare(shareResource, h)}>{h === 1 ? "1 Hour" : h === 24 ? "24 Hours" : h === 168 ? "7 Days" : h === 720 ? "1 Month" : "1 Year"}</Button>)}</div></>) : (<><p className="text-sm text-green-500">✅ Link ready!</p><div className="flex gap-2"><input type="text" readOnly value={shareUrl} className="flex-1 p-2 text-xs border border-border rounded bg-background" /><Button type="button" onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Copied!"); }}>Copy</Button></div></>)}<div className="flex justify-end mt-4"><Button type="button" variant="ghost" onClick={() => { setShareResource(null); setShareUrl(null); }}>Close</Button></div></div></div>)}

      {versionsResource && (<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"><div className="bg-card p-6 rounded-lg max-w-lg w-full space-y-4"><h3 className="font-bold text-lg">Versions: "{versionsResource.name}"</h3><div className="max-h-64 overflow-y-auto space-y-2 pr-2">{versionsList.map(v => (<div key={v.id} className="flex items-center justify-between p-3 border border-border rounded-md bg-background"><div className="flex flex-col"><span className="font-bold text-sm">v{v.version} {v.isLatest && <span className="text-xs font-normal text-green-500 ml-1">(Latest)</span>}</span><span className="text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleString()}</span></div><Button variant="outline" size="sm" onClick={() => handleDownload(v.filePath)}>Download</Button></div>))}</div><div className="flex justify-end mt-4"><Button type="button" variant="ghost" onClick={() => setVersionsResource(null)}>Close</Button></div></div></div>)}
    </div>
  );
}