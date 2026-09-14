import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProductForm } from "@/components/products/ProductForm";
import { ProductList } from "@/components/products/ProductList";
import {
  createCategory,
  listCategories,
  listProducts,
  updateProduct,
  type Category,
  type Product,
} from "@/features/products";
import { useAuth } from "@/features/auth";
import ActionConfirmModal from "@/components/common/ActionConfirmModal";
import { IoMdHome } from "react-icons/io";

export default function ProductsPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [queryCategory, setQueryCategory] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState<boolean>(false);
  const [formOnEdit, setFormOnEdit] = useState<boolean>(false);
  const [productTotalCount, setProductTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const loadCatalog = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [nextCategories, nextProducts] = await Promise.all([
        listCategories(token),
        listProducts(
          {
            page: currentPage,
            display: 10,
            category_id: queryCategory || undefined,
            search: search || undefined,
          },
          token,
        ),
      ]);
      setCategories(nextCategories);
      setProducts(nextProducts.items);
      setProductTotalCount(nextProducts.total_count)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load the catalog",
      );
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, queryCategory, search]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const handleCreateCategory = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!token || !categoryName.trim()) return;
    try {
      const category = await createCategory(
        { name: categoryName.trim(), active: true },
        token,
      );
      setCategories((current) => [...current, category]);
      setCategoryName("");
      toast.success("Category created successfully");
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Unable to create the category",
      );
    }
  };

  const handleToggle = async (product: Product) => {
    if (!token) return;
    try {
      const updated = await updateProduct(
        product.id,
        { active: !product.active },
        token,
      );
      setProducts((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success(`Product ${updated.active ? "activated" : "deactivated"}`);
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Unable to update the product",
      );
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
              Catalog
            </p>
            <h1 className="mt-2 text-3xl font-bold">Products and categories</h1>
            <p className="mt-2 text-muted-foreground">
              Manage the active menu used by POS and QR ordering.
            </p>
          </div>
          <Link
            className={buttonVariants({ variant: "outline" })}
            to="/dashboard"
          >
            <IoMdHome />
            Back To Dashboard
          </Link>
        </div>
        {error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>New category</CardTitle>
                <CardDescription>
                  Create a menu grouping for products.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="flex gap-3" onSubmit={handleCreateCategory}>
                  <Input
                    value={categoryName}
                    onChange={(event) => setCategoryName(event.target.value)}
                    placeholder="e.g. Drinks"
                  />
                  <Button type="submit" disabled={!categoryName.trim()}>
                    Add
                  </Button>
                </form>
              </CardContent>
            </Card>
            {token ? (
              <ProductForm
                categories={categories}
                token={token}
                onCreated={(product) =>
                  setProducts((current) => {
                    const exists = current.some((item) => item.id === product.id);
                    return exists
                      ? current.map((item) => (item.id === product.id ? product : item))
                      : [...current, product];
                  })
                }
                onEdit={formOnEdit}
                onEditCencel={() => {
                  setSelectedProduct(null);
                  setFormOnEdit(false);
                }}
                selectedProduct={selectedProduct}
              />
            ) : null}
          </div>
          <ProductList
            products={products}
            pageCount={Math.ceil(productTotalCount / 10)}
            currentPage={currentPage}
            categories={categories}
            loading={loading}
            category={queryCategory}
            search={search}
            onCategoryChange={setQueryCategory}
            onSearchChange={setSearch}
            onRefresh={() => void loadCatalog()}
            onToggle={(product) => {
              if (product.active) {
                setSelectedProduct(product);
                setShowDeactivateModal(true);
              } else {
                void handleToggle(product);
              }
            }}
            onEdit={(product) => {
              setSelectedProduct(product);
              setFormOnEdit(true);
            }}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
      <ActionConfirmModal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        onConfirm={() => {
          if (selectedProduct) void handleToggle(selectedProduct);
          setShowDeactivateModal(false);
        }}
        variant="warning"
        title="Deactivate this product?"
        description="Guests will no longer be able to purchase this product."
        confirmText="Deactivate product"
      />
    </main>
  );
}
