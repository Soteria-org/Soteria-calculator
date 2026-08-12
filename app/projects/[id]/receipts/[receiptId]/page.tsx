"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiUnavailableError, getReceipt } from "@/lib/api-client";
import { formatUgx } from "@/lib/format";
import { ReceiptDetail } from "@/lib/records-types";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; receipt: ReceiptDetail };

export default function ReceiptPage({
  params,
}: {
  params: { id: string; receiptId: string };
}) {
  const projectId = Number(params.id);
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    getReceipt(Number(params.receiptId))
      .then(({ receipt }) => setState({ status: "ready", receipt }))
      .catch((err) => {
        setState({
          status: "error",
          message:
            err instanceof ApiUnavailableError
              ? "Records backend not configured."
              : err.message ?? "Could not load this receipt.",
        });
      });
  }, [params.receiptId]);

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

  const { receipt } = state;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/projects/${projectId}`}
          className="text-sm font-medium text-soteria-teal hover:underline"
        >
          ← {receipt.project_name}
        </Link>
        <button type="button" onClick={() => window.print()} className="btn-primary">
          Print / Save PDF
        </button>
      </div>

      <section className="card p-6 print:border-slate-200 print:bg-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-soteria-faint print:text-slate-400">
          Payment receipt
        </p>
        <h1 className="text-xl font-bold text-soteria-ink print:text-slate-900">
          {receipt.receipt_number}
        </h1>
        <p className="text-sm text-soteria-muted print:text-slate-500">
          {new Date(receipt.created_at).toLocaleDateString()}
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-soteria-muted print:text-slate-500">
              Received from
            </p>
            <p className="font-medium text-soteria-ink print:text-slate-800">{receipt.client_name}</p>
            {receipt.client_email && (
              <p className="text-sm text-soteria-body print:text-slate-600">{receipt.client_email}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-soteria-muted print:text-slate-500">
              For
            </p>
            <p className="font-medium text-soteria-ink print:text-slate-800">{receipt.project_name}</p>
            <p className="text-sm text-soteria-body print:text-slate-600">
              Invoice {receipt.invoice_number}
            </p>
          </div>
        </div>

        <table className="mt-6 w-full text-sm">
          <tbody>
            <tr className="border-b border-soteria-border print:border-slate-200">
              <td className="py-2 text-soteria-body print:text-slate-700">
                {receipt.covers || "Payment towards invoice " + receipt.invoice_number}
              </td>
              <td className="py-2 text-right font-medium text-soteria-ink print:text-slate-800">
                {formatUgx(receipt.amount_ugx)}
              </td>
            </tr>
            <tr className="border-b border-soteria-border print:border-slate-200">
              <td className="py-1.5 text-soteria-muted print:text-slate-500">Method</td>
              <td className="py-1.5 text-right text-soteria-body print:text-slate-700">
                {receipt.method}
              </td>
            </tr>
            <tr className="border-b border-soteria-border print:border-slate-200">
              <td className="py-1.5 text-soteria-muted print:text-slate-500">Date paid</td>
              <td className="py-1.5 text-right text-soteria-body print:text-slate-700">
                {new Date(receipt.paid_at).toLocaleDateString()}
              </td>
            </tr>
            {receipt.notes && (
              <tr className="border-b border-soteria-border print:border-slate-200">
                <td className="py-1.5 text-soteria-muted print:text-slate-500">Notes</td>
                <td className="py-1.5 text-right text-soteria-body print:text-slate-700">
                  {receipt.notes}
                </td>
              </tr>
            )}
            <tr>
              <td className="py-2 font-semibold text-soteria-ink print:text-slate-900">
                Amount received
              </td>
              <td className="py-2 text-right text-lg font-bold text-soteria-gold print:text-amber-700">
                {formatUgx(receipt.amount_ugx)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}
