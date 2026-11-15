"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [apiData, setApiData] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  
  // Project form state
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      try {
        const res = await fetch("http://localhost:4000/users/me", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) setApiData(await res.json());
      } catch (err: any) {
        setError(err.message);
      }

      await fetchProjects(session.access_token);
      await fetchResources(session.access_token);
      setLoading(false);
    };
    init();
  }, [router]);

  const fetchProjects = async (token?: string) => {
    const jwt = token || (await supabase.auth.getSession()).data.session?.access_token;
    if (!jwt) return;
    const res = await fetch("http://localhost:4000/projects", {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (res.ok) {
      const data = await res.json();
      setProjects(data);
      if (data.length > 0 && !selectedProjectId) setSelectedProjectId(data[0].id);
    }
  };

  const fetchResources = async (token?: string) => {
    const jwt = token || (await supabase.auth.getSession()).data.session?.access_token;
    if (!jwt) return;
    const res = await fetch("http://localhost:4000/resources", {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (res.ok) setResources(await res.json());
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName) return;
    setCreatingProject(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    try {
      const res = await fetch("http://localhost:4000/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: newProjectName,
          departmentId: "33333333-3333-3333-3333-333333333333", // Dummy dept for now
        }),
      });
      if (res.ok) {
        setNewProjectName("");
        await fetchProjects(session.access_token);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingProject(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;
    setUploading(true);
    setError(null);
    setUploadSuccess(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const filePath = `${user.user_metadata.institution_id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("research-vault")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const res = await fetch("http://localhost:4000/resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          name: file.name,
          filePath: filePath,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to save metadata");
      }

      setUploadSuccess(true);
      setFile(null);
      await fetchResources(session.access_token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from("research-vault")
      .createSignedUrl(filePath, 60);
    if (error) alert("Could not download file: " + error.message);
    else window.open(data.signedUrl, "_blank");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h1 className="text-3xl font-display font-bold">Dashboard</h1>
          <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md">
            <strong>API Error:</strong> {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 border border-border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-4">Supabase Auth Session</h2>
            <p className="text-sm text-muted-foreground mb-2">Email:</p>
            <p className="font-mono bg-muted p-2 rounded">{user?.email}</p>
            <p className="text-sm text-muted-foreground mt-4 mb-2">Auth ID:</p>
            <p className="font-mono bg-muted p-2 rounded text-xs">{user?.id}</p>
          </div>

          <div className="p-6 border border-border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-4">Database (via NestJS API)</h2>
            {apiData ? (
              <>
                <p className="text-sm text-muted-foreground mb-2">Full Name:</p>
                <p className="font-mono bg-muted p-2 rounded">{apiData.fullName}</p>
                <p className="text-sm text-muted-foreground mt-4 mb-2">Institution ID:</p>
                <p className="font-mono bg-muted p-2 rounded text-xs">{apiData.institutionId}</p>
              </>
            ) : (
              <p className="text-muted-foreground">Loading...</p>
            )}
          </div>
        </div>

        {/* Projects Card */}
        <div className="p-6 border border-border rounded-lg bg-card mt-6">
          <h2 className="text-xl font-semibold mb-4">Projects</h2>
          
          <form onSubmit={handleCreateProject} className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="New project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-sm"
              required
            />
            <Button type="submit" disabled={creatingProject}>
              {creatingProject ? "Creating..." : "Create Project"}
            </Button>
          </form>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select a project for uploads:</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            >
              {projects.length === 0 && <option value="">No projects available</option>}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Upload Card */}
        <div className="p-6 border border-border rounded-lg bg-card mt-6">
          <h2 className="text-xl font-semibold mb-4">Upload Research File</h2>
          <form onSubmit={handleFileUpload} className="flex items-center gap-4">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            <Button type="submit" disabled={!file || uploading || !selectedProjectId}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </form>
          {uploadSuccess && (
            <p className="text-sm text-green-500 mt-4">✅ File uploaded to selected project!</p>
          )}
        </div>

        {/* Files Table */}
        <div className="p-6 border border-border rounded-lg bg-card mt-6">
          <h2 className="text-xl font-semibold mb-4">Institution Research Files</h2>
          {resources.length === 0 ? (
            <p className="text-muted-foreground text-sm">No files uploaded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Project ID</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((r) => (
                    <tr key={r.id} className="border-b border-border">
                      <td className="px-4 py-3 font-medium">{r.name}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{r.projectId.slice(0, 8)}...</td>
                      <td className="px-4 py-3 text-muted-foreground">{(Number(r.sizeBytes) / 1024).toFixed(1)} KB</td>
                      <td className="px-4 py-3">
                        <Button variant="outline" size="sm" onClick={() => handleDownload(r.filePath)}>
                          Download
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}