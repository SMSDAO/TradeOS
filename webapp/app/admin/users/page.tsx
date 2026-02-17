'use client';

import { useState, useEffect } from 'react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch users from API
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--gh-canvas-default)] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--gh-fg-default)] mb-2">
            User Management
          </h1>
          <p className="text-[var(--gh-fg-muted)]">
            Manage user accounts, permissions, and access
          </p>
        </div>

        <div className="bg-[var(--gh-canvas-subtle)] rounded-lg border border-[var(--gh-border-default)] p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
              <button className="px-4 py-2 bg-[var(--gh-btn-primary-bg)] text-white rounded-md hover:bg-[var(--gh-btn-primary-hover-bg)]">
                Add User
              </button>
              <button className="px-4 py-2 bg-[var(--gh-btn-bg)] text-[var(--gh-fg-default)] rounded-md border border-[var(--gh-btn-border)] hover:bg-[var(--gh-btn-hover-bg)]">
                Export
              </button>
            </div>
            <input
              type="search"
              placeholder="Search users..."
              className="px-4 py-2 border border-[var(--gh-border-default)] rounded-md bg-[var(--gh-canvas-default)] text-[var(--gh-fg-default)]"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-[var(--gh-fg-muted)]">
              Loading users...
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[var(--gh-fg-muted)]">
                No users found. User data will be populated when connected to backend.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
