<?php
/**
 * Recibe las solicitudes del formulario de valorización y las envía por correo.
 * Provisorio hasta que exista el agente de respuesta (n8n): entonces basta con
 * apuntar PUBLIC_LEADS_ENDPOINT al webhook nuevo.
 *
 * Además del correo, guarda cada solicitud en un CSV fuera de public_html,
 * para no perder datos si el correo falla.
 */

declare(strict_types=1);

const RECIPIENT = 'andres@activacorredores.cl';
const MAIL_FROM = 'Sitio web Activa <no-responder@activacorredores.cl>';
const ALLOWED_ORIGINS = ['https://activacorredores.cl', 'https://www.activacorredores.cl'];
const COMUNAS = ['La Florida', 'Macul', 'Peñalolén', 'La Reina', 'Otra comuna'];
const TIPOS = ['casa' => 'Casa', 'departamento' => 'Departamento'];
const OPERACIONES = ['vender' => 'Vender', 'arrendar' => 'Arrendar', 'administrar' => 'Administración'];
const MAX_BODY_BYTES = 4096;
const RATE_PER_IP_HOUR = 5;
const RATE_GLOBAL_DAY = 60;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

function clean_line(string $value, int $max): string
{
    // Sin saltos de línea ni caracteres de control (evita inyección en el correo)
    $value = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $value) ?? '';
    $value = trim(preg_replace('/\s+/u', ' ', $value) ?? '');
    return mb_substr($value, 0, $max);
}

/** Carpeta privada para registros: junto a public_html, nunca dentro. */
function data_dir(): string
{
    $preferred = dirname(__DIR__, 2) . '/activa-leads';
    if (is_dir($preferred) || @mkdir($preferred, 0700, true)) {
        if (is_writable($preferred)) {
            return $preferred;
        }
    }
    $fallback = sys_get_temp_dir() . '/activa-leads';
    if (!is_dir($fallback)) {
        @mkdir($fallback, 0700, true);
    }
    return $fallback;
}

/** Devuelve false si se superó el límite. Registra el intento si se permite. */
function rate_limit_ok(string $dir, string $ip): bool
{
    $file = $dir . '/rate.json';
    $fh = @fopen($file, 'c+');
    if ($fh === false) {
        return true; // sin almacenamiento no bloqueamos a personas reales
    }
    flock($fh, LOCK_EX);
    $raw = stream_get_contents($fh);
    $data = json_decode($raw ?: '{}', true);
    if (!is_array($data)) {
        $data = [];
    }

    $now = time();
    $key = hash('sha256', $ip);
    $ipHits = array_values(array_filter($data['ip'][$key] ?? [], fn ($t) => $now - $t < 3600));
    $allHits = array_values(array_filter($data['all'] ?? [], fn ($t) => $now - $t < 86400));

    $ok = count($ipHits) < RATE_PER_IP_HOUR && count($allHits) < RATE_GLOBAL_DAY;
    if ($ok) {
        $ipHits[] = $now;
        $allHits[] = $now;
    }

    // Limpia IPs sin actividad reciente
    $ips = [];
    foreach ($data['ip'] ?? [] as $k => $hits) {
        $recent = array_values(array_filter($hits, fn ($t) => $now - $t < 3600));
        if ($recent) {
            $ips[$k] = $recent;
        }
    }
    $ips[$key] = $ipHits;

    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode(['ip' => $ips, 'all' => $allHits]));
    fflush($fh);
    flock($fh, LOCK_UN);
    fclose($fh);
    return $ok;
}

// ---------- Solicitud ----------

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, ['ok' => false, 'error' => 'method']);
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && !in_array($origin, ALLOWED_ORIGINS, true)) {
    respond(403, ['ok' => false, 'error' => 'origin']);
}

$raw = file_get_contents('php://input', false, null, 0, MAX_BODY_BYTES + 1);
if ($raw === false || strlen($raw) > MAX_BODY_BYTES) {
    respond(413, ['ok' => false, 'error' => 'size']);
}
$in = json_decode($raw, true);
if (!is_array($in)) {
    respond(400, ['ok' => false, 'error' => 'json']);
}

