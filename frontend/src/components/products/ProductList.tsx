import { ImageOff } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Category, Product } from "@/features/products";
import { ProductImage } from "@/components/products/ProductImage";

type ProductListProps = {
  products: Product[];
  categories: Category[];
  loading: boolean;
  category: string;
  search: string;
  onCategoryChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onToggle: (product: Product) => void;
};

export function ProductList({
  products,
  categories,
  loading,
  category,
  search,
  onCategoryChange,
  onSearchChange,
  onRefresh,
  onToggle,
}: ProductListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Menu items</CardTitle>
            <CardDescription>
              {products.length} product{products.length === 1 ? "" : "s"}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <Select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search menu"
            aria-label="Search menu"
          />
        </div>
        {loading ? (
          <p className="py-8 text-center text-muted-foreground">
            Loading catalog...
          </p>
        ) : products.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No products yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 font-medium">Product</th>
                  <th className="px-3 py-3 font-medium">Price</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        <ProductImage productName={product.name} imageUrl={product.image_url || undefined} imageSize="small" />
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4">฿{product.price.toFixed(2)}</td>
                    <td className="px-3 py-4">
                      <Badge variant={product.active ? "default" : "secondary"}>
                        {product.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-3 py-4 text-right">
                      <Button
                        variant={product.active ? "secondary" : "default"}
                        size="sm"
                        onClick={() => onToggle(product)}
                      >
                        {product.active ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
