import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Order, OrderStatus } from '@/api/orders';

interface IncomingOrderProps {
  order: Order;
  children?: ReactNode;
  onStatusChange?: (orderId: string, status: string) => void;
}

const statusVariant: Record<OrderStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'secondary',
  CONFIRMED: 'outline',
  COMPLETED: 'default',
  CANCELLED: 'destructive',
};

function formatDate(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function IncomingOrder({ order, children }: IncomingOrderProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Table {order.table_session_id}</CardTitle>
            <CardDescription>
              Order #{order.id} · {formatDate(order.created_at)} · {order.items.length} item type{order.items.length === 1 ? '' : 's'}
            </CardDescription>
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
        <div className="mt-4 flex justify-between border-t border-border pt-3 font-semibold">
          <span>Order total</span>
          <span>฿{order.total.toFixed(2)}</span>
        </div>
        {children && <div className="mt-4">{children}</div>}
      </CardContent>
    </Card>
  );
}
