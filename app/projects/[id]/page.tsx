"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ApiError,
  ApiUnavailableError,
  createInvoice,
  exportProjectUrl,
  getProject,
  recordPayment,
  updateQuoteStatus,
} from "@/lib/api-client";
import { formatUgx } from "@/lib/format";
import {
  Invoice,
  InvoiceType,
  ProjectDetail,
  QuoteStatus,
} from "@/lib/records-types";

const quoteStatusStyles: Record<QuoteStatus, string> = {
  draft: "border-soteria-border bg-soteria-hoverWash text-soteria-muted",
  sent: "border-soteria-gold/40 bg-soteria-goldSoft text-soteria-gold",
  accepted:
    "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-300",
  expired: "border-soteria-warn/40 bg-soteria-warnSoft text-soteria-warn",
};

const invoiceStatusStyles: Record<Invoice["status"], string> = {
  unpaid: "border-soteria-warn/40 bg-soteria-warnSoft text-soteria-warn",
  partial: "border-soteria-gold/40 bg-soteria-goldSoft text-soteria-gold",
  paid: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-300",
  void: "border-soteria-border bg-soteria-hoverWash text-soteria-faint line-through",
};

const invoiceTypeLabels: Record<InvoiceType, string> = {
  deposit: "Deposit",
  balance: "Balance",
  full: "Full amount",
  maintenance: "Maintenance",
  custom: "Custom",
};

function paidToDate(invoice: Invoice): number {
  return invoice.payments.reduce((sum, p) => sum + p.amount_ugx, 0);
}

function defaultAmountFor(
  type: InvoiceType,
  latestQuote: ProjectDetail["quotes"][number] | null
): string {
  const recommended = latestQuote?.result.scenarios.find((s) => s.scenario === "recommended");
  if (type === "deposit" && recommended) return String(recommended.depositUgx);
  if (type === "balance" && recommended) return String(recommended.balanceUgx);
  if (type === "full" && recommended) return String(recommended.developmentPriceUgx);
  if (type === "maintenance" && latestQuote?.result.maintenanceMonthlyUgx) {
    return String(latestQuote.result.maintenanceMonthlyUgx);
  }
  return "";
}

function defaultDescriptionFor(
  type: InvoiceType,
  latestQuote: ProjectDetail["quotes"][number] | null
): string {
  switch (type) {
    case "deposit":
      return latestQuote ? "Deposit to begin work" : "";
    case "balance":
      return latestQuote ? "Balance on completion" : "";
    case "full":
      return latestQuote ? "Full development price" : "";
    case "maintenance":
      return latestQuote?.result.maintenanceMonthlyUgx ? "Maintenance (monthly)" : "";
    default:
      return "";
  }
}

