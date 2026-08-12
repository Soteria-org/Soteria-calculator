<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

// Applies schema.sql to whatever database config.php is pointed at.
// Safe to run any number of times — every statement in schema.sql is
// `CREATE TABLE IF NOT EXISTS`, so a rerun against an already-migrated
// database is a no-op, not a reset. This exists specifically for hosts
// like InfinityFree where there's no shell/SSH to run a migration
// command — this is the migration command, reachable over HTTP instead.
//
// Requires SOTERIA_MIGRATION_TOKEN (config.local.php or env) to match a
// `token` query/body param, because this is the one endpoint in the API
// that runs DDL rather than CRUD — it must not be left open the way the
// rest of the API currently is (see README's "What this doesn't do yet").

require_method('GET', 'POST');

global $MIGRATION_TOKEN;
if ($MIGRATION_TOKEN === '') {
    json_response(['error' => 'SOTERIA_MIGRATION_TOKEN is not configured — refusing to run.'], 503);
}

$provided = $_REQUEST['token'] ?? '';
if (!is_string($provided) || !hash_equals($MIGRATION_TOKEN, $provided)) {
    json_response(['error' => 'Invalid or missing token'], 403);
}

$schemaPath = __DIR__ . '/schema.sql';
if (!file_exists($schemaPath)) {
    json_response(['error' => 'schema.sql not found next to migrate.php on this deployment'], 500);
}

$sql = file_get_contents($schemaPath);
// Strip -- line comments, then split on statement-terminating semicolons.
// schema.sql has no semicolons inside string literals, so this simple
// split is safe for this specific file — it is not a general SQL parser.
$sql = preg_replace('/^--.*$/m', '', $sql);
$statements = array_filter(array_map('trim', explode(';', $sql)));

$pdo = db();
$results = [];
$hadError = false;

foreach ($statements as $statement) {
    if ($statement === '') {
        continue;
    }
    $label = preg_match('/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+`?(\w+)`?/i', $statement, $m)
        ? $m[1]
        : substr($statement, 0, 40);

    try {
        $pdo->exec($statement);
        $results[] = ['table' => $label, 'ok' => true];
    } catch (PDOException $e) {
        $hadError = true;
        $results[] = ['table' => $label, 'ok' => false, 'error' => $e->getMessage()];
    }
}

json_response([
    'migrated' => !$hadError,
    'statements' => count($statements),
    'results' => $results,
], $hadError ? 500 : 200);
