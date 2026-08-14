# MAKINA Mobile — Offline para todos os dispositivos

App Android instalável (APK) + PWA responsiva. **100% offline** após a instalação.

## APK pronto

```
../dist-apk/MAKINA-Gestao-1.0.0.apk
../dist-apk/MAKINA.apk
```

| Campo | Valor |
|-------|--------|
| Package | `com.makina.gestao` |
| minSdk | 21 (Android 5.0+) |
| targetSdk | 34 |
<<<<<<< HEAD
| Login | `MAKINA` / `admmakina` |
=======
| Acesso | Credenciais da organização |
>>>>>>> 1d02c64 (feat: sistema empresarial com permissões de dispositivo e UI sem credenciais)

### Instalar no telemóvel

1. Transfira o `.apk` para o dispositivo  
2. Ative *Fontes desconhecidas* / *Instalar apps desconhecidas*  
3. Abra o APK → **Instalar** → Abrir  

## O que funciona offline

- Login Admin / Operador  
- Dashboard (stock, receita, lucro)  
- Estoque de peças + códigos `MAK-…`  
- POS / faturação `MAK-INV-…`  
- Operadores, relatórios, calculadora, configurações  
- Dados no **IndexedDB** do dispositivo (persistentes)  

## UI adaptativa

| Dispositivo | Layout |
|-------------|--------|
| Telemóvel | Barra inferior + menu «Mais» |
| Tablet / landscape | Menu lateral |
| Foldable / desktop | Layout largo responsivo |
| Safe areas | Notch / gesture bar respeitados |

## Desenvolvimento

```bash
cd mobile
npm install
npm run dev          # http://0.0.0.0:5173
npm run build        # gera dist/
npm run apk          # gera APK em ../dist-apk/
```

### Capacitor (Android Studio)

```bash
npm run cap:sync
npm run cap:open
```

## Stack

- React 19 + Vite 6 + TypeScript  
- Dexie (IndexedDB) + bcryptjs  
- Vite PWA (service worker)  
- Capacitor 7 (projeto nativo opcional)  
- Nitron (empacotamento APK WebView)  

## Autor

Makina Company / Raul Lourenço · AGT Angola
