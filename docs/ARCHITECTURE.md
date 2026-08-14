# MAKINA Enterprise — Arquitetura

## Stack
- **Frontend mobile:** React 19 + TypeScript + Vite 6 + PWA
- **Persistência offline:** Dexie (IndexedDB) v4 schema
- **Nativo Android:** Capacitor 7 + Nitron APK WebView
- **Desktop (legado):** Next.js 15 + SQLite (`node:sqlite`) + Electron shell
- **Auth:** bcryptjs (hash), sessões localStorage, RBAC granular
- **Sem backend obrigatório** no mobile — todas as regras de negócio no cliente offline com auditoria

## Princípios
Segurança (hash, RBAC), integridade (transações Dexie), rastreabilidade (audit_logs),
backup/restore, multi-dispositivo via código de empresa + pacote JSON.

## Módulos de dados
users, roles/permissions (lib/roles), clients, suppliers, products/parts,
warehouses, stock_movements, sales, purchases, quotes, services,
expenses, accounts_payable, accounts_receivable, cash_sessions,
notifications, doc_sequences, audit_logs, approvals, settings

## Fluxo de venda (transacional)
Validar user → stock → calcular → gravar sale + items → atualizar stock
→ movimento → auditoria → documento/QR → notificação
