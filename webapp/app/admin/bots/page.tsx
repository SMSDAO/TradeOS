'use client';

import { useState } from 'react';

export default function BotsPage() {
  const [sniperEnabled, setSniperEnabled] = useState(false);
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--gh-canvas-default)] p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--gh-fg-default)] mb-2">Bot Management</h1>
        <p className="text-[var(--gh-fg-muted)] mb-8">Configure and monitor automated trading bots</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--gh-canvas-subtle)] rounded-lg border border-[var(--gh-border-default)] p-6">
            <h3 className="text-xl font-bold text-[var(--gh-fg-default)] mb-4">Sniper Bot</h3>
            <button onClick={() => setSniperEnabled(!sniperEnabled)} className={`px-4 py-2 rounded-md ${sniperEnabled ? 'bg-[var(--gh-success-fg)] text-white' : 'bg-[var(--gh-btn-bg)] border border-[var(--gh-btn-border)]'}`}>
              {sniperEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
          <div className="bg-[var(--gh-canvas-subtle)] rounded-lg border border-[var(--gh-border-default)] p-6">
            <h3 className="text-xl font-bold text-[var(--gh-fg-default)] mb-4">Auto-Trade Bot</h3>
            <button onClick={() => setAutoTradeEnabled(!autoTradeEnabled)} className={`px-4 py-2 rounded-md ${autoTradeEnabled ? 'bg-[var(--gh-success-fg)] text-white' : 'bg-[var(--gh-btn-bg)] border border-[var(--gh-btn-border)]'}`}>
              {autoTradeEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
