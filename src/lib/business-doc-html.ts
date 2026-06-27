import { getDictionary, type Locale } from "./i18n";
import type { FormValues } from "./types";

export type BusinessDocKind = "invoice" | "quotation" | "receipt";

interface LineItem {
  description: string;
  qty: number;
  price: number;
  total: number;
}

interface MetaField {
  label: string;
  field: string;
  format?: "date";
}

interface FooterLine {
  label: string;
  field: string;
}

interface BusinessDocConfig {
  title: string;
  numberField: string;
  metaLeft: MetaField[];
  footerTitle: string;
  footerLines: FooterLine[];
}

const NUMBER_FIELDS: Record<BusinessDocKind, string> = {
  invoice: "invoiceNumber",
  quotation: "quotationNumber",
  receipt: "receiptNumber",
};

function getDocConfig(kind: BusinessDocKind, locale: Locale): BusinessDocConfig {
  const strings = getDictionary(locale).templates.businessDoc[kind];
  return {
    title: strings.title,
    numberField: NUMBER_FIELDS[kind],
    metaLeft: strings.metaLeft,
    footerTitle: strings.footerTitle,
    footerLines: strings.footerLines,
  };
}

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

function parseMoney(str: string): number {
  return parseFloat(str.replace(/[^0-9.-]/g, "")) || 0;
}

function formatMoney(amount: number, locale: Locale): string {
  const formatted = Math.round(amount).toLocaleString(locale === "el" ? "el-GR" : "en-US");
  return locale === "el" ? `${formatted} €` : `$${formatted}`;
}

function formatDate(dateStr: string, locale: Locale): string {
  if (!dateStr) return "—";
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(locale === "el" ? "el-GR" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatFieldValue(values: FormValues, field: MetaField, locale: Locale): string {
  const raw = val(values, field.field);
  if (!raw) return "—";
  return field.format === "date" ? formatDate(raw, locale) : raw;
}

function parseLineItems(text: string): LineItem[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((part) => part.trim());
      const description = parts[0] ?? "";
      const qty = parseFloat(parts[1] ?? "1") || 1;
      const price = parseMoney(parts[2] ?? "0");
      return { description, qty, price, total: qty * price };
    });
}

function itemRow(item: LineItem, locale: Locale): string {
  return `
    <tr>
      <td class="desc">${escapeHtml(item.description)}</td>
      <td class="num">${escapeHtml(String(item.qty))}</td>
      <td class="num">${escapeHtml(formatMoney(item.price, locale))}</td>
      <td class="num">${escapeHtml(formatMoney(item.total, locale))}</td>
    </tr>
  `;
}

function footerLineHtml(label: string, value: string, multiline = false): string {
  if (multiline && value.includes("\n")) {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `<span class="footer-line">${escapeHtml(line)}</span>`)
      .join("");
  }

  return `<span class="footer-line">${escapeHtml(label)}: ${escapeHtml(value || "—")}</span>`;
}

