# MAKINA Mobile — Gestão empresarial offline

App Android instalável (APK) + PWA responsiva. **100% offline** após a instalação.

## APK

```
../dist-apk/MAKINA-Gestao-1.0.0.apk
```

| Campo | Valor |
|-------|--------|
| Package | `com.makina.gestao` |
| Versão | 1.1.0 |
| minSdk | 21 (Android 5.0+) |
| Acesso | Credenciais da organização |

### Instalar

1. Transfira o `.apk`  
2. Ative *Fontes desconhecidas*  
3. Instale e abra  
4. Autorize as permissões pedidas (câmara, galeria, notificações, armazenamento)

## Permissões do dispositivo

| Permissão | Uso |
|-----------|-----|
| Câmara | Fotos de produtos |
| Galeria | Selecionar imagens |
| Notificações | Alertas de stock / caixa |
| Armazenamento | Backups e exportações |
| Rede | Estado online/offline |

Pode voltar a pedir em **Configurações → Dispositivo & permissões**.

## Perfis

- **Operador** — POS e vendas próprias; sem lucros globais nem adição de stock  
- **Admin** — stock, contabilidade, anulações, 2ª via, backup, operadores  

## Desenvolvimento

```bash
cd mobile
npm install
npm run dev          # http://0.0.0.0:5173
npm run build
npm run apk          # gera ../dist-apk/
```

## Stack

React 19 · Vite 6 · Dexie · Capacitor 7 · Nitron APK · PWA
