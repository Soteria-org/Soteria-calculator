<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

// Receipts are created automatically alongside a payment (see
// payments.php) — this endpoint is read-only.
require_method('GET');

$id = isset($_GET['id']) ? (int) $_GET['id'] : null;
if (!$id) {
    json_response(['error' => 'Missing ?id='], 400);
}

$stmt = db()->prepare(
    'SELECT
        r.id, r.receipt_number, r.created_at,
        pay.id AS payment_id, pay.amount_ugx, pay.method, pay.covers, pay.paid_at, pay.notes,
        inv.id AS invoice_id, inv.invoice_number, inv.type AS invoice_type, inv.amount_ugx AS invoice_amount_ugx,
        proj.id AS project_id, proj.name AS project_name,
        c.name AS client_name, c.email AS client_email
     FROM receipts r
     JOIN payments pay ON pay.id = r.payment_id
     JOIN invoices inv ON inv.id = pay.invoice_id
     JOIN projects proj ON proj.id = inv.project_id
     JOIN clients c ON c.id = proj.client_id
     WHERE r.id = :id'
);
$stmt->execute(['id' => $id]);
$receipt = $stmt->fetch();

if (!$receipt) {
    json_response(['error' => 'Receipt not found'], 404);
}

json_response(['receipt' => $receipt]);
