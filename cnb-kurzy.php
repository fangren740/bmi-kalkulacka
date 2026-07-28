<?php
/**
 * Same-origin proxy pro kurzovní lístek ČNB.
 * Kompatibilní i se starší konfigurací sdíleného hostingu.
 * Zkouší oba běžné transporty (PHP stream i cURL), JSON API i oficiální TXT.
 */

date_default_timezone_set('Europe/Prague');

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header("Content-Security-Policy: default-src 'none'");
header('Referrer-Policy: no-referrer');

$method = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';
if ($method !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    send_json(array('error' => 'Povolena je pouze metoda GET.'));
}

$date = isset($_GET['date']) ? trim((string) $_GET['date']) : date('Y-m-d');
$lang = isset($_GET['lang']) ? strtoupper(trim((string) $_GET['lang'])) : 'CS';
if ($lang !== 'CS' && $lang !== 'EN') {
    $lang = 'CS';
}

if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $date, $parts)
    || !checkdate((int) $parts[2], (int) $parts[3], (int) $parts[1])) {
    http_response_code(400);
    send_json(array('error' => 'Neplatné datum. Použijte formát RRRR-MM-DD.'));
}

$requestedTs = strtotime($date . ' 00:00:00');
$minTs = strtotime('1991-01-01 00:00:00');
$todayTs = strtotime(date('Y-m-d') . ' 00:00:00');
if ($requestedTs === false || $requestedTs < $minTs || $requestedTs > $todayTs) {
    http_response_code(400);
    send_json(array('error' => 'Datum musí být od roku 1991 do dneška.'));
}

$cacheFile = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR)
    . DIRECTORY_SEPARATOR
    . 'rychlevypocty-cnb-' . $date . '-' . strtolower($lang) . '.json';
$isToday = $date === date('Y-m-d');
$cacheTtl = $isToday ? 900 : 2592000;
$cached = read_cache($cacheFile);

if ($cached !== null && (time() - $cached['mtime']) <= $cacheTtl) {
    header('Cache-Control: public, max-age=300, stale-while-revalidate=86400');
    header('X-RV-Rate-Source: server-cache');
    echo $cached['body'];
    exit;
}

$apiBase = getenv('RV_CNB_API_URL');
if (!$apiBase) {
    $apiBase = 'https://api.cnb.cz/cnbapi/exrates/daily';
}
$txtBase = getenv('RV_CNB_TXT_URL');
if (!$txtBase) {
    $txtBase = 'https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt';
}

$payload = null;
$source = null;

$apiUrl = append_query($apiBase, array('date' => $date, 'lang' => $lang));
$apiBody = fetch_remote($apiUrl);
if ($apiBody !== null) {
    $decoded = json_decode($apiBody, true);
    if (is_array($decoded)) {
        if (isset($decoded['rates']) && is_array($decoded['rates'])) {
            $payload = normalize_api_payload($decoded, $date);
        } elseif (is_list_array($decoded)) {
            $payload = normalize_api_payload(array('rates' => $decoded), $date);
        }
        if ($payload !== null) {
            $source = 'cnb-api';
        }
    }
}

if ($payload === null) {
    $txtDate = date('d.m.Y', $requestedTs);
    $txtUrl = append_query($txtBase, array('date' => $txtDate));
    $txtBody = fetch_remote($txtUrl);
    if ($txtBody !== null) {
        $payload = parse_txt_payload($txtBody, $date);
        if ($payload !== null) {
            $source = 'cnb-txt';
        }
    }
}

