import { Button, buttonVariants } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type OrderStatus,
  type Order,
  listOrders,
  updateOrderStatusById,
  canTransition,
  ALLOWED_TRANSITIONS,
  orderStatusToButtonActions,
} from "@/features/orders";
import { useAuth } from "@/features/auth/useAuth";
import { Link, useParams } from "react-router-dom";
import { useCallback, useState } from "react";
import { IncomingOrder } from "@/components/order/IncomingOrder";
import { usePolling } from "@/hooks/usePolling";
import { toast } from "sonner";

const statusVariant: Record<
  OrderStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  PENDING: "secondary",
  CONFIRMED: "outline",
  COMPLETED: "default",
  CANCELLED: "destructive",
};

const orderStatus: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
];

export default function IncommingOrdersPage() {
  const { token } = useAuth();
  const [status, setStatus] = useState<OrderStatus>("PENDING");
  const fetchOrders = useCallback(
    () => listOrders(status, token ?? undefined),
    [token, status],
  );
  const {
    data: orders,
    error,
    loading,
    refresh,
    setData,
  } = usePolling<Order[]>(fetchOrders, { enabled: Boolean(token) });

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    if (canTransition(status, newStatus)) {
      setData((prevOrders) => {
        if (!prevOrders) return prevOrders;
        return prevOrders.filter((order) => order.id !== orderId);
      });
      updateOrderStatusById(orderId, newStatus, token ?? undefined);
      toast.success(`Updating order ${orderId} to status ${newStatus}`);
    } else {
      toast.error(`Cannot transition from ${status} to ${newStatus}`);
    }
  };

  const actions = (orderId: string, status: OrderStatus) => {
    return (
      <div className="flex justify-end gap-2">
        {ALLOWED_TRANSITIONS[status].map((nextStatus) => (
          <Button
            key={nextStatus}
            variant={statusVariant[nextStatus]}
            onClick={() => handleStatusChange(orderId, nextStatus)}
          >
            {orderStatusToButtonActions[nextStatus]}
          </Button>
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
              POS
            </p>
            <h1 className="mt-2 text-3xl font-bold">Incoming Orders</h1>
            <p className="mt-2 text-muted-foreground">
              Review and manage orders submitted from your tables.
            </p>
          </div>
          <Link
            className={buttonVariants({ variant: "outline" })}
            to="/dashboard"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="space-y-4 mb-4">
          {orderStatus.map((status) => (
            <Button
              key={status}
              variant={statusVariant[status]}
              onClick={() => setStatus(status)}
              className="mr-3 justify-between"
            >
              <span>{status}</span>
              {/* <span className="text-xs text-muted-foreground">10000</span> */}
            </Button>
          ))}
        </div>

        <div className="space-y-4">
          {orders && orders.length > 0 ? (
            orders.map((order) => (
              <IncomingOrder key={order.id} order={order}>
                {actions(order.id, order.status)}
              </IncomingOrder>
            ))
          ) : loading ? (
            <p className="py-12 text-center text-muted-foreground">
              Loading orders...
            </p>
          ) : error ? (
            <p className="py-12 text-center text-destructive">
              {error.message}
            </p>
          ) : (
            <p className="py-12 text-center text-muted-foreground">
              No orders found.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
