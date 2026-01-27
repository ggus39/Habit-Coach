import { http, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected, metaMask } from 'wagmi/connectors';

// wagmi 配置
export const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [sepolia.id]: http('https://sepolia.infura.io/v3/6bcc38f6e5554d6aa1089ee1e4ffe0f7'),
  },
});

// 声明类型
declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
