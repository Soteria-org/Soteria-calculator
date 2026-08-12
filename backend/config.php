<?php
// Shared bootstrap for every endpoint in this API: DB connection, CORS,
// and small JSON in/out helpers. Deliberately framework-free — this API
// is thin CRUD over the tables in schema.sql, nothing more. It never
// computes a price; see the note at the top of schema.sql.

declare(strict_types=1);

// --- Database ---------------------------------------------------------
//
// Three ways to configure this, checked in order:
//   1. config.local.php (gitignored — see config.local.php.example).
//      This is the one that matters on shared hosting like InfinityFree,
//      where there's no reliable way to set real environment variables
//      for PHP — SetEnv in .htaccess is not guaranteed to reach getenv()
//      under every PHP-handler configuration, so don't depend on it.
//   2. Environment variables (SOTERIA_DB_*) — works under XAMPP, a VPS,
//      or anywhere you do control the process environment.
//   3. Defaults matching a fresh XAMPP install (MySQL on localhost, root,
//      no password).
//
// Never hardcode real production credentials directly in this file.
$localConfig = __DIR__ . '/config.local.php';
if (file_exists($localConfig)) {
    require $localConfig;
}

$DB_HOST = defined('SOTERIA_DB_HOST') ? SOTERIA_DB_HOST : (getenv('SOTERIA_DB_HOST') ?: '127.0.0.1');
$DB_NAME = defined('SOTERIA_DB_NAME') ? SOTERIA_DB_NAME : (getenv('SOTERIA_DB_NAME') ?: 'soteria_calculator');
$DB_USER = defined('SOTERIA_DB_USER') ? SOTERIA_DB_USER : (getenv('SOTERIA_DB_USER') ?: 'root');
$DB_PASS = defined('SOTERIA_DB_PASS') ? SOTERIA_DB_PASS : (getenv('SOTERIA_DB_PASS') ?: '');

// Which frontend origin(s) may call this API. '*' is fine while this is
// local-only and unreachable from the internet; once the API has a real
// public host (InfinityFree, etc.), set this to the exact Vercel URL(s)
// in config.local.php so a random site can't call your write endpoints
// from a browser. This does NOT replace authentication — see
// backend/README.md's "What this doesn't do yet" section.
$ALLOWED_ORIGIN = defined('SOTERIA_ALLOWED_ORIGIN') ? SOTERIA_ALLOWED_ORIGIN : (getenv('SOTERIA_ALLOWED_ORIGIN') ?: '*');

// Shared secret migrate.php requires before it will touch the schema.
// Empty means "not configured" — migrate.php refuses to run rather than
// defaulting to open, since this is the one endpoint that runs DDL.
$MIGRATION_TOKEN = defined('SOTERIA_MIGRATION_TOKEN') ? SOTERIA_MIGRATION_TOKEN : (getenv('SOTERIA_MIGRATION_TOKEN') ?: '');

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
header('Access-Control-Allow-Origin: ' . $ALLOWED_ORIGIN);
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');
if ($ALLOWED_ORIGIN !== '*') {
    header('Vary: Origin');
}

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
