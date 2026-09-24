'use client';
import { useCopy } from '@/lib/i18n/use-copy';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  adminApi,
  adminKeys,
  type ActivityLog,
  type ActivityLogQuery,
} from '@/lib/api';

import {
  AdminPageHeader,
  AdminTable,
  ConfirmDialog,
  DataState,
  Pager,
} from './admin-ui';

type ActivityLogFilters = {
  action?: string;
  admin_id?: number;
  end_date?: string;
  search?: string;
  start_date?: string;
  table_name?: string;
};

const EMPTY_FILTERS: ActivityLogFilters = {};

export function ActivityLogsView() {
  const _copy = useCopy();
  const { user } = useAuth();
  const client = useQueryClient();

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ActivityLogFilters>(EMPTY_FILTERS);
  const [retentionDate, setRetentionDate] = useState('');
  const [deleting, setDeleting] = useState<ActivityLog | null>(null);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const canDelete = user?.role === 'super_admin';
  const params: ActivityLogQuery = { page, limit: 25, ...filters };
  const query = useQuery({
    queryKey: adminKeys.list('activity-logs', params),
    queryFn: ({ signal }) => adminApi.activityLogs(params, { signal }),
    placeholderData: keepPreviousData,
  });
  const refresh = () =>
    client.invalidateQueries({ queryKey: ['admin', 'activity-logs'] });
  const remove = useMutation({
    mutationFn: (log: ActivityLog) => adminApi.removeActivityLog(log.id),
    onSuccess: () => {
      setDeleting(null);
      void refresh();
    },
  });
  const purge = useMutation({
    mutationFn: () =>
      adminApi.purgeActivityLogs({ ...filters, before_date: retentionDate }),
    onSuccess: () => {
      setPurgeOpen(false);
      void refresh();
    },
  });

  const updateFilter = <Key extends keyof typeof filters>(
    key: Key,
    value: (typeof filters)[Key] | undefined,
  ) => {
    setFilters((current) => ({ ...current, [key]: value || undefined }));
    setPage(1);
  };

  return (
    <>
      <AdminPageHeader
        title={_copy('Activity Logs')}
        description={_copy(
          'Search and filter administrative activity. Super Admins can permanently remove records under a retention policy.',
        )}
      />
      <div className="mb-5 grid gap-3 border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="grid gap-1 text-sm font-semibold">
          {_copy('Search')}
          <Input
            aria-label={_copy('Search activity logs')}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder={_copy('Search admin or description')}
            value={filters.search ?? ''}
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          {_copy('Action')}
          <Input
            onChange={(e) => updateFilter('action', e.target.value)}
            placeholder={_copy('Filter by action')}
            value={filters.action ?? ''}
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          {_copy('Entity')}
          <Input
            onChange={(e) => updateFilter('table_name', e.target.value)}
            placeholder={_copy('Filter by entity')}
            value={filters.table_name ?? ''}
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          {_copy('Administrator ID')}
          <Input
            min="1"
            onChange={(e) => {
              const value = Number(e.target.value);
              updateFilter(
                'admin_id',
                Number.isInteger(value) && value > 0 ? value : undefined,
              );
            }}
            type="number"
            value={filters.admin_id ?? ''}
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          {_copy('From')}
          <Input
            onChange={(e) => updateFilter('start_date', e.target.value)}
            type="date"
            value={filters.start_date ?? ''}
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          {_copy('To')}
          <Input
            onChange={(e) => updateFilter('end_date', e.target.value)}
            type="date"
            value={filters.end_date ?? ''}
          />
        </label>
        <div className="flex items-end">
          <Button
            className="w-full"
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setPage(1);
            }}
            variant="outline"
          >
            {_copy('Reset filters')}
          </Button>
        </div>
      </div>
      {canDelete ? (
        <section className="mb-5 flex flex-col gap-3 border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-end sm:justify-between">
          <label className="grid max-w-xs gap-1 text-sm font-semibold">
            {_copy('Delete logs before')}
            <Input
              onChange={(e) => setRetentionDate(e.target.value)}
              type="date"
              value={retentionDate}
            />
          </label>
          <Button
            disabled={!retentionDate}
            onClick={() => setPurgeOpen(true)}
            variant="destructive"
          >
            {_copy('Delete matching logs')}
          </Button>
        </section>
      ) : null}
      <DataState
        loading={query.isPending}
        error={_copy(query.error?.userMessage)}
        empty={query.data?.items.length === 0}
      >
        <AdminTable>
          <table className="w-full min-w-[960px] text-start text-sm">
            <thead className="bg-surface-muted text-xs uppercase text-secondary">
              <tr>
                <th className="px-4 py-3">{_copy('Admin')}</th>
                <th className="px-4 py-3">{_copy('Action')}</th>
                <th className="px-4 py-3">{_copy('Entity')}</th>
                <th className="px-4 py-3">{_copy('Record')}</th>
                <th className="px-4 py-3">{_copy('Summary')}</th>
                <th className="px-4 py-3">{_copy('Date')}</th>
                {canDelete ? (
                  <th className="px-4 py-3">{_copy('Actions')}</th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {query.data?.items.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-4">
                    <p className="font-semibold">{_copy(log.admin.name)}</p>
                    <p className="text-xs text-muted-foreground">
                      #{_copy(log.admin.id)} {_copy('·')}{' '}
                      {_copy(log.admin.email)}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    {_copy(_copy.status(log.action))}
                  </td>
                  <td className="px-4 py-4">
                    {_copy(log.table_name ? _copy.status(log.table_name) : '—')}
                  </td>
                  <td className="px-4 py-4">{_copy(log.record_id ?? '—')}</td>
                  <td className="max-w-md px-4 py-4">
                    <p>{_copy(log.description ?? 'Administrative action')}</p>
                    {log.changes ? (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs font-semibold text-secondary">
                          {_copy('Raw metadata')}
                        </summary>
                        <pre className="mt-2 max-w-sm overflow-auto bg-surface-muted p-3 text-xs">
                          {_copy(JSON.stringify(log.changes, null, 2))}
                        </pre>
                      </details>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {_copy(_copy.date(log.created_at))}
                  </td>
                  {canDelete ? (
                    <td className="px-4 py-4">
                      <Button
                        aria-label={_copy('Delete activity log')}
                        onClick={() => setDeleting(log)}
                        size="icon"
                        variant="ghost"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTable>
      </DataState>
      <Pager
        page={page}
        totalPages={query.data?.meta.totalPages ?? 1}
        onPage={setPage}
      />
      <ConfirmDialog
        confirmLabel="Delete activity log"
        description="This permanently removes the selected audit record. This cannot be undone."
        destructive
        error={remove.error?.userMessage}
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        open={Boolean(deleting)}
        title="Delete activity log?"
      />
      <ConfirmDialog
        confirmLabel="Delete matching logs"
        description="This permanently removes all logs matching the selected filters that were created before the retention date. This cannot be undone."
        destructive
        error={purge.error?.userMessage}
        loading={purge.isPending}
        onConfirm={() => purge.mutate()}
        onOpenChange={setPurgeOpen}
        open={purgeOpen}
        title="Delete matching activity logs?"
      />
    </>
  );
}
