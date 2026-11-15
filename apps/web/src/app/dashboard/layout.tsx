"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, Folder, Building, Users, ScrollText, LogOut, LayoutDashboard 
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      // Fetch user role
      const res = await fetch("http://localhost:4000/users/me", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRole(data.role);
      }
    };
    init();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const isAdmin = role === 'INSTITUTION_ADMIN' || role === 'SUPER_ADMIN';
  const isAuditor = role === 'AUDITOR';

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard, show: true },
    { name: "Projects", href: "/dashboard/projects", icon: Folder, show: !isAuditor },
    { name: "Departments", href: "/dashboard/departments", icon: Building, show: !isAuditor },
    { name: "Audit Trail", href: "/dashboard/audit", icon: ScrollText, show: isAdmin || isAuditor },
    { name: "Admin Panel", href: "/dashboard/admin", icon: Users, show: isAdmin },
  ].filter(item => item.show);

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 border-r border-border bg-card flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-2 border-b border-border">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="font-display font-bold text-lg">Research Vault</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href} 
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">{role}</p>
          <p className="text-xs text-muted-foreground mb-3 truncate">{user.email}</p>
          <Button variant="danger" className="w-full justify-start gap-2" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}