<?php
// Shared bootstrap for every endpoint in this API: DB connection, CORS,
// and small JSON in/out helpers. Deliberately framework-free — this API
// is thin CRUD over the tables in schema.sql, nothing more. It never
// computes a price; see the note at the top of schema.sql.

declare(strict_types=1);

// --- Database ---------------------------------------------------------
//
// Defaults match a fresh XAMPP install (MySQL on localhost, root, no
// password). Override via environment variables when this moves to real
// hosting later — never hardcode production credentials here.
$DB_HOST = getenv('SOTERIA_DB_HOST') ?: '127.0.0.1';
$DB_NAME = getenv('SOTERIA_DB_NAME') ?: 'soteria_calculator';
$DB_USER = getenv('SOTERIA_DB_USER') ?: 'root';
$DB_PASS = getenv('SOTERIA_DB_PASS') ?: '';

function db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    global $DB_HOST, $DB_NAME, $DB_USER, $DB_PASS;
    $dsn = "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4";

    try {
        $pdo = new PDO($dsn, $DB_USER, $DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $e) {
        json_response(['error' => 'Database connection failed. Is MySQL running and schema.sql imported?'], 500);
    }

    return $pdo;
}

// --- CORS ---------------------------------------------------------------
//
// The frontend runs on a different origin (Vercel) than this API (local
// XAMPP for now). Allow-all is fine for local development against a tool
// nobody outside the team can reach; tighten this to a specific origin
// once the API has a real, internet-facing host.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// --- Helpers --------------------------------------------------------------

function json_response($data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function json_input(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        json_response(['error' => 'Request body must be valid JSON'], 400);
    }
    return $decoded;
}

function require_method(string ...$allowed): string
{
    $method = $_SERVER['REQUEST_METHOD'];
    if (!in_array($method, $allowed, true)) {
        json_response(['error' => "Method {$method} not allowed"], 405);
    }
    return $method;
}

function require_field(array $data, string $field)
{
    if (!array_key_exists($field, $data) || $data[$field] === null || $data[$field] === '') {
        json_response(['error' => "Missing required field: {$field}"], 400);
    }
    return $data[$field];
}

/** Zero-padded, prefixed sequence number (e.g. INV-000042) from an auto-increment id. */
function sequence_number(string $prefix, int $id): string
{
    return sprintf('%s-%06d', $prefix, $id);
}
