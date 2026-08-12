<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

$method = require_method('GET', 'POST');

if ($method === 'GET') {
    $stmt = db()->query('SELECT id, name, email, phone, created_at FROM clients ORDER BY name ASC');
    json_response(['clients' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
    $data = json_input();
    $name = require_field($data, 'name');

    $stmt = db()->prepare('INSERT INTO clients (name, email, phone) VALUES (:name, :email, :phone)');
    $stmt->execute([
        'name' => $name,
        'email' => $data['email'] ?? null,
        'phone' => $data['phone'] ?? null,
    ]);

    $id = (int) db()->lastInsertId();
    json_response(['id' => $id, 'name' => $name], 201);
}
