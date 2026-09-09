import { useCallback, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  checkoutSession,
  listSessionOrders,
  type Order,
  type PaymentMethod,
} from "@/features/orders";
import { useAuth } from "@/features/auth";
import { usePolling } from "@/hooks/usePolling";
import { useQrSession } from "@/hooks/useQrSession";

export default function CheckoutPage() {
  const { sessionToken = "" } = useParams<{ sessionToken: string }>();
  const { token } = useAuth();
  const {
    sessionId,
    loading: resolvingSession,
    error: sessionError,
  } = useQrSession(sessionToken);
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [submitting, setSubmitting] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState("");
  const fetchOrders = useCallback(
    () => listSessionOrders(sessionId, token ?? undefined),
    [sessionId, token],
  );
  const { data: orders, loading } = usePolling<Order[]>(fetchOrders, {
    enabled: Boolean(sessionId),
  });
  const billableOrders = useMemo(
    () => orders?.filter((order) => order.status !== "CANCELLED") ?? [],
    [orders],
  );
  const total = useMemo(
    () => billableOrders.reduce((sum, order) => sum + order.total, 0),
    [billableOrders],
  );

  const confirmCheckout = async () => {
    if (!sessionId || total <= 0) {
      setError("There is no billable amount for this session.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await checkoutSession(sessionId, method, token ?? undefined);
      setPaid(true);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to complete checkout",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            Checkout
          </p>
          <h1 className="mt-2 text-3xl font-bold">Complete payment</h1>
          <p className="mt-2 text-muted-foreground">
            The bill includes every non-cancelled order round in this session.
          </p>
        </div>

        {sessionError || error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              {sessionError?.message ?? error}
            </AlertDescription>
          </Alert>
        ) : null}
        {resolvingSession ? (
          <Alert className="mb-6">
            <AlertDescription>Validating QR session...</AlertDescription>
          </Alert>
        ) : null}
        {paid ? (
          <Card>
            <CardHeader>
              <CardTitle>Payment complete</CardTitle>
              <CardDescription>
                This table session has been checked out successfully.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link className={buttonVariants()} to="/">
                Return home
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bill summary</CardTitle>
                <CardDescription>
                  {loading
                    ? "Loading order rounds..."
                    : `${billableOrders.length} billable order round${billableOrders.length === 1 ? "" : "s"}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {billableOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex justify-between text-sm"
                    >
                      <span>Order round #{order.id}</span>
                      <span>฿{order.total.toFixed(2)}</span>
                    </div>
                  ))}
                  {!loading && billableOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No billable orders found.
                    </p>
                  ) : null}
                  <div className="flex justify-between border-t border-border pt-4 text-xl font-bold">
                    <span>Total</span>
                    <span>฿{total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Payment method</CardTitle>
                <CardDescription>
                  Choose how this session will be paid.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["CASH", "QR_PAYMENT"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setMethod(option)}
                      className={`rounded-lg border p-4 text-left ${method === option ? "border-primary ring-2 ring-primary/30" : "border-border"}`}
                    >
                      <p className="font-medium">
                        {option === "CASH" ? "Cash" : "QR payment"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {option === "CASH"
                          ? "Collect payment at the counter."
                          : "Collect payment using a QR code."}
                      </p>
                    </button>
                  ))}
                </div>
                <Button
                  className="mt-6 w-full"
                  onClick={() => void confirmCheckout()}
                  disabled={submitting || loading || total <= 0}
                >
                  {submitting
                    ? "Processing..."
                    : `Confirm ${method === "CASH" ? "cash" : "QR payment"} · ฿${total.toFixed(2)}`}
                </Button>
                <Link
                  className="mt-3 block text-center text-sm text-muted-foreground underline"
                  to={`/order/${sessionToken}/status`}
                >
                  Back to order status
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
