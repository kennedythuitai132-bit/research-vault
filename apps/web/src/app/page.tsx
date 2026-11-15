import Link from "next/link";
import {
  ShieldCheck,
  FolderLock,
  Users,
  ScrollText,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const pillars = [
  {
    icon: ShieldCheck,
    title: "Zero Trust security",
    body: "Every request is authenticated, authorised and audited - no implicit trust.",
  },
  {
    icon: FolderLock,
    title: "Encrypted storage",
    body: "Private buckets, signed access, application-level encryption and version history.",
  },
  {
    icon: Users,
    title: "Granular roles",
    body: "Institution, department, project and resource-level permissions - configurable by admins.",
  },
  {
    icon: ScrollText,
    title: "Tamper-evident audit",
    body: "Chained-hash audit logs cover every sensitive action, protected from unauthorised modification.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              Research Vault
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button disabled aria-disabled="true">
              Sign in
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="container py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-security" aria-hidden="true" />
              Secure Research Data Management
            </p>
            <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Secure. Organise. Protect. Innovate.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              A trusted digital environment for universities, research
              institutions and scientific organisations to protect, govern and
              collaborate on sensitive research information across its full
              lifecycle.
            </p>
            <div className="mt-10 flex items-center justify-center gap-3">
              <Button size="lg" disabled aria-disabled="true">
                Sign in
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button size="lg" variant="outline" disabled aria-disabled="true">
                Request invitation
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Authentication and onboarding are enabled in a later phase.
            </p>
          </div>
        </section>

        <section className="border-t border-border bg-secondary/40">
          <div className="container py-16">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {pillars.map(({ icon: Icon, title, body }) => (
                <article
                  key={title}
                  className="rounded-lg border border-border bg-card p-6"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 font-display text-base font-semibold">
                    {title}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="container flex flex-col gap-2 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright {new Date().getFullYear()} Research Vault. All rights reserved.</p>
          <p>Synthetic data only. No production data in this build.</p>
        </div>
      </footer>
    </div>
  );
}