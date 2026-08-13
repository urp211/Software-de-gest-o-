# MAKINA — Software de Gestão Avançada

Gestão de oficina / peças auto (Angola · padrão AGT).

## 📱 App Mobile (APK) — recomendado

```
dist-apk/MAKINA-Gestao-1.0.0.apk
```

- **Offline total** no telemóvel/tablet  
- UI adaptável a qualquer ecrã  
- Login: `MAKINA` / `admmakina`  

Ver `mobile/README.md` e `dist-apk/LEIA-ME.txt`.

### Pré-visualizar no browser

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

Ver README anterior / `npm run package:portable` na raiz.

## Credenciais padrão

| Campo | Valor |
|-------|-------|
| Utilizador | `MAKINA` |
| Palavra-passe | `admmakina` |

## Estrutura

| Pasta | Conteúdo |
|-------|----------|
| `mobile/` | App React offline + build APK |
| `src/` | App Next.js (servidor / desktop) |
| `electron/` | Shell desktop Windows |
| `dist-apk/` | **APK instalável** |
| `dist-exe/` | Pacote portátil Windows |

## Autor

Makina Company / Raul Lourenço
