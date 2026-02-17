'use client';

export default function FeesPage() {
  return (
    <div className="min-h-screen bg-[var(--gh-canvas-default)] p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--gh-fg-default)] mb-2">Fee Management</h1>
        <p className="text-[var(--gh-fg-muted)] mb-8">Configure platform fees and distribution</p>
        <div className="bg-[var(--gh-canvas-subtle)] rounded-lg border border-[var(--gh-border-default)] p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--gh-fg-default)] mb-2">Dev Fee Percentage</label>
              <input type="number" step="0.01" defaultValue="0.10" className="w-full px-3 py-2 border border-[var(--gh-border-default)] rounded-md bg-[var(--gh-canvas-default)]" />
              <p className="text-xs text-[var(--gh-fg-muted)] mt-1">⚠️ UI prototype - save functionality pending backend integration</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--gh-fg-default)] mb-2">Trading Fee</label>
              <input type="number" step="0.001" defaultValue="0.003" className="w-full px-3 py-2 border border-[var(--gh-border-default)] rounded-md bg-[var(--gh-canvas-default)]" />
              <p className="text-xs text-[var(--gh-fg-muted)] mt-1">⚠️ UI prototype - save functionality pending backend integration</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
