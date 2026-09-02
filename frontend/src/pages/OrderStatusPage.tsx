import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listSessionOrders, type Order, type OrderStatus } from '@/features/orders';
import { useAuth } from '@/features/auth';
import { usePolling } from '@/hooks/usePolling';
import { useQrSession } from '@/hooks/useQrSession';

const statusVariant: Record<OrderStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'secondary',
  CONFIRMED: 'outline',
  COMPLETED: 'default',
  CANCELLED: 'destructive',
};

function formatDate(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function OrderRound({ order }: { order: Order }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Order round #{order.id}</CardTitle>
            <CardDescription>{formatDate(order.created_at)} · {order.items.length} item type{order.items.length === 1 ? '' : 's'}</CardDescription>
          </div>
          <Badge variant={statusVariant[order.status]}>{order.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 text-sm">
              <span>{item.quantity} × {item.product_name ?? item.product_id}{item.note ? ` — ${item.note}` : ''}</span>
              <span>฿{(item.unit_price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between border-t border-border pt-3 font-semibold"><span>Round total</span><span>฿{order.total.toFixed(2)}</span></div>
      </CardContent>
    </Card>
  );
}

export default function OrderStatusPage() {
  const { sessionToken = '' } = useParams<{ sessionToken: string }>();
  const { token } = useAuth();
  const { sessionId, loading: resolvingSession, error: sessionError } = useQrSession(sessionToken);
  const fetchOrders = useCallback(() => listSessionOrders(sessionId, token ?? undefined), [sessionId, token]);
  const { data: orders, error, loading, refresh } = usePolling<Order[]>(fetchOrders, { enabled: Boolean(sessionId) });

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Order status</p>
            <h1 className="mt-2 text-3xl font-bold">Your order rounds</h1>
            <p className="mt-2 text-muted-foreground">Status refreshes automatically every few seconds.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void refresh()} disabled={loading}>Refresh</Button>
            <Link className={buttonVariants({ variant: 'outline' })} to={`/order/${sessionToken}/checkout`}>Checkout</Link>
            <Link className={buttonVariants()} to={`/order/${sessionToken}`}>Order more</Link>
          </div>
        </div>

        {sessionError || error ? <Alert variant="destructive" className="mb-6"><AlertDescription>{sessionError?.message ?? error?.message}</AlertDescription></Alert> : null}
        {resolvingSession ? <p className="py-12 text-center text-muted-foreground">Validating QR session...</p> : null}
        {loading && !orders ? <p className="py-12 text-center text-muted-foreground">Loading order status...</p> : null}
        {!loading && orders?.length === 0 ? <Alert><AlertDescription>No order rounds have been placed yet.</AlertDescription></Alert> : null}
        <div className="space-y-4">{orders?.map((order) => <OrderRound key={order.id} order={order} />)}</div>
      </div>
    </main>
  );
}
