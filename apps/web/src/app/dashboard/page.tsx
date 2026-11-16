"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Folder, Building, FileText, HardDrive, ArrowRight, Activity, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OverviewPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ projects: 0, departments: 0, files: 0, size: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUser(session.user);
      const h = { Authorization: `Bearer ${session.access_token}` };

      const [projRes, depRes, resRes, auditRes] = await Promise.all([
        fetch("${process.env.NEXT_PUBLIC_API_URL}/projects", { headers: h }),
        fetch("${process.env.NEXT_PUBLIC_API_URL}/departments", { headers: h }),
        fetch("${process.env.NEXT_PUBLIC_API_URL}/resources", { headers: h }),
        fetch("${process.env.NEXT_PUBLIC_API_URL}/audit", { headers: h })
      ]);

      let pCount = 0, dCount = 0, fCount = 0, totalSize = 0;
      let recent: any[] = [];

      if (projRes.ok) { const p = await projRes.json(); pCount = p.length; }
      if (depRes.ok) { const d = await depRes.json(); dCount = d.length; }
      if (resRes.ok) { 
        const r = await resRes.json(); 
        fCount = r.length; 
        totalSize = r.reduce((acc: number, curr: any) => acc + Number(curr.sizeBytes || 0), 0);
      }
      if (auditRes.ok) { const a = await auditRes.json(); recent = a.slice(0, 5); }

      setStats({ projects: pCount, departments: dCount, files: fCount, size: totalSize });
      setRecentActivity(recent);
    };
    fetchDashboardData();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">My Workspace</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user?.user_metadata?.full_name || user?.email || "Loading..."}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 border border-border rounded-lg bg-card">
          <div className="p-2 bg-primary/10 rounded-md w-fit mb-4"><Folder className="h-5 w-5 text-primary" /></div>
          <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
          <h3 className="text-3xl font-bold">{stats.projects}</h3>
        </div>
        <div className="p-6 border border-border rounded-lg bg-card">
          <div className="p-2 bg-blue-500/10 rounded-md w-fit mb-4"><Building className="h-5 w-5 text-blue-500" /></div>
          <p className="text-sm font-medium text-muted-foreground">Departments</p>
          <h3 className="text-3xl font-bold">{stats.departments}</h3>
        </div>
        <div className="p-6 border border-border rounded-lg bg-card">
          <div className="p-2 bg-green-500/10 rounded-md w-fit mb-4"><FileText className="h-5 w-5 text-green-500" /></div>
          <p className="text-sm font-medium text-muted-foreground">Files Uploaded</p>
          <h3 className="text-3xl font-bold">{stats.files}</h3>
        </div>
        <div className="p-6 border border-border rounded-lg bg-card">
          <div className="p-2 bg-purple-500/10 rounded-md w-fit mb-4"><HardDrive className="h-5 w-5 text-purple-500" /></div>
          <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
          <h3 className="text-3xl font-bold">{formatSize(stats.size)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 border border-border rounded-lg bg-card p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><ArrowRight className="h-5 w-5 text-primary" /> Quick Actions</h3>
          <div className="space-y-3">
            <Link href="/dashboard/projects" className="block"><Button variant="outline" className="w-full justify-start h-12"><Folder className="mr-2 h-4 w-4 text-primary" /> Go to Projects</Button></Link>
            <Link href="/dashboard/departments" className="block"><Button variant="outline" className="w-full justify-start h-12"><Building className="mr-2 h-4 w-4 text-blue-500" /> Manage Departments</Button></Link>
            <Link href="/dashboard/trash" className="block"><Button variant="outline" className="w-full justify-start h-12"><HardDrive className="mr-2 h-4 w-4 text-muted-foreground" /> View Trash Bin</Button></Link>
          </div>
        </div>
        <div className="lg:col-span-2 border border-border rounded-lg bg-card p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Activity className="h-5 w-5 text-green-500" /> Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground"><Clock className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No recent activity.</p></div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((act: any) => (
                <div key={act.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0"><Activity className="h-4 w-4 text-muted-foreground" /></div>
                  <div><p className="text-sm font-medium">{act.action.replace(/_/g, ' ')}</p><p className="text-xs text-muted-foreground">{new Date(act.createdAt).toLocaleString()}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}