if ($payload !== null && isset($payload['rates']) && count($payload['rates']) >= 10) {
    $payload['source'] = $source;
    $payload['requestedDate'] = $date;
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json !== false) {
        @file_put_contents($cacheFile, $json, LOCK_EX);
        header('Cache-Control: public, max-age=300, stale-while-revalidate=86400');
        header('X-RV-Rate-Source: ' . $source);
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
send_json(array('error' => 'Kurzovní lístek ČNB se nyní nepodařilo načíst.'));

function send_json($data)
{
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    echo $json !== false ? $json : '{"error":"Chyba odpovědi."}';
    exit;
}

function append_query($url, $params)
{
    return $url . (strpos($url, '?') === false ? '?' : '&')
        . http_build_query($params, '', '&');
}

/**
 * Nejprve používá PHP stream (na sdíleném hostingu bývá aktuálnější TLS vrstva),
 * potom cURL. Selhání jednoho transportu proto už nezablokuje druhý.
 */
function fetch_remote($url)
{
    $body = fetch_via_stream($url);
    if ($body !== null) {
        return $body;
    }
    return fetch_via_curl($url);
}

function fetch_via_stream($url)
{
    $allow = strtolower(trim((string) ini_get('allow_url_fopen')));
    if (!in_array($allow, array('1', 'on', 'yes', 'true'), true)) {
        return null;
    }

    $context = stream_context_create(array(
        'http' => array(
            'method' => 'GET',
            'timeout' => 12,
            'ignore_errors' => true,
            'follow_location' => 1,
            'max_redirects' => 3,
            'protocol_version' => 1.1,
            'header' => "Accept: application/json, text/plain;q=0.9\r\n"
                . "User-Agent: RychleVypocty.cz/1.1 (+https://www.rychlevypocty.cz/)\r\n"
                . "Connection: close\r\n"
        ),
        'ssl' => array(
            'verify_peer' => true,
            'verify_peer_name' => true,
            'SNI_enabled' => true
        )
    ));

    $body = @file_get_contents($url, false, $context);
    if (!is_string($body) || $body === '') {
        return null;
    }

    $status = 0;
    if (isset($http_response_header) && is_array($http_response_header)) {
        foreach ($http_response_header as $headerLine) {
            if (preg_match('#^HTTP/\S+\s+(\d{3})#i', $headerLine, $match)) {
                $status = (int) $match[1];
            }
        }
    }
    if ($status !== 0 && ($status < 200 || $status >= 300)) {
        return null;
    }
    return $body;
}

function fetch_via_curl($url)
{
    if (!function_exists('curl_init')) {
        return null;
    }

    $ch = curl_init($url);
    if ($ch === false) {
        return null;
    }

    $options = array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 3,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 12,
        CURLOPT_USERAGENT => 'RychleVypocty.cz/1.1 (+https://www.rychlevypocty.cz/)',
        CURLOPT_HTTPHEADER => array('Accept: application/json, text/plain;q=0.9'),
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2
    );
    if (defined('CURLOPT_ENCODING')) {
        $options[CURLOPT_ENCODING] = '';
    }
    if (defined('CURLOPT_IPRESOLVE') && defined('CURL_IPRESOLVE_V4')) {
        $options[CURLOPT_IPRESOLVE] = CURL_IPRESOLVE_V4;
    }
    if (defined('CURLOPT_HTTP_VERSION') && defined('CURL_HTTP_VERSION_1_1')) {
        $options[CURLOPT_HTTP_VERSION] = CURL_HTTP_VERSION_1_1;
    }

    curl_setopt_array($ch, $options);
    $body = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return is_string($body) && $body !== '' && $status >= 200 && $status < 300
        ? $body
        : null;
}

function normalize_api_payload($decoded, $requestedDate)
{
    $rates = array();
    foreach ($decoded['rates'] as $item) {
        if (!is_array($item)) {
            continue;
        }
        $code = strtoupper(trim((string) (isset($item['currencyCode']) ? $item['currencyCode'] : (isset($item['code']) ? $item['code'] : ''))));
        $amount = isset($item['amount']) ? (float) $item['amount'] : 0.0;
        $rate = isset($item['rate']) ? (float) $item['rate'] : 0.0;
        if (!preg_match('/^[A-Z]{3}$/', $code) || $amount <= 0 || $rate <= 0) {
            continue;
        }
        $validForRaw = isset($item['validFor']) ? (string) $item['validFor'] : $requestedDate;
        $validFor = normalize_iso_date($validForRaw);
        if ($validFor === null) {
            $validFor = $requestedDate;
        }
        $rates[] = array(
            'validFor' => $validFor,
            'order' => isset($item['order']) ? (int) $item['order'] : null,
            'country' => isset($item['country']) ? trim((string) $item['country']) : '',
            'currency' => isset($item['currency']) ? trim((string) $item['currency']) : $code,
            'amount' => $amount,
            'currencyCode' => $code,
            'rate' => $rate
        );
    }
    return count($rates) >= 10 ? array('rates' => $rates) : null;
}

function parse_txt_payload($body, $requestedDate)
{
    $body = preg_replace('/^\xEF\xBB\xBF/', '', $body);
    $lines = preg_split('/\r\n|\r|\n/', trim($body));
    if (!is_array($lines) || count($lines) < 3) {
        return null;
    }

    $validFor = $requestedDate;
    if (preg_match('/^(\d{2})\.(\d{2})\.(\d{4})/', trim($lines[0]), $match)) {
        $validFor = $match[3] . '-' . $match[2] . '-' . $match[1];
    }

    $rates = array();
    $count = count($lines);
    for ($i = 2; $i < $count; $i++) {
        $line = trim($lines[$i]);
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
        $rates[] = array(
            'validFor' => $validFor,
            'order' => null,
            'country' => trim($parts[0]),
            'currency' => trim($parts[1]),
            'amount' => $amount,
            'currencyCode' => $code,
            'rate' => $rate
        );
    }
    return count($rates) >= 10 ? array('rates' => $rates) : null;
}

function normalize_iso_date($value)
{
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $value, $parts)) {
        return null;
    }
    return checkdate((int) $parts[2], (int) $parts[3], (int) $parts[1]) ? $value : null;
}

function read_cache($file)
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
    return array('body' => $body, 'mtime' => (int) @filemtime($file));
}

function is_list_array($array)
{
    if (!is_array($array)) {
        return false;
    }
    $expected = 0;
    foreach ($array as $key => $unused) {
        if ($key !== $expected) {
            return false;
        }
        $expected++;
    }
    return true;
}
