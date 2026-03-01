'use client';

export default function WalletManagerPage() {
  return (
    <div className="min-h-screen bg-[var(--gh-canvas-default)] p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--gh-fg-default)] mb-2">Wallet Generation & Management</h1>
        <p className="text-[var(--gh-fg-muted)] mb-8">Generate, backup, and restore wallets</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--gh-canvas-subtle)] rounded-lg border border-[var(--gh-border-default)] p-6">
            <h3 className="text-xl font-bold text-[var(--gh-fg-default)] mb-4">Generate New Wallet</h3>
            <button className="w-full px-4 py-2 bg-[var(--gh-btn-primary-bg)] text-white rounded-md hover:bg-[var(--gh-btn-primary-hover-bg)]">
              Generate Wallet
            </button>
          </div>
          <div className="bg-[var(--gh-canvas-subtle)] rounded-lg border border-[var(--gh-border-default)] p-6">
            <h3 className="text-xl font-bold text-[var(--gh-fg-default)] mb-4">Restore Wallet</h3>
            <button className="w-full px-4 py-2 bg-[var(--gh-btn-bg)] text-[var(--gh-fg-default)] border border-[var(--gh-btn-border)] rounded-md">
              Upload Backup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
