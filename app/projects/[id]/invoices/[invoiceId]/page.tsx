"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiUnavailableError, getProject } from "@/lib/api-client";
import { formatUgx } from "@/lib/format";
import { Invoice, ProjectDetail } from "@/lib/records-types";

const invoiceTypeLabels: Record<Invoice["type"], string> = {
  deposit: "Deposit",
  balance: "Balance",
  full: "Full development price",
  maintenance: "Maintenance",
  custom: "Invoice",
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; project: ProjectDetail["project"]; invoice: Invoice };

export default function InvoicePage({
  params,
}: {
  params: { id: string; invoiceId: string };
}) {
  const projectId = Number(params.id);
  const invoiceId = Number(params.invoiceId);
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    getProject(projectId)
      .then(({ project, invoices }) => {
        const invoice = invoices.find((i) => i.id === invoiceId);
        if (!invoice) {
          setState({ status: "error", message: "Invoice not found." });
          return;
        }
        setState({ status: "ready", project, invoice });
      })
      .catch((err) => {
        setState({
          status: "error",
          message:
            err instanceof ApiUnavailableError
              ? "Records backend not configured."
              : err.message ?? "Could not load this invoice.",
        });
      });
  }, [projectId, invoiceId]);

  if (state.status === "loading") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-soteria-muted">Loading…</p>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-soteria-warn">{state.message}</p>
      </main>
    );
  }

  const { project, invoice } = state;
  const paid = invoice.payments.reduce((sum, p) => sum + p.amount_ugx, 0);
  const remaining = Math.max(invoice.amount_ugx - paid, 0);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/projects/${projectId}`}
          className="text-sm font-medium text-soteria-teal hover:underline"
        >
          ← {project.name}
        </Link>
        <button type="button" onClick={() => window.print()} className="btn-primary">
          Print / Save PDF
        </button>
      </div>

      <section className="card p-6 print:border-slate-200 print:bg-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-soteria-faint print:text-slate-400">
              {invoiceTypeLabels[invoice.type]}
            </p>
            <h1 className="text-xl font-bold text-soteria-ink print:text-slate-900">
              Invoice {invoice.invoice_number}
            </h1>
            <p className="text-sm text-soteria-muted print:text-slate-500">
              {new Date(invoice.created_at).toLocaleDateString()}
              {invoice.due_date ? ` · Due ${new Date(invoice.due_date).toLocaleDateString()}` : ""}
            </p>
          </div>
          <span className="chip border border-soteria-border print:border-slate-300">
            {invoice.status}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-soteria-muted print:text-slate-500">
              Billed to
            </p>
            <p className="font-medium text-soteria-ink print:text-slate-800">
              {project.client_name}
            </p>
            {project.client_email && (
              <p className="text-sm text-soteria-body print:text-slate-600">{project.client_email}</p>
            )}
            {project.client_phone && (
              <p className="text-sm text-soteria-body print:text-slate-600">{project.client_phone}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-soteria-muted print:text-slate-500">
              Project
            </p>
            <p className="font-medium text-soteria-ink print:text-slate-800">{project.name}</p>
          </div>
        </div>

        <table className="mt-6 w-full text-sm">
          <tbody>
            <tr className="border-b border-soteria-border print:border-slate-200">
              <td className="py-2 text-soteria-body print:text-slate-700">
                {invoice.description || invoiceTypeLabels[invoice.type]}
              </td>
              <td className="py-2 text-right font-medium text-soteria-ink print:text-slate-800">
                {formatUgx(invoice.amount_ugx)}
              </td>
            </tr>
            <tr>
              <td className="py-2 font-semibold text-soteria-ink print:text-slate-900">Total</td>
              <td className="py-2 text-right text-lg font-bold text-soteria-gold print:text-amber-700">
                {formatUgx(invoice.amount_ugx)}
              </td>
            </tr>
          </tbody>
        </table>

        {invoice.payments.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase text-soteria-muted print:text-slate-500">
              Payments received
            </p>
            <table className="mt-1 w-full text-sm">
              <tbody>
                {invoice.payments.map((p) => (
                  <tr key={p.id} className="border-b border-soteria-border print:border-slate-100">
                    <td className="py-1.5 text-soteria-body print:text-slate-700">
                      {new Date(p.paid_at).toLocaleDateString()} · {p.method}
                      {p.covers ? ` — ${p.covers}` : ""}
                    </td>
                    <td className="py-1.5 text-right text-soteria-body print:text-slate-700">
                      {formatUgx(p.amount_ugx)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-1.5 font-medium text-soteria-ink print:text-slate-800">
                    Balance remaining
                  </td>
                  <td className="py-1.5 text-right font-semibold text-soteria-ink print:text-slate-800">
                    {formatUgx(remaining)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
