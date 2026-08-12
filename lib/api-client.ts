// Thin client for backend/*.php — the records API (quotes, invoices,
// payments, receipts). Deliberately not a generic fetch wrapper library:
// one function per endpoint, so call sites read like what they do.
//
// This calls a separate PHP+MySQL service (see backend/README.md), not a
// route inside this Next.js app — set NEXT_PUBLIC_API_BASE_URL to where
// it's running (XAMPP locally today; see .env.local.example).

import {
  Client,
  Invoice,
  Payment,
  ProjectDetail,
  ProjectSummary,
  QuoteStatus,
  ReceiptDetail,
} from "./records-types";
import { EstimateResult, ProjectInput } from "./types";

/** Thrown when the records API isn't configured or can't be reached at all — distinct from the API responding with a validation error. */
export class ApiUnavailableError extends Error {
  constructor(message = "The records backend isn't reachable. Is the PHP API running?") {
    super(message);
    this.name = "ApiUnavailableError";
  }
}

/** Thrown when the records API responded, but with an error (validation, not found, etc). */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function baseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) {
    throw new ApiUnavailableError(
      "NEXT_PUBLIC_API_BASE_URL is not set — see .env.local.example."
    );
  }
  return url.replace(/\/$/, "");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiUnavailableError();
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(body?.error ?? `Request failed (${response.status})`, response.status);
  }
  return body as T;
}

// --- Clients ---------------------------------------------------------------

export function listClients(): Promise<{ clients: Client[] }> {
  return request("/clients.php");
}

export function createClient(data: {
  name: string;
  email?: string;
  phone?: string;
}): Promise<{ id: number; name: string }> {
  return request("/clients.php", { method: "POST", body: JSON.stringify(data) });
}

// --- Projects ---------------------------------------------------------------

export function listProjects(): Promise<{ projects: ProjectSummary[] }> {
  return request("/projects.php");
}

export function getProject(id: number): Promise<ProjectDetail> {
  return request(`/projects.php?id=${id}`);
}

// --- Quotes ---------------------------------------------------------------

export interface SaveQuoteInput {
  clientId?: number;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  projectId?: number;
  projectName?: string;
  projectType?: string;
  status?: QuoteStatus;
  input: ProjectInput;
  result: EstimateResult;
}

export function saveQuote(
  data: SaveQuoteInput
): Promise<{ clientId: number; projectId: number; quoteId: number }> {
  return request("/quotes.php", { method: "POST", body: JSON.stringify(data) });
}

export function updateQuoteStatus(
  id: number,
  status: QuoteStatus
): Promise<{ id: number; status: QuoteStatus }> {
  return request(`/quotes.php?id=${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// --- Invoices ---------------------------------------------------------------

export function listInvoices(projectId: number): Promise<{ invoices: Invoice[] }> {
  return request(`/invoices.php?project_id=${projectId}`);
}

export interface CreateInvoiceInput {
  project_id: number;
  quote_id?: number;
  type: Invoice["type"];
  description?: string;
  amount_ugx: number;
  due_date?: string;
}

export function createInvoice(
  data: CreateInvoiceInput
): Promise<{ id: number; invoice_number: string }> {
  return request("/invoices.php", { method: "POST", body: JSON.stringify(data) });
}

// --- Payments ---------------------------------------------------------------

export function listPayments(invoiceId: number): Promise<{ payments: Payment[] }> {
  return request(`/payments.php?invoice_id=${invoiceId}`);
}

export interface RecordPaymentInput {
  invoice_id: number;
  amount_ugx: number;
  method: string;
  covers?: string;
  paid_at: string;
  notes?: string;
}

export function recordPayment(data: RecordPaymentInput): Promise<{
  id: number;
  receiptId: number;
  receiptNumber: string;
  invoiceStatus: Invoice["status"];
}> {
  return request("/payments.php", { method: "POST", body: JSON.stringify(data) });
}

// --- Receipts ---------------------------------------------------------------

export function getReceipt(id: number): Promise<{ receipt: ReceiptDetail }> {
  return request(`/receipts.php?id=${id}`);
}

// --- Export ---------------------------------------------------------------

/** Direct download URL for a project's full record bundle — not a fetch, just a link/window.location target. */
export function exportProjectUrl(projectId: number): string {
  return `${baseUrl()}/export.php?id=${projectId}`;
}
