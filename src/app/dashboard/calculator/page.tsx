"use client";
import { useState } from "react";
import { Calculator as CalcIcon } from "lucide-react";

export default function CalculatorPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");

  const handleClick = (val: string) => {
    setInput(prev => prev + val);
  };

  const calculate = () => {
    try {
      // safe eval alternative using function constructor
      const res = new Function('return ' + input)();
      setResult(res.toString());
    } catch (e) {
      setResult("Erro");
    }
  };

  const clear = () => {
    setInput("");
    setResult("");
  };

  return (
    <div className="max-w-md mx-auto pt-8">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2 mb-6">
          <CalcIcon className="w-6 h-6 text-slate-800" />
          <h2 className="text-xl font-bold text-slate-800">Calculadora MAKINA</h2>
        </div>

        <div className="bg-slate-900 p-4 rounded-lg mb-4">
          <div className="text-slate-400 text-sm text-right h-5">{input || "0"}</div>
          <div className="text-white text-3xl font-mono text-right">{result || "0"}</div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {["7","8","9","/","4","5","6","*","1","2","3","-","0",".","+","="].map((btn) => (
            <button
              key={btn}
              onClick={() => btn === "=" ? calculate() : handleClick(btn)}
              className={`p-4 text-xl font-bold rounded-lg transition-colors ${
                ["/","*","-","+","="].includes(btn) 
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200" 
                  : "bg-slate-100 text-slate-800 hover:bg-slate-200"
              }`}
            >
              {btn}
            </button>
          ))}
          <button onClick={clear} className="col-span-4 p-4 mt-2 bg-red-100 text-red-700 font-bold rounded-lg hover:bg-red-200">
            Limpar (C)
          </button>
        </div>
      </div>
    </div>
  );
}
