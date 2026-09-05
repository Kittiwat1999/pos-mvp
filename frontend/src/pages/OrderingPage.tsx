import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createQrOrder, type CreateOrderItemInput } from '@/features/orders';
import { listProducts, type Product } from '@/features/products';
import { useAuth } from '@/features/auth';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useQrSession } from '@/hooks/useQrSession';

type CartLine = CreateOrderItemInput & {
  name: string;
  price: number;
};

export default function OrderingPage() {
  const { sessionToken = '' } = useParams<{ sessionToken: string }>();
  const { token: authToken } = useAuth();
  const { sessionId, loading: resolvingSession, error: sessionError } = useQrSession(sessionToken);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    if (!cartOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCartOpen(false);
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [cartOpen]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    if (!sessionId) {
      setLoading(false);
      return;
    }

    setError('');
    listProducts({ active: true, search: debouncedSearch || undefined }, authToken ?? undefined)
      .then((result) => { if (!cancelled) setProducts(result); })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Unable to load the menu'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [authToken, debouncedSearch, sessionId]);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  const addProduct = (product: Product) => {
    setSubmitted(false);
    setCart((current) => {
      const existing = current.find((item) => item.product_id === product.id);
      if (existing) {
        return current.map((item) => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...current, { product_id: product.id, quantity: 1, name: product.name, price: product.price }];
    });
  };

  const changeQuantity = (productId: string, amount: number) => {
    setCart((current) => current.flatMap((item) => {
      if (item.product_id !== productId) return [item];
      const quantity = item.quantity + amount;
      return quantity > 0 ? [{ ...item, quantity }] : [];
    }));
  };

  const updateNote = (productId: string, note: string) => {
    setCart((current) => current.map((item) => item.product_id === productId ? { ...item, note } : item));
  };

  const submitOrder = async () => {
    if (!sessionId || cart.length === 0) {
      setError('Add at least one product before confirming the order.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await createQrOrder(sessionToken, { items: cart.map(({ product_id, quantity, note }) => ({ product_id, quantity, note })) }, authToken ?? undefined);
      setCart([]);
      setCartOpen(false);
      setSubmitted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to submit the order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen pb-24 p-4 md:p-6 lg:pb-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Menu</p>
            <h1 className="mt-2 text-3xl font-bold">Place an order</h1>
            <p className="mt-2 text-muted-foreground">Add items to your cart and confirm this order round.</p>
          </div>
          <div className="flex gap-2">
            <Link className={buttonVariants({ variant: 'outline' })} to={`/order/${sessionToken}/status`}>Order status</Link>
            {authToken ?
              <Link className={buttonVariants({ variant: 'outline' })} to="/tables">
                Back To Tables
              </Link> : null}
          </div>
        </div>

        {error || sessionError ? <Alert variant="destructive" className="mb-6"><AlertDescription>{error || sessionError?.message}</AlertDescription></Alert> : null}
        {submitted ? <Alert className="mb-6"><AlertDescription>Order submitted successfully. You can place another round whenever you are ready.</AlertDescription></Alert> : null}

        {resolvingSession ? <Alert className="mb-6"><AlertDescription>Validating QR session...</AlertDescription></Alert> : null}
        {!resolvingSession && sessionId ? <div className="mb-6 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">QR session active. You can place multiple order rounds during this visit.</div> : null}

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div><CardTitle>Available products</CardTitle><CardDescription>Only active menu items are shown.</CardDescription></div>
                <Input className="sm:max-w-xs" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search menu" aria-label="Search menu" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <p className="py-8 text-center text-muted-foreground">Loading menu...</p> : products.length === 0 ? <p className="py-8 text-center text-muted-foreground">No matching products.</p> : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {products.map((product) => (
                    <div key={product.id} className="rounded-xl border border-border p-4">
                      <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{product.name}</h2><p className="mt-1 text-sm text-muted-foreground">{product.description || 'Freshly prepared menu item'}</p></div><Badge variant="outline">฿{product.price.toFixed(2)}</Badge></div>
                      <Button className="mt-4 w-full" onClick={() => addProduct(product)}>Add to order</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hidden h-fit lg:sticky lg:top-6 lg:block">
            <CardHeader><CardTitle>Your order</CardTitle><CardDescription>{cart.length} item type{cart.length === 1 ? '' : 's'}</CardDescription></CardHeader>
            <CardContent>
              {cart.length === 0 ? <p className="py-6 text-sm text-muted-foreground">Your cart is empty.</p> : (
                <div className="space-y-5">
                  {cart.map((item) => (
                    <div key={item.product_id} className="border-b border-border pb-4 last:border-0">
                      <div className="flex items-center justify-between gap-3"><span className="font-medium">{item.name}</span><span>฿{(item.price * item.quantity).toFixed(2)}</span></div>
                      <div className="mt-3 flex items-center justify-between"><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => changeQuantity(item.product_id, -1)}>-</Button><span className="w-6 text-center">{item.quantity}</span><Button variant="outline" size="sm" onClick={() => changeQuantity(item.product_id, 1)}>+</Button></div><span className="text-sm text-muted-foreground">฿{item.price.toFixed(2)} each</span></div>
                      <Input className="mt-3" value={item.note ?? ''} onChange={(event) => updateNote(item.product_id, event.target.value)} placeholder="Note (optional)" aria-label={`Note for ${item.name}`} />
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-lg font-bold"><span>Total</span><span>฿{total.toFixed(2)}</span></div>
                  <Button className="w-full" onClick={() => void submitOrder()} disabled={submitting || resolvingSession || !sessionId}>{submitting ? 'Submitting...' : 'Confirm order'}</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Button
        className="fixed inset-x-4 bottom-4 z-30 flex h-12 items-center justify-between rounded-full px-5 shadow-lg lg:hidden"
        onClick={() => setCartOpen(true)}
        aria-label={`View cart with ${cart.reduce((sum, item) => sum + item.quantity, 0)} items`}
      >
        <span>View cart · {cart.reduce((sum, item) => sum + item.quantity, 0)} item{cart.reduce((sum, item) => sum + item.quantity, 0) === 1 ? '' : 's'}</span>
        <span>฿{total.toFixed(2)}</span>
      </Button>

      {cartOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-end bg-black/50 p-0 sm:items-center sm:p-4 lg:hidden animate-[cart-fade-in_180ms_ease-out]"
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}
        >
          <section
            className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-background shadow-2xl sm:mx-auto sm:max-w-lg sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-dialog-title"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 id="cart-dialog-title" className="text-lg font-semibold">Your order</h2>
                <p className="text-sm text-muted-foreground">{cart.length} item type{cart.length === 1 ? '' : 's'}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setCartOpen(false)}>Close</Button>
            </div>
            <div className="p-5">
              {cart.length === 0 ? <p className="py-6 text-sm text-muted-foreground">Your cart is empty.</p> : (
                <div className="space-y-5">
                  {cart.map((item) => (
                    <div key={item.product_id} className="border-b border-border pb-4 last:border-0">
                      <div className="flex items-center justify-between gap-3"><span className="font-medium">{item.name}</span><span>฿{(item.price * item.quantity).toFixed(2)}</span></div>
                      <div className="mt-3 flex items-center justify-between"><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => changeQuantity(item.product_id, -1)}>-</Button><span className="w-6 text-center">{item.quantity}</span><Button variant="outline" size="sm" onClick={() => changeQuantity(item.product_id, 1)}>+</Button></div><span className="text-sm text-muted-foreground">฿{item.price.toFixed(2)} each</span></div>
                      <Input className="mt-3" value={item.note ?? ''} onChange={(event) => updateNote(item.product_id, event.target.value)} placeholder="Note (optional)" aria-label={`Note for ${item.name}`} />
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-lg font-bold"><span>Total</span><span>฿{total.toFixed(2)}</span></div>
                  <Button className="w-full" onClick={() => void submitOrder()} disabled={submitting || resolvingSession || !sessionId}>{submitting ? 'Submitting...' : 'Confirm order'}</Button>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
