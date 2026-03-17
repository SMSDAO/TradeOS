'use client';

export default function PricesPage() {
  return (
    <div className="min-h-screen bg-[var(--gh-canvas-default)] p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--gh-fg-default)] mb-2">Price Feed Management</h1>
        <p className="text-[var(--gh-fg-muted)] mb-8">Configure automated price feeds and oracles</p>
        <div className="bg-[var(--gh-canvas-subtle)] rounded-lg border border-[var(--gh-border-default)] p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[var(--gh-fg-default)]">Pyth Network</span>
              <span className="text-[var(--gh-success-fg)]">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--gh-fg-default)]">Jupiter Aggregator</span>
              <span className="text-[var(--gh-success-fg)]">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--gh-fg-default)]">Switchboard</span>
              <span className="text-[var(--gh-fg-muted)]">Inactive</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
