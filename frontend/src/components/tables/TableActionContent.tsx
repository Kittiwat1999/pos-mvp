import { Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { QRCodeGenerator } from '@/components/ui/qr';
import type { Table, TableSession } from '@/features/tables';

export type ManagedTable = Table & {
  session?: {
    token: string;
    openedAt: string;
    id?: string | number;
  };
};

export interface TableActionContentProps {
  table: ManagedTable;
  session: TableSession | null;
  submitting: boolean;
  canTransition: (nextStatus: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING') => boolean;
  onOpenTable: (table: ManagedTable) => Promise<void> | void;
  onCheckout: (table: ManagedTable) => Promise<void> | void;
  onMarkCleaned: (table: ManagedTable) => Promise<void> | void;
}

export default function TableActionContent({
  table,
  session,
  submitting,
  canTransition,
  onOpenTable,
  onCheckout,
  onMarkCleaned,
}: TableActionContentProps) {
  const qrToken = session?.qr_token ?? table.session?.token;

  if (table.status === 'AVAILABLE') {
    return (
      <Button
        onClick={() => void onOpenTable(table)}
        className="w-full"
        disabled={submitting || !canTransition('OCCUPIED')}
      >
        {submitting ? 'Opening...' : 'Open table'}
      </Button>
    );
  }

  if (table.status === 'OCCUPIED') {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium">Customer QR link</p>
          {qrToken ? (
            <>
              <Link
                className="mt-2 block break-all text-xs text-primary underline"
                to={`/order/${qrToken}`}
              >
                Scan to order
              </Link>
              <div className="mt-2 flex justify-center sm:justify-start">
                <QRCodeGenerator url={`/order/${qrToken}`} />
              </div>
            </>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">QR token is loading...</p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            A new token is generated whenever the table is opened.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => void onCheckout(table)}
          disabled={submitting}
        >
          {submitting ? 'Closing...' : 'Checkout and close session'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          This table must be cleaned before it can be reused.
        </AlertDescription>
      </Alert>
      <Button
        className="w-full"
        onClick={() => void onMarkCleaned(table)}
        disabled={submitting}
      >
        {submitting ? 'Updating...' : 'Mark as cleaned'}
      </Button>
    </div>
  );
}
