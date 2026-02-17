'use client';

import { useState } from 'react';

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-[var(--gh-canvas-default)] p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--gh-fg-default)] mb-2">Billing & Subscriptions</h1>
        <p className="text-[var(--gh-fg-muted)] mb-8">Manage user subscriptions, payments, and invoices</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[var(--gh-canvas-subtle)] rounded-lg border border-[var(--gh-border-default)] p-6">
            <h3 className="text-sm font-medium text-[var(--gh-fg-muted)] mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-[var(--gh-fg-default)]">$0.00</p>
          </div>
          <div className="bg-[var(--gh-canvas-subtle)] rounded-lg border border-[var(--gh-border-default)] p-6">
            <h3 className="text-sm font-medium text-[var(--gh-fg-muted)] mb-2">Active Subscriptions</h3>
            <p className="text-3xl font-bold text-[var(--gh-success-fg)]">0</p>
          </div>
          <div className="bg-[var(--gh-canvas-subtle)] rounded-lg border border-[var(--gh-border-default)] p-6">
            <h3 className="text-sm font-medium text-[var(--gh-fg-muted)] mb-2">Pending Invoices</h3>
            <p className="text-3xl font-bold text-[var(--gh-warning-fg)]">0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