// Campo trampa: los robots lo llenan. Respondemos éxito sin hacer nada.
if (!empty($in['empresa'])) {
    respond(200, ['ok' => true]);
}

$comuna = clean_line((string) ($in['comuna'] ?? ''), 40);
$tipo = (string) ($in['tipo'] ?? '');
$operacion = (string) ($in['operacion'] ?? '');
$nombre = clean_line((string) ($in['nombre'] ?? ''), 80);
$whatsapp = (string) ($in['whatsapp'] ?? '');
$email = clean_line((string) ($in['email'] ?? ''), 120);
$origen = clean_line((string) ($in['origen'] ?? ''), 60);

$errors = [];
if (!in_array($comuna, COMUNAS, true)) $errors[] = 'comuna';
if (!array_key_exists($tipo, TIPOS)) $errors[] = 'tipo';
if (!array_key_exists($operacion, OPERACIONES)) $errors[] = 'operacion';
if (mb_strlen($nombre) < 2) $errors[] = 'nombre';
if (!preg_match('/^\+569\d{8}$/', $whatsapp)) $errors[] = 'whatsapp';
if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) === false) $errors[] = 'email';
if ($errors) {
    respond(422, ['ok' => false, 'error' => 'invalid', 'fields' => $errors]);
}

$utm = [];
foreach ($in as $k => $v) {
    if (is_string($k) && str_starts_with($k, 'utm_') && is_string($v) && preg_match('/^utm_[a-z_]{1,20}$/', $k)) {
        $utm[$k] = clean_line($v, 100);
    }
}

$dir = data_dir();
if (!rate_limit_ok($dir, $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0')) {
    respond(429, ['ok' => false, 'error' => 'rate']);
}

// ---------- Registro y correo ----------

$fecha = (new DateTimeImmutable('now', new DateTimeZone('America/Santiago')))->format('Y-m-d H:i');
$tipoLabel = TIPOS[$tipo];
$opLabel = OPERACIONES[$operacion];
$waLink = 'https://wa.me/' . ltrim($whatsapp, '+');

$csv = $dir . '/leads.csv';
$isNew = !file_exists($csv);
$saved = false;
if ($fh = @fopen($csv, 'a')) {
    flock($fh, LOCK_EX);
    if ($isNew) {
        fputcsv($fh, ['fecha', 'operacion', 'tipo', 'comuna', 'nombre', 'whatsapp', 'email', 'origen', 'utm'], ',', '"', '');
    }
    $saved = fputcsv($fh, [$fecha, $operacion, $tipo, $comuna, $nombre, $whatsapp, $email, $origen, http_build_query($utm)], ',', '"', '') !== false;
    flock($fh, LOCK_UN);
    fclose($fh);
}

$subject = "Nuevo lead: {$opLabel} {$tipoLabel} en {$comuna} – {$nombre}";
$lines = [
    "Nueva solicitud de Valorización 360° desde el sitio web.",
    '',
    "Operación: {$opLabel}",
    "Propiedad: {$tipoLabel} en {$comuna}",
    "Nombre:    {$nombre}",
    "WhatsApp:  {$whatsapp}",
    "Escribirle: {$waLink}",
    'Correo:    ' . ($email !== '' ? $email : '(no indicó)'),
    '',
    "Fecha:     {$fecha}",
    'Página:    ' . ($origen !== '' ? $origen : '-'),
];
foreach ($utm as $k => $v) {
    $lines[] = str_pad($k . ':', 11) . $v;
}

$headers = [
    'From: ' . MAIL_FROM,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'MIME-Version: 1.0',
];
if ($email !== '') {
    $headers[] = 'Reply-To: ' . $email;
}

$sent = mail(
    RECIPIENT,
    '=?UTF-8?B?' . base64_encode($subject) . '?=',
    implode("\r\n", $lines),
    implode("\r\n", $headers)
);

if (!$sent) {
    error_log('[activa-leads] mail() falló' . ($saved ? '; la solicitud quedó en leads.csv' : ' y no se pudo guardar'));
}

// Si no hubo correo ni registro, el formulario ofrece continuar por WhatsApp.
if (!$sent && !$saved) {
    respond(500, ['ok' => false, 'error' => 'store']);
}
respond(200, ['ok' => true]);
