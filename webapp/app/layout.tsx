import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

export const metadata: Metadata = {
  title:
    "CastQuest - Solana DeFi Platform | Flash Loan Arbitrage, Token Launchpad, Jupiter Swap",
  description:
    "Advanced Solana DeFi platform with flash loan arbitrage, MEV-protected sniper bot, token launchpad with airdrop roulette game, Jupiter swap integration, NFT staking, and comprehensive API for developers. Build on Solana with real-time pricing, dynamic slippage, and multi-DEX aggregation.",
  openGraph: {
    title: "CastQuest - Solana DeFi Platform",
    description:
      "Flash loan arbitrage, sniper bot, token launchpad with airdrop roulette",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CastQuest - Solana DeFi Platform",
    description:
      "Flash loan arbitrage, sniper bot, token launchpad with airdrop roulette",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="keywords"
          content="Solana DeFi, Flash Loan Arbitrage, Jupiter Swap, Token Launchpad, Sniper Bot, Pump.fun, Raydium, GXQ Studio, Airdrop Game, MEV Protection, Solana Trading, DeFi API, NFT Staking, Crypto Arbitrage, Solana Ecosystem"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#0969da" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