export function buildBusinessDocHtml(
  kind: BusinessDocKind,
  values: FormValues,
  locale: Locale = "en"
): string {
  const config = getDocConfig(kind, locale);
  const labels = getDictionary(locale).templates.businessDoc;
  const items = parseLineItems(val(values, "items"));
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxRate = parseFloat(val(values, "taxRate") || "10") || 0;
  const tax = subtotal * (taxRate / 100);
  const grandTotal = subtotal + tax;

  const itemRows =
    items.length > 0
      ? items.map((item) => itemRow(item, locale)).join("")
      : `
        <tr>
          <td class="desc empty" colspan="4">—</td>
        </tr>
      `;

  const contactLines = [
    val(values, "email"),
    val(values, "phone"),
    val(values, "socialHandle"),
  ].filter(Boolean);

  const metaLeftHtml = config.metaLeft
    .map(
      (field) => `
        <span class="meta-label">${escapeHtml(field.label)}</span>
        <span class="meta-value">${escapeHtml(formatFieldValue(values, field, locale))}</span>
      `
    )
    .join("");

  const footerHtml = config.footerLines
    .map((line) => {
      const value = val(values, line.field);
      if (kind === "quotation" && line.field === "terms") {
        return footerLineHtml(line.label, value, true);
      }
      if (kind === "receipt" && line.field === "amountPaid" && !value && grandTotal > 0) {
        return footerLineHtml(line.label, formatMoney(grandTotal, locale));
      }
      return footerLineHtml(line.label, value);
    })
    .join("");

  return `
    <style>
      .business-doc {
        width: 794px;
        padding: 40px 44px;
        background: #fff;
        color: #111;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 12px;
        line-height: 1.5;
        box-sizing: border-box;
        border: 1px solid #d4d4d4;
        border-radius: 8px;
      }
      .business-doc * { box-sizing: border-box; }
      .business-doc .top-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 28px;
      }
      .business-doc .title {
        font-size: 42px;
        font-weight: 700;
        letter-spacing: 0.02em;
        line-height: 1;
      }
      .business-doc .number-box {
        border: 2px solid #111;
        padding: 10px 18px;
        font-size: 28px;
        font-weight: 700;
        min-width: 120px;
        text-align: center;
      }
      .business-doc .meta-row {
        display: flex;
        justify-content: space-between;
        gap: 32px;
        margin-bottom: 36px;
      }
      .business-doc .meta-block {
        flex: 1;
      }
      .business-doc .meta-block.right {
        text-align: right;
      }
      .business-doc .meta-label {
        display: block;
        font-weight: 700;
        margin-bottom: 2px;
      }
      .business-doc .meta-value {
        display: block;
        margin-bottom: 10px;
      }
      .business-doc .contact-line {
        display: block;
        margin-bottom: 2px;
      }
      .business-doc .items-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 36px;
      }
      .business-doc .items-table th,
      .business-doc .items-table td {
        border: 1px solid #bdbdbd;
        padding: 10px 12px;
      }
      .business-doc .items-table thead th {
        background: #111;
        color: #fff;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: 11px;
      }
      .business-doc .items-table .desc {
        width: 58%;
        text-align: left;
      }
      .business-doc .items-table .num {
        width: 14%;
        text-align: center;
      }
      .business-doc .items-table .summary-label {
        text-align: center;
        font-weight: 400;
        text-transform: uppercase;
      }
      .business-doc .items-table .summary-value {
        text-align: center;
        font-weight: 400;
        border-left: none;
      }
      .business-doc .items-table .summary-label.bold,
      .business-doc .items-table .summary-value.bold {
        font-weight: 700;
      }
      .business-doc .items-table .empty {
        color: #666;
        text-align: center;
      }
      .business-doc .footer-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 24px;
      }
      .business-doc .footer-info .meta-label {
        margin-bottom: 8px;
      }
      .business-doc .footer-line {
        display: block;
        margin-bottom: 2px;
      }
      .business-doc .thank-you {
        text-align: right;
        color: #c8c8c8;
        font-size: 34px;
        font-weight: 700;
        line-height: 0.95;
        letter-spacing: 0.02em;
      }
    </style>
    <div class="business-doc">
      <div class="top-row">
        <div class="title">${escapeHtml(config.title)}</div>
        <div class="number-box">${escapeHtml(val(values, config.numberField) || "—")}</div>
      </div>

      <div class="meta-row">
        <div class="meta-block">
          ${metaLeftHtml}
        </div>
        <div class="meta-block right">
          <span class="meta-label">${escapeHtml(labels.contactInfo)}</span>
          ${
            contactLines.length > 0
              ? contactLines
                  .map((line) => `<span class="contact-line">${escapeHtml(line)}</span>`)
                  .join("")
              : `<span class="contact-line">—</span>`
          }
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th class="desc">${escapeHtml(labels.description)}</th>
            <th class="num">${escapeHtml(labels.qty)}</th>
            <th class="num">${escapeHtml(labels.price)}</th>
            <th class="num">${escapeHtml(labels.total)}</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
          <tr>
            <td class="desc" style="border-bottom: none;"></td>
            <td class="summary-label">${escapeHtml(labels.subtotal)}</td>
            <td class="num" style="border-left: none;"></td>
            <td class="summary-value">${escapeHtml(formatMoney(subtotal, locale))}</td>
          </tr>
          <tr>
            <td class="desc" style="border-bottom: none;"></td>
            <td class="summary-label">${escapeHtml(labels.tax)} (${escapeHtml(String(taxRate))}%)</td>
            <td class="num" style="border-left: none;"></td>
            <td class="summary-value">${escapeHtml(formatMoney(tax, locale))}</td>
          </tr>
          <tr>
            <td class="desc" style="border-bottom: none;"></td>
            <td class="summary-label bold">${escapeHtml(labels.grandTotal)}</td>
            <td class="num" style="border-left: none;"></td>
            <td class="summary-value bold">${escapeHtml(formatMoney(grandTotal, locale))}</td>
          </tr>
        </tbody>
      </table>

      <div class="footer-row">
        <div class="footer-info">
          <span class="meta-label">${escapeHtml(config.footerTitle)}</span>
          ${footerHtml}
        </div>
        <div class="thank-you">
          ${labels.thankYou.replace(/\n/g, "<br />")}
        </div>
      </div>
    </div>
  `;
}

export function buildInvoiceHtml(values: FormValues, locale: Locale = "en"): string {
  return buildBusinessDocHtml("invoice", values, locale);
}

export function buildQuotationHtml(values: FormValues, locale: Locale = "en"): string {
  return buildBusinessDocHtml("quotation", values, locale);
}

export function buildReceiptHtml(values: FormValues, locale: Locale = "en"): string {
  return buildBusinessDocHtml("receipt", values, locale);
}
