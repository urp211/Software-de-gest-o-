# MAKINA — Software de Gestão Avançada

Gestão de oficina / peças auto (Angola · padrão AGT), **offline**.

## 📱 App Mobile (APK) — recomendado

```
dist-apk/MAKINA-Gestao-1.0.0.apk
```

- **100% offline** no telemóvel / tablet / foldable  
- UI adaptável a qualquer ecrã  
- Login: `MAKINA` / `admmakina`  

Instruções: `dist-apk/LEIA-ME.txt` e `mobile/README.md`.

### Pré-visualizar / desenvolver mobile

```bash
cd mobile && npm install && npm run dev
# http://localhost:5173
```

### Regenerar APK

```bash
cd mobile && npm run apk
```

## 💻 Desktop (Windows)

```
dist-exe/MAKINA-Gestao-1.0.0-Portable.zip
```

1. Extraia o ZIP  
2. Instale Node.js 22+ se necessário  
3. Execute `Iniciar-MAKINA.bat`  

Para `.exe` nativo (Electron) num PC Windows:

```bash
npm install
npm run electron:build
```

## Credenciais padrão

| Campo | Valor |
|-------|-------|
| Utilizador | `MAKINA` |
| Palavra-passe | `admmakina` |

## Funcionalidades

- Login Admin / Operador  
- Dashboard (stock, receita, lucro)  
- Estoque de peças com código `MAK-…`  
- POS / faturação `MAK-INV-…`  
- Operadores, calculadora, relatórios, configurações  

## Estrutura

| Pasta | Conteúdo |
|-------|----------|
| `mobile/` | App React offline + build APK |
| `src/` | App Next.js (servidor / desktop) |
| `electron/` | Shell desktop Windows |
| `dist-apk/` | **APK instalável** |
| `dist-exe/` | Pacote portátil Windows |

## Autor

Makina Company / Raul Lourenço · AGT Angola
