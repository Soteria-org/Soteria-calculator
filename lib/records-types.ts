// Shapes returned by backend/*.php. Kept separate from lib/types.ts
// (ProjectInput/EstimateResult) because those describe the calculator's
// pure math; these describe records saved about that math. A SavedQuote
// embeds ProjectInput/EstimateResult verbatim — see backend/schema.sql's
// comment on why that snapshot is frozen rather than recomputed.

import { EstimateResult, ProjectInput } from "./types";

export type QuoteStatus = "draft" | "sent" | "accepted" | "expired";
export type InvoiceType = "deposit" | "balance" | "full" | "maintenance" | "custom";
export type InvoiceStatus = "unpaid" | "partial" | "paid" | "void";

export interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export interface ProjectSummary {
  id: number;
  name: string;
  project_type: string | null;
  created_at: string;
  client_id: number;
  client_name: string;
  latest_quote_status: QuoteStatus | null;
  latest_quote_id: number | null;
}

export interface SavedQuote {
  id: number;
  status: QuoteStatus;
  input: ProjectInput;
  result: EstimateResult;
  created_at: string;
  sent_at: string | null;
  accepted_at: string | null;
}

export interface Payment {
  id: number;
  invoice_id: number;
  amount_ugx: number;
  method: string;
  covers: string | null;
  paid_at: string;
  notes: string | null;
  created_at: string;
  receipt_id: number | null;
  receipt_number: string | null;
}

export interface Invoice {
  id: number;
  quote_id: number | null;
  invoice_number: string;
  type: InvoiceType;
  description: string | null;
  amount_ugx: number;
  status: InvoiceStatus;
  due_date: string | null;
  created_at: string;
  payments: Payment[];
}

export interface ProjectDetail {
  project: {
    id: number;
    name: string;
    project_type: string | null;
    created_at: string;
    client_id: number;
    client_name: string;
    client_email: string | null;
    client_phone: string | null;
  };
  quotes: SavedQuote[];
  invoices: Invoice[];
}

export interface ReceiptDetail {
  id: number;
  receipt_number: string;
  created_at: string;
  payment_id: number;
  amount_ugx: number;
  method: string;
  covers: string | null;
  paid_at: string;
  notes: string | null;
  invoice_id: number;
  invoice_number: string;
  invoice_type: InvoiceType;
  invoice_amount_ugx: number;
  project_id: number;
  project_name: string;
  client_name: string;
  client_email: string | null;
}
