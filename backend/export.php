<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
require __DIR__ . '/lib.php';

// Every project's full paper trail (quotes, invoices, payments, receipts)
// as a single downloadable JSON file — the "different projects hold their
// own separate information that can be downloaded" requirement. PDFs
// cover the individual invoice/receipt case; this covers "give me
// everything for this project."
require_method('GET');

$id = isset($_GET['id']) ? (int) $_GET['id'] : null;
if (!$id) {
    json_response(['error' => 'Missing ?id='], 400);
}

$detail = project_detail($id);
$detail['exported_at'] = gmdate('c');

$filename = 'project-' . $id . '-' . preg_replace('/[^a-z0-9]+/i', '-', $detail['project']['name']) . '.json';

header('Content-Disposition: attachment; filename="' . $filename . '"');
echo json_encode($detail, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
