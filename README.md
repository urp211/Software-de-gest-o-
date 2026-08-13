# MAKINA — Software de Gestão Avançada

Aplicação de gestão de oficina / peças auto (Angola · padrão AGT), pronta a correr offline.

## Pacote para Windows

Ficheiro gerado:

```
dist-exe/MAKINA-Gestao-1.0.0-Portable.zip
```

### Como usar no Windows

1. Extraia o ZIP
2. Instale **Node.js 22+** (se ainda não tiver): https://nodejs.org  
3. Duplo-clique em **`Iniciar-MAKINA.bat`**
4. O browser abre em http://127.0.0.1:3847/login

### Credenciais

| Campo | Valor |
|-------|-------|
| Utilizador | `MAKINA` |
| Palavra-passe | `admmakina` |

### Gerar `.exe` nativo (Electron)

Num PC **Windows** com internet:

```bash
npm install
npm run electron:build
```

Resultado: `dist-exe/MAKINA-Gestao-1.0.0-Portable.exe`

> Nota: este ambiente Linux de build não conseguiu descarregar os binários do Electron
> (bloqueio de rede TLS a github/releases). O código Electron está pronto em `electron/`.

## Desenvolvimento

```bash
npm install
npm run dev
# http://localhost:3000
```

## Funcionalidades

- Login Admin / Operador com sessão JWT
- Dashboard (stock, receita, lucro)
- Estoque de peças com código de rastreio `MAK-…`
- POS / faturação de vendas `MAK-INV-…`
- Operadores, calculadora, relatórios, configurações
- Base **SQLite embutida** (sem PostgreSQL) — ficheiro `data/makina.db`

## Stack

- Next.js 15 + React 19 + Tailwind CSS 4
- Drizzle ORM + SQLite (`node:sqlite` via shim better-sqlite3)
- Electron (empacotamento desktop opcional)

## Autor

Makina Company / Raul Lourenço
