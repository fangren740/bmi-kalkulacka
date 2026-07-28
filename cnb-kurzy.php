<?php
/**
 * Same-origin proxy pro kurzovní lístek ČNB.
 * Řeší omezení CORS v prohlížeči, validuje vstup a používá krátkou serverovou cache.
 */

declare(strict_types=1);
date_default_timezone_set('Europe/Prague');

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header("Content-Security-Policy: default-src 'none'");
header('Referrer-Policy: no-referrer');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['error' => 'Povolena je pouze metoda GET.'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$date = isset($_GET['date']) ? trim((string) $_GET['date']) : date('Y-m-d');
$lang = isset($_GET['lang']) ? strtoupper(trim((string) $_GET['lang'])) : 'CS';
if ($lang !== 'CS' && $lang !== 'EN') {
    $lang = 'CS';
}

$parsedDate = DateTimeImmutable::createFromFormat('!Y-m-d', $date);
$dateErrors = DateTimeImmutable::getLastErrors();
$isValidDate = $parsedDate instanceof DateTimeImmutable
    && ($dateErrors === false || ($dateErrors['warning_count'] === 0 && $dateErrors['error_count'] === 0))
    && $parsedDate->format('Y-m-d') === $date;

$today = new DateTimeImmutable('today');
if (!$isValidDate || $parsedDate < new DateTimeImmutable('1991-01-01') || $parsedDate > $today) {
    http_response_code(400);
    echo json_encode(['error' => 'Neplatné datum. Použijte formát RRRR-MM-DD a datum od roku 1991 do dneška.'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$cacheFile = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'rychlevypocty-cnb-' . $date . '-' . strtolower($lang) . '.json';
$isToday = $date === $today->format('Y-m-d');
$cacheTtl = $isToday ? 900 : 2592000;

$cached = readCache($cacheFile);
if ($cached !== null && (time() - $cached['mtime']) <= $cacheTtl) {
    header('Cache-Control: public, max-age=300, stale-while-revalidate=86400');
    header('X-RV-Rate-Source: server-cache');
    echo $cached['body'];
    exit;
}

$apiBase = getenv('RV_CNB_API_URL') ?: 'https://api.cnb.cz/cnbapi/exrates/daily';
$txtBase = getenv('RV_CNB_TXT_URL') ?: 'https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt';

$payload = null;
$apiUrl = $apiBase . (strpos($apiBase, '?') === false ? '?' : '&') . http_build_query(['date' => $date, 'lang' => $lang], '', '&', PHP_QUERY_RFC3986);
$apiBody = fetchRemote($apiUrl);
if ($apiBody !== null) {
    $decoded = json_decode($apiBody, true);
    if (is_array($decoded) && isset($decoded['rates']) && is_array($decoded['rates'])) {
        $payload = normalizeApiPayload($decoded, $date);
    } elseif (is_array($decoded) && array_is_list_compat($decoded)) {
        $payload = normalizeApiPayload(['rates' => $decoded], $date);
    }
}

if ($payload === null) {
    $txtUrl = $txtBase . (strpos($txtBase, '?') === false ? '?' : '&') . http_build_query(['date' => $parsedDate->format('d.m.Y')], '', '&', PHP_QUERY_RFC3986);
    $txtBody = fetchRemote($txtUrl);
    if ($txtBody !== null) {
        $payload = parseTxtPayload($txtBody, $date);
    }
}

if ($payload !== null && count($payload['rates']) >= 10) {
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION);
    if ($json !== false) {
        @file_put_contents($cacheFile, $json, LOCK_EX);
        header('Cache-Control: public, max-age=300, stale-while-revalidate=86400');
        header('X-RV-Rate-Source: cnb');
        echo $json;
        exit;
    }
}

if ($cached !== null) {
    header('Cache-Control: public, max-age=60, stale-while-revalidate=86400');
    header('Warning: 110 - "Použita starší serverová cache"');
    header('X-RV-Rate-Source: stale-server-cache');
    echo $cached['body'];
    exit;
}

http_response_code(502);
header('Cache-Control: no-store');
echo json_encode(['error' => 'Kurzovní lístek ČNB se nyní nepodařilo načíst.'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

function fetchRemote(string $url): ?string
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        if ($ch === false) {
            return null;
        }
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 3,
            CURLOPT_CONNECTTIMEOUT => 4,
            CURLOPT_TIMEOUT => 8,
            CURLOPT_USERAGENT => 'RychleVypocty.cz/1.0 (+https://www.rychlevypocty.cz/)',
            CURLOPT_HTTPHEADER => ['Accept: application/json, text/plain;q=0.9'],
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ]);
        $body = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);
        return is_string($body) && $status >= 200 && $status < 300 ? $body : null;
    }

    if (!filter_var((string) ini_get('allow_url_fopen'), FILTER_VALIDATE_BOOLEAN)) {
        return null;
    }
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => 8,
            'ignore_errors' => true,
            'header' => "Accept: application/json, text/plain;q=0.9\r\nUser-Agent: RychleVypocty.cz/1.0\r\n",
        ],
        'ssl' => ['verify_peer' => true, 'verify_peer_name' => true],
    ]);
    $body = @file_get_contents($url, false, $context);
    return is_string($body) && $body !== '' ? $body : null;
}

