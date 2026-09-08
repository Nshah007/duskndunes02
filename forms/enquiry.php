<?php
/**
 * DUSK N DUNES - Thar Desert Camp
 * Enquiry form handler
 *
 * Receives the booking enquiry form (index.html / contact.html / tour-packages.html
 * etc.), validates and sanitizes the input, blocks basic spam, and emails the
 * reservations team.
 *
 * IMPORTANT - CONFIGURE BEFORE GOING LIVE:
 *   1. Set $to_email below (already set to corbett@delightstay.co.in as required).
 *   2. Set $from_email to an address on YOUR domain (e.g. noreply@dusknddunes.com).
 *      Most shared hosts reject mail where the From address is not on the sending
 *      domain, so do not use the visitor's email as the From address - it is used
 *      only as Reply-To.
 *   3. Confirm PHP's mail() is enabled on your hosting, or replace the mail()
 *      call below with your host's SMTP details (see README.txt).
 */

header('Content-Type: application/json');

// ---------- Basic request checks ----------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

// ---------- Configuration ----------
$to_email   = 'corbett@delightstay.co.in';           // Required recipient - do not change without instruction
$from_email = 'noreply@dusknddunes.com';             // Replace with your live domain email
$site_name  = 'Dusk N Dunes - Thar Desert Camp';

// ---------- Honeypot spam trap ----------
// The form includes a hidden field named "website" that real visitors never fill in.
if (!empty($_POST['website'])) {
    // Silently pretend success so bots move on, without actually sending mail.
    echo json_encode(['success' => true]);
    exit;
}

// ---------- Helpers ----------
function clean_input($value)
{
    $value = trim($value ?? '');
    $value = stripslashes($value);
    // Strip tags and any characters that could be used for header injection.
    $value = strip_tags($value);
    $value = str_replace(["\r", "\n", "%0a", "%0d"], '', $value);
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function is_valid_email($email)
{
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function is_valid_mobile($mobile)
{
    $digits = preg_replace('/[\s\-]/', '', $mobile);
    return (bool) preg_match('/^\+?[0-9]{10,13}$/', $digits);
}

// ---------- Collect + sanitize fields ----------
$name        = clean_input($_POST['name'] ?? '');
$mobile      = clean_input($_POST['mobile'] ?? '');
$email       = clean_input($_POST['email'] ?? '');
$checkin     = clean_input($_POST['checkin'] ?? '');
$checkout    = clean_input($_POST['checkout'] ?? '');
$adults      = clean_input($_POST['adults'] ?? '');
$children    = clean_input($_POST['children'] ?? '');
$accommodation = clean_input($_POST['accommodation'] ?? '');
$experience  = clean_input($_POST['experience'] ?? '');
$message     = clean_input($_POST['message'] ?? '');

// ---------- Server-side validation ----------
$errors = [];

if ($name === '' || mb_strlen($name) < 2) {
    $errors[] = 'Please enter a valid name.';
}

if ($mobile === '' || !is_valid_mobile($mobile)) {
    $errors[] = 'Please enter a valid mobile number.';
}

if ($email !== '' && !is_valid_email($email)) {
    $errors[] = 'Please enter a valid email address.';
}

if ($checkin !== '' && $checkout !== '') {
    $inDate  = DateTime::createFromFormat('Y-m-d', $checkin);
    $outDate = DateTime::createFromFormat('Y-m-d', $checkout);
    if ($inDate && $outDate && $outDate <= $inDate) {
        $errors[] = 'Check-out date must be after check-in date.';
    }
}

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

// ---------- Basic rate limiting (session-based) ----------
session_start();
$now = time();
if (isset($_SESSION['last_enquiry_time']) && ($now - $_SESSION['last_enquiry_time']) < 20) {
    echo json_encode([
        'success' => false,
        'message' => 'Please wait a few seconds before submitting another enquiry.'
    ]);
    exit;
}

// ---------- Build email ----------
$subject = "New Dusk N Dunes Website Enquiry - {$name}";

$body  = "You have received a new enquiry from the Dusk N Dunes website.\n\n";
$body .= "Name: {$name}\n";
$body .= "Mobile: {$mobile}\n";
$body .= "Email: " . ($email !== '' ? $email : '-') . "\n";
$body .= "Check-in: " . ($checkin !== '' ? $checkin : '-') . "\n";
$body .= "Check-out: " . ($checkout !== '' ? $checkout : '-') . "\n";
$body .= "Adults: " . ($adults !== '' ? $adults : '-') . "\n";
$body .= "Children: " . ($children !== '' ? $children : '-') . "\n";
$body .= "Accommodation Preference: " . ($accommodation !== '' ? $accommodation : '-') . "\n";
$body .= "Experience / Activity / Package: " . ($experience !== '' ? $experience : '-') . "\n";
$body .= "Message:\n" . ($message !== '' ? $message : '-') . "\n\n";
$body .= "-- \nSubmitted from: " . ($_SERVER['HTTP_HOST'] ?? $site_name) . "\n";
$body .= "Date/Time: " . date('d-M-Y H:i:s') . "\n";

$headers   = [];
$headers[] = "From: {$site_name} <{$from_email}>";
if ($email !== '' && is_valid_email($email)) {
    $headers[] = "Reply-To: {$email}";
}
$headers[] = "MIME-Version: 1.0";
$headers[] = "Content-Type: text/plain; charset=UTF-8";
$headers[] = "X-Mailer: PHP/" . phpversion();

$mail_sent = @mail($to_email, $subject, $body, implode("\r\n", $headers));

if ($mail_sent) {
    $_SESSION['last_enquiry_time'] = $now;
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Your enquiry could not be sent automatically. Please call or WhatsApp us directly.'
    ]);
}
