import type { FormValues } from "./types";

function val(values: FormValues, key: string): string {
  return values[key]?.trim() ?? "";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function defaultBody(course: string): string {
  if (course) {
    return `This certificate is proudly presented in recognition of successful completion of ${course}.`;
  }
  return "You can write your text here. Click here to edit this paragraph. You can write your text here.";
}

function resolveBody(values: FormValues): string {
  const body = val(values, "body");
  if (body) return body;
  return defaultBody(val(values, "course"));
}

function medalSvg(): string {
  return `
    <svg class="medal" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f5d76e"/>
          <stop offset="45%" stop-color="#d4af37"/>
          <stop offset="100%" stop-color="#b8860b"/>
        </linearGradient>
        <linearGradient id="ribbon" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#e8c547"/>
          <stop offset="100%" stop-color="#c9a227"/>
        </linearGradient>
      </defs>
      <path d="M38 108 L48 128 L60 118 L72 128 L82 108 Z" fill="url(#ribbon)"/>
      <path d="M44 108 L52 124 L60 116 L68 124 L76 108 Z" fill="#a67c00"/>
      <circle cx="60" cy="58" r="46" fill="url(#gold)" stroke="#a67c00" stroke-width="2"/>
      <circle cx="60" cy="58" r="38" fill="none" stroke="#c9a227" stroke-width="1.5"/>
      <path d="M60 30 L64 46 L81 46 L68 56 L73 72 L60 62 L47 72 L52 56 L39 46 L56 46 Z" fill="#2c3e50"/>
      <path d="M28 58 C28 42 38 30 52 26 C48 38 44 50 42 62 C36 60 32 58 28 58Z" fill="none" stroke="#a67c00" stroke-width="2"/>
      <path d="M92 58 C92 42 82 30 68 26 C72 38 76 50 78 62 C84 60 88 58 92 58Z" fill="none" stroke="#a67c00" stroke-width="2"/>
      <path d="M32 72 C24 78 20 86 22 94 C30 88 38 84 44 80 C38 76 34 74 32 72Z" fill="none" stroke="#a67c00" stroke-width="2"/>
      <path d="M88 72 C96 78 100 86 98 94 C90 88 82 84 76 80 C82 76 86 74 88 72Z" fill="none" stroke="#a67c00" stroke-width="2"/>
    </svg>
  `;
}

export function buildCertificateHtml(values: FormValues): string {
  const recipient = val(values, "recipient") || "Enter Name Here";
  const body = resolveBody(values);
  const date = formatDate(val(values, "date"));
  const instructor = val(values, "instructor");

  return `
    <style>
      .certificate-doc {
        position: relative;
        width: 1123px;
        height: 794px;
        background: #fff;
        overflow: hidden;
        font-family: "Segoe UI", Arial, Helvetica, sans-serif;
        color: #333;
        box-sizing: border-box;
        border: 1px solid #d4d4d4;
        border-radius: 4px;
      }
      .certificate-doc * { box-sizing: border-box; }
      .certificate-doc .gold-bar {
        position: absolute;
        left: 0;
        right: 0;
        height: 6px;
        background: linear-gradient(90deg, #b8860b 0%, #f5d76e 25%, #d4af37 50%, #f5d76e 75%, #b8860b 100%);
        z-index: 2;
      }
      .certificate-doc .gold-bar.top { top: 0; }
      .certificate-doc .gold-bar.bottom { bottom: 0; }
      .certificate-doc .navy-accent {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 42%;
        background: #1e3a5f;
        clip-path: polygon(0 0, 72% 0, 38% 100%, 0 100%);
        z-index: 0;
      }
      .certificate-doc .medal-wrap {
        position: absolute;
        left: 210px;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 3;
        width: 110px;
      }
      .certificate-doc .medal {
        width: 100%;
        height: auto;
        display: block;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.25));
      }
      .certificate-doc .content {
        position: absolute;
        left: 0;
        right: 0;
        top: 6px;
        bottom: 6px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 80px 56px 360px;
        text-align: center;
        z-index: 1;
      }
      .certificate-doc .header-lines {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        width: 100%;
        max-width: 520px;
        margin-top: 8px;
      }
      .certificate-doc .header-lines .line-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
        max-width: 100px;
      }
      .certificate-doc .header-lines .line-group.right {
        align-items: flex-end;
      }
      .certificate-doc .header-lines .line {
        display: block;
        height: 1px;
        width: 100%;
        background: #999;
      }
      .certificate-doc .title-block {
        flex-shrink: 0;
        text-align: center;
      }
      .certificate-doc .title-main {
        font-size: 52px;
        font-weight: 700;
        letter-spacing: 0.14em;
        color: #3d3d3d;
        line-height: 1;
        margin: 0;
      }
      .certificate-doc .title-sub {
        font-size: 15px;
        font-weight: 400;
        letter-spacing: 0.35em;
        color: #555;
        margin: 0;
        white-space: nowrap;
      }
      .certificate-doc .recipient {
        font-size: 48px;
        font-weight: 400;
        color: #1e3a5f;
        margin: 36px 0 24px;
        line-height: 1.2;
        max-width: 100%;
        word-wrap: break-word;
      }
      .certificate-doc .body-text {
        font-size: 14px;
        line-height: 1.7;
        color: #555;
        max-width: 520px;
        margin: 0 auto;
      }
      .certificate-doc .footer {
        display: flex;
        justify-content: space-between;
        width: 100%;
        max-width: 520px;
        margin-top: 48px;
        gap: 48px;
      }
      .certificate-doc .footer-item {
        flex: 1;
        text-align: center;
      }
      .certificate-doc .footer-line {
        border-top: 1px solid #999;
        margin-bottom: 8px;
        min-height: 1px;
      }
      .certificate-doc .footer-value {
        font-size: 13px;
        color: #444;
        margin-bottom: 4px;
        min-height: 18px;
      }
      .certificate-doc .footer-label {
        font-size: 11px;
        letter-spacing: 0.2em;
        color: #666;
        text-transform: uppercase;
      }
    </style>
    <div class="certificate-doc">
      <div class="gold-bar top"></div>
      <div class="gold-bar bottom"></div>
      <div class="navy-accent"></div>
      <div class="medal-wrap">${medalSvg()}</div>
      <div class="content">
        <div class="title-block">
          <h1 class="title-main">CERTIFICATE</h1>
        </div>
        <div class="header-lines">
          <div class="line-group">
            <span class="line"></span>
            <span class="line"></span>
          </div>
          <p class="title-sub">OF ACHIEVEMENT</p>
          <div class="line-group right">
            <span class="line"></span>
            <span class="line"></span>
          </div>
        </div>
        <div class="recipient">${escapeHtml(recipient)}</div>
        <p class="body-text">${escapeHtml(body)}</p>
        <div class="footer">
          <div class="footer-item">
            <div class="footer-line"></div>
            <div class="footer-value">${escapeHtml(date)}</div>
            <div class="footer-label">Date</div>
          </div>
          <div class="footer-item">
            <div class="footer-line"></div>
            <div class="footer-value">${escapeHtml(instructor)}</div>
            <div class="footer-label">Signature</div>
          </div>
        </div>
      </div>
    </div>
  `;
}
