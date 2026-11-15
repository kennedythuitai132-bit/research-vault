"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardOverview() {
  const [apiData, setApiData] = useState<any>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("http://localhost:4000/users/me", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) setApiData(await res.json());
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold">Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border border-border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-4">Security Status</h2>
          <div className="space-y-2 text-sm">
            <p className="flex justify-between"><span className="text-muted-foreground">Auth Provider:</span> <span>Supabase</span></p>
            <p className="flex justify-between"><span className="text-muted-foreground">Database:</span> <span>PostgreSQL (RLS Active)</span></p>
            <p className="flex justify-between"><span className="text-muted-foreground">Institution ID:</span> <span className="font-mono text-xs">{apiData?.institutionId || 'Loading...'}</span></p>
          </div>
        </div>
        
        <div className="p-6 border border-border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-4">User Profile</h2>
          <p className="text-sm text-muted-foreground mb-1">Full Name</p>
          <p className="font-medium text-lg">{apiData?.fullName || 'Loading...'}</p>
          <p className="text-sm text-muted-foreground mt-4 mb-1">Email</p>
          <p className="font-medium">{apiData?.email || 'Loading...'}</p>
        </div>
      </div>
    </div>
  );
}