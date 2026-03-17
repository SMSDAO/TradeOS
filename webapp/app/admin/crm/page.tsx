'use client';

export default function CRMPage() {
  return (
    <div className="min-h-screen bg-[var(--gh-canvas-default)] p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--gh-fg-default)] mb-2">Customer Relationship Management</h1>
        <p className="text-[var(--gh-fg-muted)] mb-8">Track user analytics and engagement</p>
        <div className="bg-[var(--gh-canvas-subtle)] rounded-lg border border-[var(--gh-border-default)] p-6">
          <p className="text-[var(--gh-fg-muted)]">CRM analytics will be displayed here when connected to backend.</p>
        </div>
      </div>
    </div>
  );
}
