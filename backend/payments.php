<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

$method = require_method('GET', 'POST');
$pdo = db();

if ($method === 'GET') {
    $invoiceId = isset($_GET['invoice_id']) ? (int) $_GET['invoice_id'] : null;
    if (!$invoiceId) {
        json_response(['error' => 'Missing ?invoice_id='], 400);
    }

    $stmt = $pdo->prepare(
        'SELECT pay.id, pay.invoice_id, pay.amount_ugx, pay.method, pay.covers, pay.paid_at, pay.notes, pay.created_at,
                r.id AS receipt_id, r.receipt_number
         FROM payments pay LEFT JOIN receipts r ON r.payment_id = pay.id
         WHERE pay.invoice_id = :invoice_id ORDER BY pay.paid_at ASC, pay.id ASC'
    );
    $stmt->execute(['invoice_id' => $invoiceId]);
    json_response(['payments' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
    $data = json_input();
    $invoiceId = (int) require_field($data, 'invoice_id');
    $amountUgx = require_field($data, 'amount_ugx');
    $method_ = require_field($data, 'method');
    $paidAt = require_field($data, 'paid_at');

    if (!is_numeric($amountUgx) || (float) $amountUgx <= 0) {
        json_response(['error' => 'amount_ugx must be a positive number'], 400);
    }

    $invoiceStmt = $pdo->prepare('SELECT id, amount_ugx, status FROM invoices WHERE id = :id');
    $invoiceStmt->execute(['id' => $invoiceId]);
    $invoice = $invoiceStmt->fetch();
    if (!$invoice) {
        json_response(['error' => 'Invoice not found'], 404);
    }
    if ($invoice['status'] === 'void') {
        json_response(['error' => 'Cannot record a payment against a voided invoice'], 400);
    }

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            'INSERT INTO payments (invoice_id, amount_ugx, method, covers, paid_at, notes)
             VALUES (:invoice_id, :amount_ugx, :method, :covers, :paid_at, :notes)'
        );
        $stmt->execute([
            'invoice_id' => $invoiceId,
            'amount_ugx' => $amountUgx,
            'method' => $method_,
            'covers' => $data['covers'] ?? null,
            'paid_at' => $paidAt,
            'notes' => $data['notes'] ?? null,
        ]);
        $paymentId = (int) $pdo->lastInsertId();

        // A receipt is issued the moment a payment is recorded — no
        // separate "generate receipt" step to forget.
        $receiptStmt = $pdo->prepare(
            'INSERT INTO receipts (payment_id, receipt_number) VALUES (:payment_id, :placeholder)'
        );
        $receiptStmt->execute(['payment_id' => $paymentId, 'placeholder' => 'TMP-' . uniqid()]);
        $receiptId = (int) $pdo->lastInsertId();
        $receiptNumber = sequence_number('RCT', $receiptId);
        $pdo->prepare('UPDATE receipts SET receipt_number = :n WHERE id = :id')
            ->execute(['n' => $receiptNumber, 'id' => $receiptId]);

        // Roll the invoice's status forward from the sum of all its
        // payments — never trust a client-supplied status for this.
        $totalStmt = $pdo->prepare('SELECT COALESCE(SUM(amount_ugx), 0) AS total FROM payments WHERE invoice_id = :id');
        $totalStmt->execute(['id' => $invoiceId]);
        $totalPaid = (float) $totalStmt->fetch()['total'];

        $newStatus = $totalPaid <= 0 ? 'unpaid' : ($totalPaid >= (float) $invoice['amount_ugx'] ? 'paid' : 'partial');
        $pdo->prepare('UPDATE invoices SET status = :status WHERE id = :id')
            ->execute(['status' => $newStatus, 'id' => $invoiceId]);

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        json_response(['error' => 'Could not record payment: ' . $e->getMessage()], 500);
    }

    json_response([
        'id' => $paymentId,
        'receiptId' => $receiptId,
        'receiptNumber' => $receiptNumber,
        'invoiceStatus' => $newStatus,
    ], 201);
}
