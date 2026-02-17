'use client';

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-[var(--gh-canvas-default)] p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--gh-fg-default)] mb-2">Portfolio & PNL Dashboard</h1>
        <p className="text-[var(--gh-fg-muted)] mb-8">Track performance and profit/loss</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[var(--gh-canvas-subtle)] rounded-lg border border-[var(--gh-border-default)] p-6">
            <h3 className="text-sm text-[var(--gh-fg-muted)] mb-2">Total Value</h3>
            <p className="text-3xl font-bold text-[var(--gh-fg-default)]">$0.00</p>
          </div>
          <div className="bg-[var(--gh-canvas-subtle)] rounded-lg border border-[var(--gh-border-default)] p-6">
            <h3 className="text-sm text-[var(--gh-fg-muted)] mb-2">24h PNL</h3>
            <p className="text-3xl font-bold text-[var(--gh-success-fg)]">+$0.00</p>
          </div>
          <div className="bg-[var(--gh-canvas-subtle)] rounded-lg border border-[var(--gh-border-default)] p-6">
            <h3 className="text-sm text-[var(--gh-fg-muted)] mb-2">Total Trades</h3>
            <p className="text-3xl font-bold text-[var(--gh-fg-default)]">0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
