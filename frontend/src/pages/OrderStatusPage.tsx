import { useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  listSessionOrders,
  type Order,
  type OrderStatus,
} from "@/features/orders";
import { useAuth } from "@/features/auth";
import { usePolling } from "@/hooks/usePolling";
import { useQrSession } from "@/hooks/useQrSession";
import { OrderRound } from "@/components/order/OrderRound";

export default function OrderStatusPage() {
  const { sessionToken = "" } = useParams<{ sessionToken: string }>();
  const { token } = useAuth();
  const {
    sessionId,
    loading: resolvingSession,
    error: sessionError,
  } = useQrSession(sessionToken);
  const fetchOrders = useCallback(
    () => listSessionOrders(sessionId, token ?? undefined),
    [sessionId, token],
  );
  const {
    data: orders,
    error,
    loading,
    refresh,
  } = usePolling<Order[]>(fetchOrders, { enabled: Boolean(sessionId) });

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
              Order status
            </p>
            <h1 className="mt-2 text-3xl font-bold">Your order rounds</h1>
            <p className="mt-2 text-muted-foreground">
              Status refreshes automatically every few seconds.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => void refresh()}
              disabled={loading}
            >
              Refresh
            </Button>
            <Link
              className={buttonVariants({ variant: "outline" })}
              to={`/order/${sessionToken}/checkout`}
            >
              Checkout
            </Link>
            <Link className={buttonVariants()} to={`/order/${sessionToken}`}>
              Order more
            </Link>
          </div>
        </div>

        {sessionError || error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              {sessionError?.message ?? error?.message}
            </AlertDescription>
          </Alert>
        ) : null}
        {resolvingSession ? (
          <p className="py-12 text-center text-muted-foreground">
            Validating QR session...
          </p>
        ) : null}
        {loading && !orders ? (
          <p className="py-12 text-center text-muted-foreground">
            Loading order status...
          </p>
        ) : null}
        {!loading && orders?.length === 0 ? (
          <Alert>
            <AlertDescription>
              No order rounds have been placed yet.
            </AlertDescription>
          </Alert>
        ) : null}
        <div className="space-y-4">
          {orders?.map((order) => (
            <OrderRound key={order.id} order={order} />
          ))}
        </div>
      </div>
    </main>
  );
}
