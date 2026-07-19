'use strict';

// =============================================================================
// Technical Labs Website — Booking Mail Relay
// =============================================================================
// A tiny zero-framework HTTP service that receives the "Schedule a Session"
// booking form (POST /api/schedule) and delivers it as an email via SMTP.
// All configuration is supplied through environment variables (see .env.example).
// =============================================================================

const http = require('http');
const nodemailer = require('nodemailer');

const PORT = parseInt(process.env.PORT || '3001', 10);

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
const MAIL_TO = process.env.MAIL_TO || 'xphox@xphox.net';
const MAIL_FROM = process.env.MAIL_FROM || 'Technical Labs Website <noreply@technicallabs.org>';

// Reusable SMTP transport. `secure: true` is for implicit TLS on port 465;
// port 587 uses STARTTLS (secure: false) which nodemailer upgrades automatically.
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

// --- Small helpers ----------------------------------------------------------

const MAX_BODY_BYTES = 16 * 1024; // Reject anything larger than 16 KB
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TOPIC_LABELS = {
  firewalls_networking: 'Firewalls & Networking',
  datacentre_infra: 'Data Centre & Infrastructure',
  automation: 'System & Process Automation',
  development: 'Custom Development',
};

// Naive in-memory, per-IP rate limiter: max 5 submissions per 10 minutes.
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
const rateHits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const hits = (rateHits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX) {
    rateHits.set(ip, hits);
    return true;
  }
  hits.push(now);
  rateHits.set(ip, hits);
  return false;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clamp(str, max) {
  const s = String(str == null ? '' : str).trim();
  return s.length > max ? s.slice(0, max) : s;
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

// --- Request handling -------------------------------------------------------

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('payload_too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function handleSchedule(req, res) {
  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return sendJson(res, 429, { ok: false, error: 'Too many requests. Please try again later.' });
  }

  let raw;
  try {
    raw = await readBody(req);
  } catch (err) {
    return sendJson(res, 413, { ok: false, error: 'Payload too large.' });
  }

  let data;
  try {
    data = JSON.parse(raw || '{}');
  } catch (err) {
    return sendJson(res, 400, { ok: false, error: 'Invalid JSON body.' });
  }

  const name = clamp(data.name, 200);
  const email = clamp(data.email, 320);
  const topicKey = clamp(data.topic, 40);
  const notes = clamp(data.notes, 4000);
  const topic = TOPIC_LABELS[topicKey] || (topicKey ? topicKey : 'Unspecified');

  if (!name || !email) {
    return sendJson(res, 400, { ok: false, error: 'Name and email are required.' });
  }
  if (!EMAIL_RE.test(email)) {
    return sendJson(res, 400, { ok: false, error: 'A valid email address is required.' });
  }

  const textBody =
    `New mentorship booking request from the Technical Labs website:\n\n` +
    `- Name: ${name}\n` +
    `- Contact Email: ${email}\n` +
    `- Service Topic: ${topic}\n\n` +
    `Project Notes:\n${notes || 'None'}\n`;

  const htmlBody =
    `<h2 style="margin:0 0 12px">New mentorship booking request</h2>` +
    `<table style="border-collapse:collapse;font-family:system-ui,Arial,sans-serif">` +
    `<tr><td style="padding:4px 12px 4px 0"><strong>Name</strong></td><td>${escapeHtml(name)}</td></tr>` +
    `<tr><td style="padding:4px 12px 4px 0"><strong>Contact Email</strong></td>` +
    `<td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>` +
    `<tr><td style="padding:4px 12px 4px 0"><strong>Service Topic</strong></td><td>${escapeHtml(topic)}</td></tr>` +
    `</table>` +
    `<p style="font-family:system-ui,Arial,sans-serif"><strong>Project Notes:</strong><br>` +
    `${escapeHtml(notes || 'None').replace(/\n/g, '<br>')}</p>`;

  try {
    await transporter.sendMail({
      from: MAIL_FROM,
      to: MAIL_TO,
      replyTo: `${name} <${email}>`,
      subject: `Mentorship Booking: ${topic}`,
      text: textBody,
      html: htmlBody,
    });
  } catch (err) {
    console.error(`[mailer] send failed for ${email}:`, err.message);
    return sendJson(res, 502, { ok: false, error: 'Unable to send your request right now.' });
  }

  console.log(`[mailer] booking sent from ${email} (topic: ${topic})`);
  return sendJson(res, 200, { ok: true });
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && (req.url === '/health' || req.url === '/api/schedule/health')) {
    return sendJson(res, 200, { ok: true, service: 'technical-labs-mailer' });
  }
  if (req.method === 'POST' && req.url === '/api/schedule') {
    return handleSchedule(req, res);
  }
  return sendJson(res, 404, { ok: false, error: 'Not found.' });
});

server.listen(PORT, () => {
  console.log(`[mailer] listening on :${PORT} — relaying to ${MAIL_TO} via ${SMTP_HOST || '(SMTP host not set!)'}:${SMTP_PORT}`);
});
