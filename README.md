# MAKINA — Sistema de Gestão Empresarial

Gestão de oficina / peças auto (Angola · padrão AGT), **offline**.

## App Mobile (APK)

```
dist-apk/MAKINA-Gestao-1.0.0.apk
```

- Offline no telemóvel / tablet / foldable  
- UI adaptável a qualquer ecrã  
- Pedido de permissões do dispositivo (câmara, ficheiros, notificações)  
- Acesso com as credenciais da sua organização  

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

## Desktop (Windows)

```
dist-exe/MAKINA-Gestao-1.0.0-Portable.zip
```

## Acesso

Utilize as credenciais definidas pela administração da empresa.

## Funcionalidades

- Login Admin / Operador (sem exposição de credenciais na UI)
- Dashboard, stock com fotos, POS com troco e QR
- Fatura térmica + extrato A4 + 2ª via autorizada
- Contabilidade avançada, caixa, despesas, clientes
- Backup/restauro, auditoria, permissões nativas Android

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
