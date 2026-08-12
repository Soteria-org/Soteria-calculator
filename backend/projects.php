<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
require __DIR__ . '/lib.php';

$method = require_method('GET', 'POST');

if ($method === 'GET') {
    $id = isset($_GET['id']) ? (int) $_GET['id'] : null;

    if ($id !== null) {
        json_response(project_detail($id));
    }

    // List view: one row per project, with its client and the most
    // recent quote's status, so a dashboard can render without N+1 calls.
    $sql = 'SELECT
              p.id, p.name, p.project_type, p.created_at,
              c.id AS client_id, c.name AS client_name,
              latest.status AS latest_quote_status,
              latest.id AS latest_quote_id
            FROM projects p
            JOIN clients c ON c.id = p.client_id
            LEFT JOIN quotes latest ON latest.id = (
              SELECT q2.id FROM quotes q2
              WHERE q2.project_id = p.id
              ORDER BY q2.created_at DESC, q2.id DESC
              LIMIT 1
            )
            ORDER BY p.created_at DESC';
    $rows = db()->query($sql)->fetchAll();
    json_response(['projects' => $rows]);
}

if ($method === 'POST') {
    $data = json_input();
    $clientId = (int) require_field($data, 'client_id');
    $name = require_field($data, 'name');

    $stmt = db()->prepare('INSERT INTO projects (client_id, name, project_type) VALUES (:client_id, :name, :project_type)');
    $stmt->execute([
        'client_id' => $clientId,
        'name' => $name,
        'project_type' => $data['project_type'] ?? null,
    ]);

    $id = (int) db()->lastInsertId();
    json_response(project_detail($id), 201);
}
