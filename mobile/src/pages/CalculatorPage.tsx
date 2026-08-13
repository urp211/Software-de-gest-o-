import { useState } from "react";
import { Calculator as CalcIcon } from "lucide-react";

export default function CalculatorPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("0");

  const press = (val: string) => {
    if (val === "=") {
      try {
        // Safe-ish arithmetic only
        if (!/^[\d+\-*/().\s]+$/.test(input)) {
          setResult("Erro");
          return;
        }
        // eslint-disable-next-line no-new-func
        const res = Function(`"use strict"; return (${input})`)();
        setResult(String(res));
      } catch {
        setResult("Erro");
      }
      return;
    }
    setInput((p) => p + val);
  };

  const clear = () => {
    setInput("");
    setResult("0");
  };

  const keys = ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "+", "="];

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <h1 className="page-title" style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <CalcIcon size={22} /> Calculadora
      </h1>
      <p className="page-sub">Cálculos rápidos de margens e totais.</p>

      <div className="card">
        <div className="calc-display">
          <div className="expr">{input || "0"}</div>
          <div className="res">{result}</div>
        </div>
        <div className="calc-grid">
          {keys.map((k) => (
            <button
              key={k}
              type="button"
              className={["/", "*", "-", "+", "="].includes(k) ? "op" : undefined}
              onClick={() => press(k)}
            >
              {k}
            </button>
          ))}
          <button type="button" className="wide" onClick={clear}>
            Limpar (C)
          </button>
        </div>
      </div>
    </div>
  );
}
