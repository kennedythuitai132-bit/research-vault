"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

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
        .from('research-vault')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const res = await fetch('http://localhost:4000/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          projectId: '99999999-9999-9999-9999-999999999999', 
          name: file.name,
          filePath: filePath,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to save metadata');
      }

      setUploadSuccess(true);
      setFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      // 1. Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      setUser(session.user);

      // 2. Fetch data from NestJS backend
      try {
        const res = await fetch("http://localhost:4000/users/me", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `API Error: ${res.status}`);
        }
        
        const data = await res.json();
        setApiData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

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
            <p className="text-sm text-muted-foreground mt-4 mb-2">Auth ID (UUID):</p>
            <p className="font-mono bg-muted p-2 rounded text-xs">{user?.id}</p>
          </div>

          <div className="p-6 border border-border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-4">Database (via NestJS API)</h2>
            {apiData ? (
              <>
                <p className="text-sm text-muted-foreground mb-2">Full Name:</p>
                <p className="font-mono bg-muted p-2 rounded">{apiData.fullName}</p>
                <p className="text-sm text-muted-foreground mt-4 mb-2">Institution ID (from RLS):</p>
                <p className="font-mono bg-muted p-2 rounded text-xs">{apiData.institutionId}</p>
                <p className="text-sm text-green-500 mt-4 font-semibold">
                  Ã¢Å“â€¦ Successfully fetched via secure API
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">Loading from API...</p>
            )}
          </div>
        {/* File Upload Card */}
        <div className="p-6 border border-border rounded-lg bg-card md:col-span-2 mt-6">
          <h2 className="text-xl font-semibold mb-4">Upload Research File</h2>
          <form onSubmit={handleFileUpload} className="flex items-center gap-4">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            <Button type="submit" disabled={!file || uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </form>
          {uploadSuccess && (
            <p className="text-sm text-green-500 mt-4">
              ✅ File uploaded and metadata saved securely!
            </p>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}