type LoadState =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "error"; message: string }
  | { status: "ready"; data: ProjectDetail };

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const projectId = Number(params.id);
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const reload = useCallback(() => {
    getProject(projectId)
      .then((data) => setState({ status: "ready", data }))
      .catch((err) => {
        if (err instanceof ApiUnavailableError) {
          setState({ status: "unavailable" });
        } else {
          setState({ status: "error", message: err.message ?? "Could not load this project." });
        }
      });
  }, [projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (state.status === "loading") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-sm text-soteria-muted">Loading…</p>
      </main>
    );
  }

  if (state.status === "unavailable" || state.status === "error") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/projects" className="text-sm font-medium text-soteria-teal hover:underline">
          ← Saved projects
        </Link>
        <section className="card mt-4 p-5">
          <p className="font-medium text-soteria-warn">
            {state.status === "unavailable"
              ? "Records backend not configured — see .env.local.example."
              : state.message}
          </p>
        </section>
      </main>
    );
  }

  const { project, quotes, invoices } = state.data;
  const latestQuote = quotes[0] ?? null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/projects" className="text-sm font-medium text-soteria-teal hover:underline">
            ← Saved projects
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-soteria-ink">{project.name}</h1>
          <p className="text-sm text-soteria-muted">
            {project.client_name}
            {project.client_email ? ` · ${project.client_email}` : ""}
            {project.client_phone ? ` · ${project.client_phone}` : ""}
          </p>
        </div>
        <a href={exportProjectUrl(projectId)} className="btn-secondary">
          Download project record (JSON)
        </a>
      </div>

      <section className="card p-5">
        <h2 className="text-base font-semibold text-soteria-ink">Quotes</h2>
        {quotes.length === 0 ? (
          <p className="field-hint mt-1">No quotes saved for this project.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {quotes.map((q) => {
              const recommended = q.result.scenarios.find((s) => s.scenario === "recommended");
              return (
                <div
                  key={q.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-soteria-border p-3"
                >
                  <div>
                    <span className={`chip border ${quoteStatusStyles[q.status]}`}>{q.status}</span>
                    <p className="mt-1 text-sm text-soteria-body">
                      {recommended ? formatUgx(recommended.developmentPriceUgx) : "—"} ·{" "}
                      {new Date(q.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <QuoteStatusActions quote={q} onChanged={reload} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="card mt-6 p-5">
        <h2 className="text-base font-semibold text-soteria-ink">Create an invoice</h2>
        <p className="field-hint mb-3">
          Amounts default from the latest quote's computed figures — edit before saving if needed.
        </p>
        <CreateInvoiceForm projectId={projectId} latestQuote={latestQuote} onCreated={reload} />
      </section>

      <section className="card mt-6 p-5">
        <h2 className="text-base font-semibold text-soteria-ink">Invoices &amp; payments</h2>
        {invoices.length === 0 ? (
          <p className="field-hint mt-1">No invoices yet.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {invoices.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                projectId={projectId}
                invoice={invoice}
                onChanged={reload}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function QuoteStatusActions({
  quote,
  onChanged,
}: {
  quote: ProjectDetail["quotes"][number];
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function setStatus(status: QuoteStatus) {
    setBusy(true);
    try {
      await updateQuoteStatus(quote.id, status);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  const allOptions: { status: QuoteStatus; label: string }[] = [
    { status: "sent", label: "Mark sent" },
    { status: "accepted", label: "Mark accepted" },
    { status: "expired", label: "Mark expired" },
  ];
  const options = allOptions.filter((o) => o.status !== quote.status);

  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.status}
          type="button"
          disabled={busy}
          onClick={() => setStatus(o.status)}
          className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function CreateInvoiceForm({
  projectId,
  latestQuote,
  onCreated,
}: {
  projectId: number;
  latestQuote: ProjectDetail["quotes"][number] | null;
  onCreated: () => void;
}) {
  const [type, setType] = useState<InvoiceType>("deposit");
  const [description, setDescription] = useState(() => defaultDescriptionFor("deposit", latestQuote));
  const [amount, setAmount] = useState(() => defaultAmountFor("deposit", latestQuote));
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function applyDefaults(nextType: InvoiceType) {
    setType(nextType);
    setAmount(defaultAmountFor(nextType, latestQuote));
    setDescription(defaultDescriptionFor(nextType, latestQuote));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amountNumber = Number(amount);
    if (!amountNumber || amountNumber <= 0) {
      setError("Enter a positive amount.");
      return;
    }

    setBusy(true);
    try {
      await createInvoice({
        project_id: projectId,
        quote_id: latestQuote?.id,
        type,
        description: description || undefined,
        amount_ugx: amountNumber,
        due_date: dueDate || undefined,
      });
      setAmount("");
      setDescription("");
      setDueDate("");
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create this invoice.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
      <div>
        <label className="field-label">Type</label>
        <select
          className="input"
          value={type}
          onChange={(e) => applyDefaults(e.target.value as InvoiceType)}
        >
          {(Object.keys(invoiceTypeLabels) as InvoiceType[]).map((t) => (
            <option key={t} value={t} className="bg-soteria-bg">
              {invoiceTypeLabels[t]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label">Amount (UGX)</label>
        <input
          className="input"
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div>
        <label className="field-label">Due date (optional)</label>
        <input
          className="input"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
      <div>
        <label className="field-label">Description</label>
        <input
          className="input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      {error && <p className="col-span-full text-sm text-soteria-warn">{error}</p>}
      <div className="col-span-full">
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
          {busy ? "Creating…" : "Create invoice"}
        </button>
      </div>
    </form>
  );
}

function InvoiceCard({
  projectId,
  invoice,
  onChanged,
}: {
  projectId: number;
  invoice: Invoice;
  onChanged: () => void;
}) {
  const paid = paidToDate(invoice);
  const remaining = Math.max(invoice.amount_ugx - paid, 0);
  const canRecordPayment = invoice.status !== "paid" && invoice.status !== "void";

  return (
    <div className="rounded-md border border-soteria-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className={`chip border ${invoiceStatusStyles[invoice.status]}`}>
            {invoice.status}
          </span>
          <p className="mt-1 font-medium text-soteria-ink">
            {invoice.invoice_number} · {invoiceTypeLabels[invoice.type]}
          </p>
          {invoice.description && (
            <p className="text-sm text-soteria-muted">{invoice.description}</p>
          )}
        </div>
        <div className="text-right">
          <p className="font-semibold text-soteria-ink">{formatUgx(invoice.amount_ugx)}</p>
          {paid > 0 && paid < invoice.amount_ugx && (
            <p className="text-xs text-soteria-muted">
              {formatUgx(paid)} paid · {formatUgx(remaining)} remaining
            </p>
          )}
        </div>
        <Link
          href={`/projects/${projectId}/invoices/${invoice.id}`}
          className="btn-secondary px-3 py-1.5 text-xs"
        >
          View / Print
        </Link>
      </div>

      {invoice.payments.length > 0 && (
        <table className="mt-3 w-full text-sm">
          <tbody>
            {invoice.payments.map((p) => (
              <tr key={p.id} className="border-t border-soteria-border">
                <td className="py-1.5 text-soteria-body">
                  {new Date(p.paid_at).toLocaleDateString()} · {p.method}
                  {p.covers ? ` — ${p.covers}` : ""}
                </td>
                <td className="py-1.5 text-right font-medium text-soteria-ink">
                  {formatUgx(p.amount_ugx)}
                </td>
                <td className="py-1.5 pl-3 text-right">
                  {p.receipt_id && (
                    <Link
                      href={`/projects/${projectId}/receipts/${p.receipt_id}`}
                      className="text-xs text-soteria-teal hover:underline"
                    >
                      Receipt {p.receipt_number}
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {canRecordPayment && (
        <RecordPaymentForm invoiceId={invoice.id} remaining={remaining} onRecorded={onChanged} />
      )}
    </div>
  );
}

function RecordPaymentForm({
  invoiceId,
  remaining,
  onRecorded,
}: {
  invoiceId: number;
  remaining: number;
  onRecorded: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(remaining));
  const [method, setMethod] = useState("Mobile Money");
  const [covers, setCovers] = useState("");
  const [paidAt, setPaidAt] = useState(today);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setAmount(String(remaining));
          setOpen(true);
        }}
        className="btn-secondary mt-3 px-3 py-1.5 text-xs"
      >
        Record payment
      </button>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amountNumber = Number(amount);
    if (!amountNumber || amountNumber <= 0) {
      setError("Enter a positive amount.");
      return;
    }

    setBusy(true);
    try {
      await recordPayment({
        invoice_id: invoiceId,
        amount_ugx: amountNumber,
        method,
        covers: covers || undefined,
        paid_at: paidAt,
        notes: notes || undefined,
      });
      setOpen(false);
      setCovers("");
      setNotes("");
      onRecorded();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not record this payment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 grid grid-cols-1 gap-2 rounded-md border border-soteria-border bg-soteria-surfaceHover p-3 sm:grid-cols-5"
    >
      <div>
        <label className="field-label">Amount (UGX)</label>
        <input
          className="input"
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        {remaining > 0 && (
          <p className="field-hint">Remaining: {formatUgx(remaining)}</p>
        )}
      </div>
      <div>
        <label className="field-label">Method</label>
        <input className="input" value={method} onChange={(e) => setMethod(e.target.value)} />
      </div>
      <div>
        <label className="field-label">Date</label>
        <input
          className="input"
          type="date"
          value={paidAt}
          onChange={(e) => setPaidAt(e.target.value)}
        />
      </div>
      <div>
        <label className="field-label">Covers (for partials)</label>
        <input
          className="input"
          value={covers}
          onChange={(e) => setCovers(e.target.value)}
          placeholder="e.g. Half of the deposit"
        />
      </div>
      <div>
        <label className="field-label">Notes</label>
        <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      {error && <p className="col-span-full text-sm text-soteria-warn">{error}</p>}
      <div className="col-span-full flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
          {busy ? "Recording…" : "Record payment"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
