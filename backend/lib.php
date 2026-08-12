<?php
declare(strict_types=1);
// Shared domain helpers used by both projects.php and export.php — kept
// here rather than duplicated so the two never drift.

function project_detail(int $id): array
{
    $pdo = db();

    $stmt = $pdo->prepare(
        'SELECT p.id, p.name, p.project_type, p.created_at, c.id AS client_id, c.name AS client_name, c.email AS client_email, c.phone AS client_phone
         FROM projects p JOIN clients c ON c.id = p.client_id
         WHERE p.id = :id'
    );
    $stmt->execute(['id' => $id]);
    $project = $stmt->fetch();
    if (!$project) {
        json_response(['error' => 'Project not found'], 404);
    }

    $quotesStmt = $pdo->prepare(
        'SELECT id, status, input_json, result_json, created_at, sent_at, accepted_at
         FROM quotes WHERE project_id = :id ORDER BY created_at DESC, id DESC'
    );
    $quotesStmt->execute(['id' => $id]);
    $quotes = array_map('decode_quote_json', $quotesStmt->fetchAll());

    $invoicesStmt = $pdo->prepare(
        'SELECT id, quote_id, invoice_number, type, description, amount_ugx, status, due_date, created_at
         FROM invoices WHERE project_id = :id ORDER BY created_at DESC, id DESC'
    );
    $invoicesStmt->execute(['id' => $id]);
    $invoices = $invoicesStmt->fetchAll();

    if ($invoices) {
        $invoiceIds = array_column($invoices, 'id');
        $placeholders = implode(',', array_fill(0, count($invoiceIds), '?'));

        $paymentsStmt = $pdo->prepare(
            "SELECT pay.id, pay.invoice_id, pay.amount_ugx, pay.method, pay.covers, pay.paid_at, pay.notes, pay.created_at, r.id AS receipt_id, r.receipt_number
             FROM payments pay
             LEFT JOIN receipts r ON r.payment_id = pay.id
             WHERE pay.invoice_id IN ($placeholders)
             ORDER BY pay.paid_at ASC, pay.id ASC"
        );
        $paymentsStmt->execute($invoiceIds);
        $payments = $paymentsStmt->fetchAll();

        $paymentsByInvoice = [];
        foreach ($payments as $payment) {
            $paymentsByInvoice[(int) $payment['invoice_id']][] = $payment;
        }
        foreach ($invoices as &$invoice) {
            $invoice['payments'] = $paymentsByInvoice[(int) $invoice['id']] ?? [];
        }
        unset($invoice);
    }

    return [
        'project' => $project,
        'quotes' => $quotes,
        'invoices' => $invoices,
    ];
}

function decode_quote_json(array $quote): array
{
    $quote['input'] = json_decode($quote['input_json'], true);
    $quote['result'] = json_decode($quote['result_json'], true);
    unset($quote['input_json'], $quote['result_json']);
    return $quote;
}
