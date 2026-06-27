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

const DOC_CONFIG: Record<BusinessDocKind, BusinessDocConfig> = {
  invoice: {
    title: "INVOICE",
    numberField: "invoiceNumber",
    metaLeft: [
      { label: "Date Issued:", field: "date", format: "date" },
      { label: "Issued to:", field: "client" },
    ],
    footerTitle: "Payment Info:",
    footerLines: [
      { label: "Bank Name", field: "bankName" },
      { label: "Account No", field: "accountNo" },
      { label: "Account Name", field: "accountName" },
    ],
  },
  quotation: {
    title: "QUOTATION",
    numberField: "quotationNumber",
    metaLeft: [
      { label: "Date Issued:", field: "date", format: "date" },
      { label: "Valid Until:", field: "validUntil", format: "date" },
      { label: "Quoted to:", field: "client" },
    ],
    footerTitle: "Terms & Notes:",
    footerLines: [{ label: "Notes", field: "terms" }],
  },
  receipt: {
    title: "RECEIPT",
    numberField: "receiptNumber",
    metaLeft: [
      { label: "Date Issued:", field: "date", format: "date" },
      { label: "Received from:", field: "client" },
    ],
    footerTitle: "Payment Info:",
    footerLines: [
      { label: "Payment Method", field: "paymentMethod" },
      { label: "Reference No", field: "paymentReference" },
      { label: "Amount Paid", field: "amountPaid" },
    ],
  },
};

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

function formatMoney(amount: number): string {
  return `$${Math.round(amount).toLocaleString("en-US")}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatFieldValue(values: FormValues, field: MetaField): string {
  const raw = val(values, field.field);
  if (!raw) return "—";
  return field.format === "date" ? formatDate(raw) : raw;
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

function itemRow(item: LineItem): string {
  return `
    <tr>
      <td class="desc">${escapeHtml(item.description)}</td>
      <td class="num">${escapeHtml(String(item.qty))}</td>
      <td class="num">${escapeHtml(formatMoney(item.price))}</td>
      <td class="num">${escapeHtml(formatMoney(item.total))}</td>
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

export function buildBusinessDocHtml(kind: BusinessDocKind, values: FormValues): string {
  const config = DOC_CONFIG[kind];
  const items = parseLineItems(val(values, "items"));
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxRate = parseFloat(val(values, "taxRate") || "10") || 0;
  const tax = subtotal * (taxRate / 100);
  const grandTotal = subtotal + tax;

  const itemRows =
    items.length > 0
      ? items.map(itemRow).join("")
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
        <span class="meta-value">${escapeHtml(formatFieldValue(values, field))}</span>
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
        return footerLineHtml(line.label, formatMoney(grandTotal));
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
          <span class="meta-label">Contact Info:</span>
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
            <th class="desc">Description</th>
            <th class="num">Qty</th>
            <th class="num">Price</th>
            <th class="num">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
          <tr>
            <td class="desc" style="border-bottom: none;"></td>
            <td class="summary-label">Subtotal</td>
            <td class="num" style="border-left: none;"></td>
            <td class="summary-value">${escapeHtml(formatMoney(subtotal))}</td>
          </tr>
          <tr>
            <td class="desc" style="border-bottom: none;"></td>
            <td class="summary-label">Tax (${escapeHtml(String(taxRate))}%)</td>
            <td class="num" style="border-left: none;"></td>
            <td class="summary-value">${escapeHtml(formatMoney(tax))}</td>
          </tr>
          <tr>
            <td class="desc" style="border-bottom: none;"></td>
            <td class="summary-label bold">Grand Total</td>
            <td class="num" style="border-left: none;"></td>
            <td class="summary-value bold">${escapeHtml(formatMoney(grandTotal))}</td>
          </tr>
        </tbody>
      </table>

      <div class="footer-row">
        <div class="footer-info">
          <span class="meta-label">${escapeHtml(config.footerTitle)}</span>
          ${footerHtml}
        </div>
        <div class="thank-you">
          THANK<br />YOU
        </div>
      </div>
    </div>
  `;
}

export function buildInvoiceHtml(values: FormValues): string {
  return buildBusinessDocHtml("invoice", values);
}

export function buildQuotationHtml(values: FormValues): string {
  return buildBusinessDocHtml("quotation", values);
}

export function buildReceiptHtml(values: FormValues): string {
  return buildBusinessDocHtml("receipt", values);
}