function normalizeApiPayload(array $decoded, string $requestedDate): ?array
{
    $rates = [];
    foreach ($decoded['rates'] as $item) {
        if (!is_array($item)) {
            continue;
        }
        $code = strtoupper(trim((string) ($item['currencyCode'] ?? $item['code'] ?? '')));
        $amount = (float) ($item['amount'] ?? 0);
        $rate = (float) ($item['rate'] ?? 0);
        if (!preg_match('/^[A-Z]{3}$/', $code) || $amount <= 0 || $rate <= 0) {
            continue;
        }
        $validFor = normalizeIsoDate((string) ($item['validFor'] ?? $requestedDate)) ?: $requestedDate;
        $rates[] = [
            'validFor' => $validFor,
            'order' => isset($item['order']) ? (int) $item['order'] : null,
            'country' => trim((string) ($item['country'] ?? '')),
            'currency' => trim((string) ($item['currency'] ?? $code)),
            'amount' => $amount,
            'currencyCode' => $code,
            'rate' => $rate,
        ];
    }
    return count($rates) >= 10 ? ['rates' => $rates] : null;
}

function parseTxtPayload(string $body, string $requestedDate): ?array
{
    $body = preg_replace('/^\xEF\xBB\xBF/', '', $body) ?? $body;
    $lines = preg_split('/\r\n|\r|\n/', trim($body));
    if (!is_array($lines) || count($lines) < 3) {
        return null;
    }

    $validFor = $requestedDate;
    if (preg_match('/^(\d{2})\.(\d{2})\.(\d{4})/', trim($lines[0]), $m)) {
        $validFor = $m[3] . '-' . $m[2] . '-' . $m[1];
    }

    $rates = [];
    foreach (array_slice($lines, 2) as $line) {
        $line = trim($line);
        if ($line === '') {
            break;
        }
        $parts = explode('|', $line);
        if (count($parts) < 5) {
            continue;
        }
        $code = strtoupper(trim($parts[3]));
        $amount = (float) str_replace(',', '.', trim($parts[2]));
        $rate = (float) str_replace(',', '.', trim($parts[4]));
        if (!preg_match('/^[A-Z]{3}$/', $code) || $amount <= 0 || $rate <= 0) {
            continue;
        }
        $rates[] = [
            'validFor' => $validFor,
            'order' => null,
            'country' => trim($parts[0]),
            'currency' => trim($parts[1]),
            'amount' => $amount,
            'currencyCode' => $code,
            'rate' => $rate,
        ];
    }
    return count($rates) >= 10 ? ['rates' => $rates] : null;
}

function normalizeIsoDate(string $value): ?string
{
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
    return $date instanceof DateTimeImmutable && $date->format('Y-m-d') === $value ? $value : null;
}

function readCache(string $file): ?array
{
    if (!is_file($file) || !is_readable($file)) {
        return null;
    }
    $body = @file_get_contents($file);
    if (!is_string($body) || $body === '') {
        return null;
    }
    $decoded = json_decode($body, true);
    if (!is_array($decoded) || !isset($decoded['rates']) || !is_array($decoded['rates']) || count($decoded['rates']) < 10) {
        return null;
    }
    return ['body' => $body, 'mtime' => (int) @filemtime($file)];
}

function array_is_list_compat(array $array): bool
{
    if (function_exists('array_is_list')) {
        return array_is_list($array);
    }
    return array_keys($array) === range(0, count($array) - 1);
}
