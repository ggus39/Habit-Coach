# Implementation Plan - Simplify Wallet Connection UI

The user wants to revert the "list all connectors" UI change and strictly display a **single "Connect Wallet" button**.
To address the previous `evmAsk.js` error while keeping the UI simple, I will modify the connection logic to prioritize **MetaMask** explicitly if available, falling back to the default injected connector otherwise.

## User Review Required

> [!NOTE]
> I will simplify the UI to show only one "Connect Wallet" button.
> Behind the scenes, clicking this button will try to connect to **MetaMask** first. If MetaMask isn't found, it will try the default wallet.

## Proposed Changes

### Frontend

#### [Header.tsx](frontend/components/Header.tsx)

- Revert the mapped button list to a **single button**.
- Implement a `handleConnect` function:
    - Search for a connector named `'MetaMask'`.
    - If found, connect using it.
    - If not, connect using the first available connector (`connectors[0]`).

## Verification Plan

### Manual Verification
- Check the top right of the page; it should show only **one** "Connect Wallet" button.
- Click the button.
- Ensure the MetaMask popup appears (if installed) and handles the connection without the `evmAsk.js` error.
