<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

$method = require_method('POST', 'PATCH');
$pdo = db();

if ($method === 'POST') {
    $data = json_input();
    $input = require_field($data, 'input');
    $result = require_field($data, 'result');

    $pdo->beginTransaction();
    try {
        $clientId = resolve_client($pdo, $data);
        $projectId = resolve_project($pdo, $data, $clientId);

        $stmt = $pdo->prepare(
            'INSERT INTO quotes (project_id, status, input_json, result_json) VALUES (:project_id, :status, :input_json, :result_json)'
        );
        $stmt->execute([
            'project_id' => $projectId,
            'status' => $data['status'] ?? 'draft',
            'input_json' => json_encode($input, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            'result_json' => json_encode($result, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        ]);
        $quoteId = (int) $pdo->lastInsertId();

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        json_response(['error' => 'Could not save quote: ' . $e->getMessage()], 500);
    }

    json_response(['clientId' => $clientId, 'projectId' => $projectId, 'quoteId' => $quoteId], 201);
}

if ($method === 'PATCH') {
    $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
    if ($id <= 0) {
        json_response(['error' => 'Missing ?id='], 400);
    }

    $data = json_input();
    $status = require_field($data, 'status');
    $allowed = ['draft', 'sent', 'accepted', 'expired'];
    if (!in_array($status, $allowed, true)) {
        json_response(['error' => 'status must be one of: ' . implode(', ', $allowed)], 400);
    }

    $timestampColumn = match ($status) {
        'sent' => 'sent_at',
        'accepted' => 'accepted_at',
        default => null,
    };

    $sql = $timestampColumn
        ? "UPDATE quotes SET status = :status, {$timestampColumn} = NOW() WHERE id = :id"
        : 'UPDATE quotes SET status = :status WHERE id = :id';

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['status' => $status, 'id' => $id]);

    if ($stmt->rowCount() === 0) {
        json_response(['error' => 'Quote not found'], 404);
    }
    json_response(['id' => $id, 'status' => $status]);
}

/** Uses clientId if given, otherwise finds-or-creates a client by exact name. */
function resolve_client(PDO $pdo, array $data): int
{
    if (!empty($data['clientId'])) {
        return (int) $data['clientId'];
    }

    $name = require_field($data, 'clientName');

    $find = $pdo->prepare('SELECT id FROM clients WHERE name = :name LIMIT 1');
    $find->execute(['name' => $name]);
    $existing = $find->fetch();
    if ($existing) {
        return (int) $existing['id'];
    }

    $insert = $pdo->prepare('INSERT INTO clients (name, email, phone) VALUES (:name, :email, :phone)');
    $insert->execute([
        'name' => $name,
        'email' => $data['clientEmail'] ?? null,
        'phone' => $data['clientPhone'] ?? null,
    ]);
    return (int) $pdo->lastInsertId();
}

/** Uses projectId if given, otherwise creates a new project under the client. */
function resolve_project(PDO $pdo, array $data, int $clientId): int
{
    if (!empty($data['projectId'])) {
        return (int) $data['projectId'];
    }

    $name = require_field($data, 'projectName');

    $insert = $pdo->prepare('INSERT INTO projects (client_id, name, project_type) VALUES (:client_id, :name, :project_type)');
    $insert->execute([
        'client_id' => $clientId,
        'name' => $name,
        'project_type' => $data['projectType'] ?? null,
    ]);
    return (int) $pdo->lastInsertId();
}
