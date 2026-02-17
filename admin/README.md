# TradeOS Admin Desktop Application

Windows desktop application for TradeOS admin panel built with Electron.

## Features

- **Wallet Management**: Generate and restore wallets
- **User Management**: Manage user accounts
- **Billing Dashboard**: Track subscriptions
- **Bot Control**: Configure trading bots
- **Portfolio Dashboard**: Track performance
- **DAO Management**: Governance and voting
- **AI Control Panel**: Configure AI strategies

## Prerequisites

- Node.js 24 or higher
- npm 10 or higher
- Windows 10 or higher

## Installation

```bash
cd admin
npm install
```

## Development

```bash
npm start
```

## Building for Windows

```bash
npm run build
```

Build artifacts are generated in `dist/` folder.

**Note on Application Icon**: The build uses the default Electron icon. To add a custom icon:
1. Create `admin/assets/` directory
2. Add your `icon.ico` file
3. Update `package.json` build config: add `"icon": "assets/icon.ico"` to the `win` section
