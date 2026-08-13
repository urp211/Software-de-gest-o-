import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Printer, X } from "lucide-react";
import type { Sale, SaleItem, Settings } from "../lib/db";
import { moneyShort, PAYMENT_LABELS } from "../lib/db";
import { formatDate } from "../lib/format";
import { buildThermalHtml, printHtml, qrToDataUrl } from "../lib/print";

type Props = {
  open: boolean;
  onClose: () => void;
  sale: Sale;
  items: SaleItem[];
  settings: Settings;
  copyLabel?: string;
};

export function InvoicePreview({
  open,
  onClose,
  sale,
  items,
  settings,
  copyLabel = "ORIGINAL",
}: Props) {
  const [qrUrl, setQrUrl] = useState("");
  const qrValue =
    sale.qrPayload ||
    JSON.stringify({
      inv: sale.invoiceNumber,
      total: sale.totalAmount,
      date: sale.createdAt,
    });

  useEffect(() => {
    if (!open) return;
    qrToDataUrl(qrValue).then(setQrUrl).catch(() => setQrUrl(""));
  }, [open, qrValue]);

  if (!open) return null;

  const handlePrint = async () => {
    const html = buildThermalHtml({ sale, items, settings, copyLabel });
    const dataUrl = qrUrl || (await qrToDataUrl(qrValue));
    printHtml(html, dataUrl);
  };

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div
        className="sheet"
        role="dialog"
        aria-label="Pré-visualização da fatura"
        style={{ maxHeight: "92dvh" }}
      >
        <div className="sheet-handle" />
        <div className="flex-between mb-1">
          <strong>Pré-visualização térmica</strong>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={16} /> Fechar
          </button>
        </div>

        <div
          className="card"
          style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: 12,
            maxWidth: settings.thermalWidth === 80 ? 320 : 260,
            margin: "0 auto",
            background: "#fffef8",
          }}
        >
          <div className="text-center">
            <div className="fw-bold" style={{ letterSpacing: "0.12em" }}>
              {settings.companyName}
            </div>
            <div className="text-muted tiny">NIF {settings.nif}</div>
            <div className="text-muted tiny">{settings.address}</div>
            <div className="fw-bold mt-1">{copyLabel}</div>
          </div>
          <div className="dash" />
          <div className="flex-between">
            <span>Fatura</span>
            <strong>{sale.invoiceNumber}</strong>
          </div>
          <div className="flex-between">
            <span>Data</span>
            <span>{formatDate(sale.createdAt)}</span>
          </div>
          <div className="flex-between">
            <span>Operador</span>
            <span>{sale.operatorName || "—"}</span>
          </div>
          {sale.clientName && (
            <div className="flex-between">
              <span>Cliente</span>
              <span>{sale.clientName}</span>
            </div>
          )}
          <div className="dash" />
          {items.map((it) => (
            <div key={it.id || `${it.partId}-${it.quantity}`}>
              <div className="flex-between">
                <span>
                  {it.partName} x{it.quantity}
                </span>
                <span>{moneyShort(it.totalPrice)}</span>
              </div>
            </div>
          ))}
          <div className="dash" />
          {!!sale.discount && (
            <div className="flex-between">
              <span>Desconto</span>
              <span>-{moneyShort(sale.discount)}</span>
            </div>
          )}
          {!!sale.taxAmount && (
            <div className="flex-between">
              <span>IVA</span>
              <span>{moneyShort(sale.taxAmount)}</span>
            </div>
          )}
          <div className="flex-between fw-bold" style={{ fontSize: 15 }}>
            <span>TOTAL</span>
            <span>{moneyShort(sale.totalAmount)}</span>
          </div>
          <div className="flex-between">
            <span>Pagamento</span>
            <span>{PAYMENT_LABELS[sale.paymentMethod || "CASH"]}</span>
          </div>
          {sale.amountPaid != null && (
            <div className="flex-between">
              <span>Entregue</span>
              <span>{moneyShort(sale.amountPaid)}</span>
            </div>
          )}
          {!!sale.changeGiven && sale.changeGiven > 0 && (
            <div className="flex-between fw-bold">
              <span>Troco</span>
              <span>{moneyShort(sale.changeGiven)}</span>
            </div>
          )}
          <div className="text-center mt-2">
            <QRCodeCanvas value={qrValue} size={112} includeMargin level="M" />
            <div className="text-muted tiny mt-1">QR de validação</div>
          </div>
          <div className="text-center text-muted tiny mt-1">
            {settings.invoiceFooter || "Obrigado"}
          </div>
        </div>

        <button className="btn btn-primary btn-block mt-2" type="button" onClick={handlePrint}>
          <Printer size={18} /> Imprimir fatura térmica
        </button>
      </div>
      <style>{`
        .dash { border-top: 1px dashed #94a3b8; margin: 8px 0; }
        .tiny { font-size: 11px; }
        .text-center { text-align: center; }
      `}</style>
    </>
  );
}
