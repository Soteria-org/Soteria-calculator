"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiUnavailableError, listProjects } from "@/lib/api-client";
import { ProjectSummary, QuoteStatus } from "@/lib/records-types";

const statusStyles: Record<QuoteStatus, string> = {
  draft: "border-soteria-border bg-soteria-hoverWash text-soteria-muted",
  sent: "border-soteria-gold/40 bg-soteria-goldSoft text-soteria-gold",
  accepted: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-300",
  expired: "border-soteria-warn/40 bg-soteria-warnSoft text-soteria-warn",
};

type LoadState =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "error"; message: string }
  | { status: "ready"; projects: ProjectSummary[] };

export default function ProjectsPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    listProjects()
      .then(({ projects }) => {
        if (!cancelled) setState({ status: "ready", projects });
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiUnavailableError) {
          setState({ status: "unavailable" });
        } else {
          setState({ status: "error", message: err.message ?? "Could not load projects." });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/"
            className="text-sm font-medium text-soteria-teal hover:text-soteria-tealLight hover:underline"
          >
            ← Soteria Calculator
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-soteria-ink">
            Saved projects
          </h1>
        </div>
        <Link href="/calculator" className="btn-primary">
          New estimate
        </Link>
      </div>

      {state.status === "loading" && (
        <p className="text-sm text-soteria-muted">Loading…</p>
      )}

      {state.status === "unavailable" && (
        <section className="card p-5">
          <p className="font-medium text-soteria-ink">Records backend not configured</p>
          <p className="field-hint mt-1">
            Saved quotes, invoices, payments, and receipts live in a separate
            PHP + MySQL API (<code className="rounded bg-soteria-surfaceHover px-1 py-0.5">backend/</code>).
            Set <code className="rounded bg-soteria-surfaceHover px-1 py-0.5">NEXT_PUBLIC_API_BASE_URL</code>{" "}
            (see <code className="rounded bg-soteria-surfaceHover px-1 py-0.5">.env.local.example</code>) once
            it's running — see <code className="rounded bg-soteria-surfaceHover px-1 py-0.5">backend/README.md</code>{" "}
            for XAMPP setup. The calculator itself works without it.
          </p>
        </section>
      )}

      {state.status === "error" && (
        <section className="card border-soteria-warn/40 bg-soteria-warnSoft p-5">
          <p className="font-medium text-soteria-warn">{state.message}</p>
        </section>
      )}

      {state.status === "ready" && state.projects.length === 0 && (
        <section className="card p-5 text-center">
          <p className="text-sm text-soteria-muted">
            No saved projects yet. Build an estimate and click{" "}
            <span className="font-medium text-soteria-ink">Save quote</span>.
          </p>
        </section>
      )}

      {state.status === "ready" && state.projects.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-soteria-border text-xs uppercase tracking-wide text-soteria-muted">
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Latest quote</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {state.projects.map((p) => (
                <tr key={p.id} className="border-b border-soteria-border last:border-b-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${p.id}`}
                      className="font-medium text-soteria-ink hover:text-soteria-teal hover:underline"
                    >
                      {p.name}
                    </Link>
                    {p.project_type && (
                      <span className="block text-xs text-soteria-muted">{p.project_type}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-soteria-body">{p.client_name}</td>
                  <td className="px-4 py-3">
                    {p.latest_quote_status ? (
                      <span className={`chip border ${statusStyles[p.latest_quote_status]}`}>
                        {p.latest_quote_status}
                      </span>
                    ) : (
                      <span className="text-soteria-faint">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-soteria-muted">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
