import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  createCategory,
  createProduct,
  listCategories,
  listProducts,
  updateProduct,
  type Category,
  type Product,
} from '@/features/products';
import { useAuth } from '@/features/auth';

export default function ProductsPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadCatalog = async () => {
    if (!token) return;

    setLoading(true);
    setError('');
    try {
      const [nextCategories, nextProducts] = await Promise.all([
        listCategories(token),
        listProducts(undefined, token),
      ]);
      setCategories(nextCategories);
      setProducts(nextProducts);
      setProductCategory((current) => current || nextCategories[0]?.id || '');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load the catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCatalog();
  }, [token]);

  const handleCreateCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !categoryName.trim()) return;

    setSaving(true);
    setError('');
    try {
      const category = await createCategory({ name: categoryName.trim(), active: true }, token);
      setCategories((current) => [...current, category]);
      setProductCategory(category.id);
      setCategoryName('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create the category');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const price = Number(productPrice);
    if (!token || !productName.trim() || !productCategory || !Number.isFinite(price) || price < 0) {
      setError('Enter a product name, category, and valid non-negative price.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const product = await createProduct({
        name: productName.trim(),
        category_id: productCategory,
        price,
        active: true,
      }, token);
      setProducts((current) => [...current, product]);
      setProductName('');
      setProductPrice('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create the product');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleProduct = async (product: Product) => {
    if (!token) return;

    setError('');
    try {
      const updated = await updateProduct(product.id, { active: !product.active }, token);
      setProducts((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update the product');
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Catalog</p>
            <h1 className="mt-2 text-3xl font-bold">Products and categories</h1>
            <p className="mt-2 text-muted-foreground">Manage the active menu used by POS and QR ordering.</p>
          </div>
          <Link className={buttonVariants({ variant: 'outline' })} to="/dashboard">Back to dashboard</Link>
        </div>

        {error ? <Alert variant="destructive" className="mb-6"><AlertDescription>{error}</AlertDescription></Alert> : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>New category</CardTitle>
                <CardDescription>Create a menu grouping for products.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="flex gap-3" onSubmit={handleCreateCategory}>
                  <Input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="e.g. Drinks" />
                  <Button type="submit" disabled={saving || !categoryName.trim()}>Add</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>New product</CardTitle>
                <CardDescription>Add an item to the menu.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleCreateProduct}>
                  <Input value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="Product name" />
                  <Input type="number" min="0" step="0.01" value={productPrice} onChange={(event) => setProductPrice(event.target.value)} placeholder="Price" />
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={productCategory}
                    onChange={(event) => setProductCategory(event.target.value)}
                    aria-label="Product category"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                  <Button type="submit" disabled={saving || categories.length === 0}>Add product</Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Menu items</CardTitle>
                  <CardDescription>{products.length} product{products.length === 1 ? '' : 's'}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => void loadCatalog()} disabled={loading}>Refresh</Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <p className="py-8 text-center text-muted-foreground">Loading catalog...</p> : products.length === 0 ? <p className="py-8 text-center text-muted-foreground">No products yet.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border text-muted-foreground">
                      <tr><th className="px-3 py-3 font-medium">Product</th><th className="px-3 py-3 font-medium">Price</th><th className="px-3 py-3 font-medium">Status</th><th className="px-3 py-3" /></tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-4 font-medium">{product.name}</td>
                          <td className="px-3 py-4">฿{product.price.toFixed(2)}</td>
                          <td className="px-3 py-4"><Badge variant={product.active ? 'default' : 'secondary'}>{product.active ? 'Active' : 'Inactive'}</Badge></td>
                          <td className="px-3 py-4 text-right"><Button variant="ghost" size="sm" onClick={() => void handleToggleProduct(product)}>{product.active ? 'Deactivate' : 'Activate'}</Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
