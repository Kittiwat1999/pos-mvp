import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/features/auth';
import { closeSession, listTables, markTableCleaned, openTable, listTableSessions, type Table, type TableSession } from '@/features/tables';
import { useTable } from '@/hooks/useTable';
import {QRCodeGenerator} from '@/components/ui/qr';

type ManagedTable = Table & {
  session?: {
    token: string;
    openedAt: string;
    id?: string | number;
  };
};

const statusVariant = {
  AVAILABLE: 'default',
  OCCUPIED: 'secondary',
  CLEANING: 'warning',
} as const;

export default function TablesPage() {
  const { token } = useAuth();
  const [tables, setTables] = useState<ManagedTable[]>([]);
  const [tableSessions, setTableSessions] = useState<Record<string, TableSession>>({});
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedTable = tables.find((table) => table.id === selectedTableId) ?? null;
  const selectedTableSession = selectedTable ? tableSessions[String(selectedTable.id)] ?? null : null;
  const { canTransition, transitionTo } = useTable(selectedTable);

  const loadTables = async () => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const nextTables = await listTables(token);
      const nextSessions = await listTableSessions(token);
      setTables(nextTables.map((table) => ({
        id: String(table.id),
        name: table.name,
        status: table.status,
        created_at: table.created_at,
        updated_at: table.updated_at,
      })));

      setTableSessions(nextSessions.reduce((acc, session) => {
        acc[String(session.table_id)] = session;
        return acc;
      }, {} as Record<string, TableSession>));
      
      setSelectedTableId((current) => current && nextTables.some((table) => String(table.id) === current) ? current : null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTables();
  }, [token]);

  const handleOpenTable = async (table: ManagedTable) => {
    if (!token) return;

    setSubmitting(true);
    setError('');

    try {
      const session = await openTable(String(table.id), token);
      const nextTableId = String(table.id);

      setTables((current) => current.map((item) => item.id === nextTableId ? { ...item, status: 'OCCUPIED', session: { token: session.qr_token, openedAt: session.opened_at, id: session.id } } : item));
      setTableSessions((current) => ({ ...current, [nextTableId]: session }));
      setSelectedTableId(nextTableId);
      transitionTo('OCCUPIED');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to open table');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async (table: ManagedTable) => {
    const sessionId = table.session?.id ?? selectedTableSession?.id;
    if (!token || !sessionId) {
      setError('This table does not have an active session to close.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await closeSession(sessionId, token);
      setTables((current) => current.map((item) => item.id === table.id ? { ...item, status: 'CLEANING', session: undefined } : item));
      setTableSessions((current) => {
        const next = { ...current };
        delete next[String(table.id)];
        return next;
      });
      setSelectedTableId(null);
      transitionTo('CLEANING');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to close the table session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkCleaned = async (table: ManagedTable) => {
    if (!token) return;

    setSubmitting(true);
    setError('');

    try {
      await markTableCleaned(String(table.id), token);
      setTables((current) => current.map((item) => item.id === table.id ? { ...item, status: 'AVAILABLE', session: undefined } : item));
      setTableSessions((current) => {
        const next = { ...current };
        delete next[String(table.id)];
        return next;
      });
      if (selectedTableId === table.id) setSelectedTableId(null);
      transitionTo('AVAILABLE');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to mark the table as cleaned');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">POS</p>
            <h1 className="mt-2 text-3xl font-bold">Tables</h1>
            <p className="mt-2 text-muted-foreground">Open a table session, share its QR link, and manage checkout.</p>
          </div>
          <Link className={buttonVariants({ variant: 'outline' })} to="/dashboard">Back to dashboard</Link>
        </div>

        {error ? <Alert variant="destructive" className="mb-6"><AlertDescription>{error}</AlertDescription></Alert> : null}

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Table grid</CardTitle>
              <CardDescription>{loading ? 'Loading tables...' : `${tables.filter((table) => table.status === 'AVAILABLE').length} available · ${tables.filter((table) => table.status === 'OCCUPIED').length} occupied · ${tables.filter((table) => table.status === 'CLEANING').length} cleaning`}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? <p className="py-8 text-center text-muted-foreground">Loading tables...</p> : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {tables.map((table) => (
                    <button
                      key={table.id}
                      type="button"
                      className={`rounded-xl border p-4 text-left transition hover:border-primary ${selectedTableId === table.id ? 'border-primary ring-2 ring-primary/30' : 'border-border'}`}
                      onClick={() => setSelectedTableId(table.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">{table.name}</span>
                        <Badge variant={statusVariant[table.status]}>{table.status}</Badge>
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground">
                        {table.status === 'AVAILABLE' ? 'Ready to open' : table.status === 'OCCUPIED' ? 'Session in progress' : 'Needs cleaning'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{selectedTable ? selectedTable.name : 'Table actions'}</CardTitle>
              <CardDescription>{selectedTable ? 'Manage the current table session.' : 'Select a table to begin.'}</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedTable ? <p className="text-sm text-muted-foreground">Choose a table from the grid.</p> : (
                <div className="space-y-4">
                  {selectedTable.status === 'AVAILABLE' ? (
                    <Button onClick={() => void handleOpenTable(selectedTable)} className="w-full" disabled={submitting || !canTransition('OCCUPIED')}>
                      {submitting ? 'Opening...' : 'Open table'}
                    </Button>
                  ) : selectedTable.status === 'OCCUPIED' ? (
                    <>
                      <div className="rounded-lg border border-border bg-muted/30 p-4">
                        <p className="text-sm font-medium">Customer QR link</p>
                        {selectedTableSession?.qr_token ? (
                          <>
                          <Link className="mt-2 block break-all text-xs text-primary underline" to={`/order/${selectedTableSession.qr_token}`}>Scan to order</Link>
                          <QRCodeGenerator className="mt-2" url={`/order/${selectedTableSession.qr_token}`} />
                          </>
                        ) : (
                          <p className="mt-2 text-xs text-muted-foreground">QR token is loading...</p>
                        )}
                        <p className="mt-3 text-xs text-muted-foreground">A new token is generated whenever the table is opened.</p>
                      </div>
                      <Button variant="outline" className="w-full" onClick={() => void handleCheckout(selectedTable)} disabled={submitting}>
                        {submitting ? 'Closing...' : 'Checkout and close session'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Alert><AlertDescription>This table must be cleaned before it can be reused.</AlertDescription></Alert>
                      <Button className="w-full" onClick={() => void handleMarkCleaned(selectedTable)} disabled={submitting}>
                        {submitting ? 'Updating...' : 'Mark as cleaned'}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
