<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

$method = require_method('GET', 'POST');
$pdo = db();

if ($method === 'GET') {
    $projectId = isset($_GET['project_id']) ? (int) $_GET['project_id'] : null;
    if (!$projectId) {
        json_response(['error' => 'Missing ?project_id='], 400);
    }

    $stmt = $pdo->prepare(
        'SELECT id, quote_id, invoice_number, type, description, amount_ugx, status, due_date, created_at
         FROM invoices WHERE project_id = :project_id ORDER BY created_at DESC, id DESC'
    );
    $stmt->execute(['project_id' => $projectId]);
    json_response(['invoices' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
    $data = json_input();
    $projectId = (int) require_field($data, 'project_id');
    $type = require_field($data, 'type');
    $amountUgx = require_field($data, 'amount_ugx');

    $allowedTypes = ['deposit', 'balance', 'full', 'maintenance', 'custom'];
    if (!in_array($type, $allowedTypes, true)) {
        json_response(['error' => 'type must be one of: ' . implode(', ', $allowedTypes)], 400);
    }
    if (!is_numeric($amountUgx) || (float) $amountUgx <= 0) {
        json_response(['error' => 'amount_ugx must be a positive number'], 400);
    }

    $pdo->beginTransaction();
    try {
        // invoice_number is derived from the row's own id, so insert with a
        // placeholder unique value first, then fill in the real number.
        $stmt = $pdo->prepare(
            'INSERT INTO invoices (project_id, quote_id, invoice_number, type, description, amount_ugx, due_date)
             VALUES (:project_id, :quote_id, :placeholder, :type, :description, :amount_ugx, :due_date)'
        );
        $stmt->execute([
            'project_id' => $projectId,
            'quote_id' => $data['quote_id'] ?? null,
            'placeholder' => 'TMP-' . uniqid(),
            'type' => $type,
            'description' => $data['description'] ?? null,
            'amount_ugx' => $amountUgx,
            'due_date' => $data['due_date'] ?? null,
        ]);
        $id = (int) $pdo->lastInsertId();

        $invoiceNumber = sequence_number('INV', $id);
        $pdo->prepare('UPDATE invoices SET invoice_number = :n WHERE id = :id')
            ->execute(['n' => $invoiceNumber, 'id' => $id]);

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        json_response(['error' => 'Could not create invoice: ' . $e->getMessage()], 500);
    }

    json_response(['id' => $id, 'invoice_number' => $invoiceNumber], 201);
}
