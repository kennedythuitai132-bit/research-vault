"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Folder, FileText, HardDrive } from "lucide-react";

export default function DashboardOverview() {
  const [apiData, setApiData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const h = { Authorization: `Bearer ${session.access_token}` };

      const userRes = await fetch("http://localhost:4000/users/me", { headers: h });
      if (userRes.ok) {
        const userData = await userRes.json();
        setApiData(userData);

        // If admin, fetch high-level stats
        if (userData.role === 'INSTITUTION_ADMIN' || userData.role === 'SUPER_ADMIN') {
          const statsRes = await fetch("http://localhost:4000/admin/stats", { headers: h });
          if (statsRes.ok) setStats(await statsRes.json());
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  if (loading) return <div className="p-8">Loading dashboard...</div>;

  const isAdmin = apiData?.role === 'INSTITUTION_ADMIN' || apiData?.role === 'SUPER_ADMIN';

  // 1. ADMIN DASHBOARD VIEW
  if (isAdmin) {
    const storageMB = stats ? (Number(stats.totalStorageBytes) / (1024 * 1024)).toFixed(2) : "0";
    
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Institution Overview</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {apiData.fullName}. Here is the current state of your vault.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 border border-border rounded-lg bg-card flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-full"><Users className="h-6 w-6" /></div>
            <div><p className="text-sm text-muted-foreground">Total Users</p><p className="text-2xl font-bold">{stats?.totalUsers || 0}</p></div>
          </div>
          <div className="p-6 border border-border rounded-lg bg-card flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-full"><Folder className="h-6 w-6" /></div>
            <div><p className="text-sm text-muted-foreground">Projects</p><p className="text-2xl font-bold">{stats?.totalProjects || 0}</p></div>
          </div>
          <div className="p-6 border border-border rounded-lg bg-card flex items-center gap-4">
            <div className="p-3 bg-green-500/10 text-green-500 rounded-full"><FileText className="h-6 w-6" /></div>
            <div><p className="text-sm text-muted-foreground">Active Files</p><p className="text-2xl font-bold">{stats?.totalFiles || 0}</p></div>
          </div>
          <div className="p-6 border border-border rounded-lg bg-card flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-full"><HardDrive className="h-6 w-6" /></div>
            <div><p className="text-sm text-muted-foreground">Storage Used</p><p className="text-2xl font-bold">{storageMB} MB</p></div>
          </div>
        </div>
      </div>
    );
  }

  // 2. RESEARCHER / AUDITOR DASHBOARD VIEW
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold">My Workspace</h1>
      <p className="text-muted-foreground">Welcome back, {apiData?.fullName}.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="p-6 border border-border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-4">Your Access Level</h2>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
            {apiData?.role}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            You are assigned to <span className="font-medium text-foreground">{apiData?.institutionId.slice(0,8)}...</span>. 
            Your access is governed by your institution's security policies.
          </p>
        </div>
        
        <div className="p-6 border border-border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <p className="text-sm text-muted-foreground">
            Head over to the <strong>Projects</strong> tab to view or upload your research data.
          </p>
        </div>
      </div>
    </div>
  );
}