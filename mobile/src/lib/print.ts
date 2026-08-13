import type { Sale, SaleItem, Settings } from "./db";
import { moneyShort, PAYMENT_LABELS } from "./db";
import { formatDate } from "./format";

export type InvoiceData = {
  sale: Sale;
  items: SaleItem[];
  settings: Settings;
  copyLabel?: string; // "ORIGINAL" | "2ª VIA"
};

export function buildThermalHtml(data: InvoiceData) {
  const { sale, items, settings } = data;
  const width = settings.thermalWidth === 80 ? 80 : 58;
  const copy = data.copyLabel || "ORIGINAL";
  const lines = items
    .map(
      (it) => `
      <div class="row">
        <div class="item-name">${escapeHtml(it.partName || "Item")} x${it.quantity}</div>
        <div class="item-price">${moneyShort(it.totalPrice)}</div>
      </div>
      <div class="muted tiny">${moneyShort(it.unitPrice)} un.</div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${sale.invoiceNumber}</title>
<style>
  @page { margin: 4mm; size: ${width}mm auto; }
  * { box-sizing: border-box; }
  body {
    font-family: "Courier New", ui-monospace, monospace;
    font-size: ${width === 80 ? 12 : 11}px;
    width: ${width}mm;
    margin: 0 auto;
    color: #000;
    background: #fff;
  }
  .center { text-align: center; }
  .bold { font-weight: 700; }
  .muted { color: #333; }
  .tiny { font-size: 10px; }
  .dash { border-top: 1px dashed #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; gap: 6px; }
  .item-name { flex: 1; }
  .total { font-size: 14px; font-weight: 800; }
  .qr { margin: 8px auto; text-align: center; }
  .qr img { width: 96px; height: 96px; }
  h1 { font-size: 14px; margin: 0 0 2px; letter-spacing: 0.08em; }
  @media print {
    body { width: ${width}mm; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
  <div class="center">
    <h1>${escapeHtml(settings.companyName || "MAKINA")}</h1>
    <div class="tiny">NIF: ${escapeHtml(settings.nif || "—")}</div>
    <div class="tiny">${escapeHtml(settings.address || "")}</div>
    ${settings.phone ? `<div class="tiny">Tel: ${escapeHtml(settings.phone)}</div>` : ""}
  </div>
  <div class="dash"></div>
  <div class="center bold">${copy}</div>
  <div class="row"><span>Fatura</span><span class="bold">${escapeHtml(sale.invoiceNumber)}</span></div>
  <div class="row"><span>Data</span><span>${formatDate(sale.createdAt)}</span></div>
  <div class="row"><span>Operador</span><span>${escapeHtml(sale.operatorName || "—")}</span></div>
  ${sale.clientName ? `<div class="row"><span>Cliente</span><span>${escapeHtml(sale.clientName)}</span></div>` : ""}
  ${sale.clientNif ? `<div class="row"><span>NIF Cliente</span><span>${escapeHtml(sale.clientNif)}</span></div>` : ""}
  <div class="dash"></div>
  ${lines}
  <div class="dash"></div>
  ${sale.subtotal != null ? `<div class="row"><span>Subtotal</span><span>${moneyShort(sale.subtotal)}</span></div>` : ""}
  ${sale.discount ? `<div class="row"><span>Desconto</span><span>-${moneyShort(sale.discount)}</span></div>` : ""}
  ${sale.taxAmount ? `<div class="row"><span>IVA</span><span>${moneyShort(sale.taxAmount)}</span></div>` : ""}
  <div class="row total"><span>TOTAL</span><span>${moneyShort(sale.totalAmount)}</span></div>
  <div class="row"><span>Pagamento</span><span>${PAYMENT_LABELS[sale.paymentMethod || "CASH"]}</span></div>
  ${sale.amountPaid != null ? `<div class="row"><span>Entregue</span><span>${moneyShort(sale.amountPaid)}</span></div>` : ""}
  ${sale.changeGiven != null && sale.changeGiven > 0 ? `<div class="row bold"><span>Troco</span><span>${moneyShort(sale.changeGiven)}</span></div>` : ""}
  <div class="dash"></div>
  <div class="qr" id="qr"></div>
  <div class="center tiny muted">${escapeHtml(settings.invoiceFooter || "Obrigado")}</div>
  <div class="center tiny">MAKINA · Documento processado informaticamente</div>
  <script>
    // QR rendered by parent via canvas injection if needed
  </script>
</body>
</html>`;
}

export function buildA4StatementHtml(opts: {
  title: string;
  settings: Settings;
  rows: { col1: string; col2: string; col3: string; col4?: string }[];
  summary: { label: string; value: string }[];
  subtitle?: string;
}) {
  const { title, settings, rows, summary, subtitle } = opts;
  const body = rows
    .map(
      (r) =>
        `<tr><td>${escapeHtml(r.col1)}</td><td>${escapeHtml(r.col2)}</td><td class="r">${escapeHtml(r.col3)}</td>${r.col4 != null ? `<td class="r">${escapeHtml(r.col4)}</td>` : ""}</tr>`
    )
    .join("");
  const sum = summary
    .map((s) => `<div class="sum-row"><span>${escapeHtml(s.label)}</span><strong>${escapeHtml(s.value)}</strong></div>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 16mm; }
  body { font-family: system-ui, sans-serif; color: #0f172a; font-size: 12px; }
  h1 { margin: 0 0 4px; font-size: 20px; }
  .muted { color: #64748b; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { border-bottom: 1px solid #e2e8f0; padding: 8px 6px; text-align: left; }
  th { background: #f8fafc; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #475569; }
  .r { text-align: right; }
  .head { display: flex; justify-content: space-between; gap: 16px; }
  .sum { margin-top: 20px; max-width: 280px; margin-left: auto; }
  .sum-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0; }
  .footer { margin-top: 28px; font-size: 10px; color: #94a3b8; text-align: center; }
  @media print { .no-print { display: none !important; } }
</style>
</head>
<body>
  <div class="head">
    <div>
      <h1>${escapeHtml(settings.companyName)}</h1>
      <div class="muted">NIF ${escapeHtml(settings.nif)} · ${escapeHtml(settings.address || "")}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:16px;font-weight:800">${escapeHtml(title)}</div>
      <div class="muted">${escapeHtml(subtitle || new Date().toLocaleString("pt-AO"))}</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Referência</th><th>Detalhe</th><th class="r">Valor</th>
        ${rows[0]?.col4 != null ? '<th class="r">Extra</th>' : ""}
      </tr>
    </thead>
    <tbody>${body || '<tr><td colspan="4" class="muted">Sem registos</td></tr>'}</tbody>
  </table>
  <div class="sum">${sum}</div>
  <div class="footer">MAKINA Software · Extrato gerado localmente · ${new Date().toISOString()}</div>
</body>
</html>`;
}

function escapeHtml(s: string) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Open print window with optional QR data URL injected */
export function printHtml(html: string, qrDataUrl?: string | null) {
  const w = window.open("", "_blank", "noopener,noreferrer,width=420,height=720");
  if (!w) {
    alert("Permita pop-ups para imprimir.");
    return;
  }
  let finalHtml = html;
  if (qrDataUrl) {
    finalHtml = html.replace(
      '<div class="qr" id="qr"></div>',
      `<div class="qr" id="qr"><img src="${qrDataUrl}" alt="QR"/><div class="tiny">Validação digital</div></div>`
    );
  }
  w.document.open();
  w.document.write(finalHtml);
  w.document.close();
  // wait images
  setTimeout(() => {
    w.focus();
    w.print();
  }, 350);
}

export async function qrToDataUrl(text: string, size = 160): Promise<string> {
  // Dynamic import of qrcode.react is component-based; use a tiny canvas QR via API
  // We'll use the browser to render via a temporary QRCode SVG from a simple library pattern.
  // Prefer qrcode package if available - fall back to Google chart-like offline canvas.
  try {
    // Use QRCodeSVG rendered offscreen via dynamic component is hard; implement with 'qrcode' alternative:
    const { QRCodeCanvas } = await import("qrcode.react");
    // Create via DOM
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;left:-9999px;top:0";
    document.body.appendChild(host);
    const React = await import("react");
    const { createRoot } = await import("react-dom/client");
    const root = createRoot(host);
    await new Promise<void>((resolve) => {
      root.render(
        React.createElement(QRCodeCanvas, {
          value: text,
          size,
          level: "M",
          includeMargin: true,
        })
      );
      setTimeout(resolve, 50);
    });
    const canvas = host.querySelector("canvas");
    const url = canvas ? canvas.toDataURL("image/png") : "";
    root.unmount();
    host.remove();
    return url;
  } catch {
    return "";
  }
}
