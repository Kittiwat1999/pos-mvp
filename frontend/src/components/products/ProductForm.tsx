import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createProduct,
  type Category,
  type Product,
  updateProduct,
} from "@/features/products";
import {
  productFormSchema,
  type ProductFormInput,
  type ProductFormValues,
} from "@/features/products/productFormSchema";
import { BiPlus } from "react-icons/bi";
import { BiArrowToTop } from "react-icons/bi";

type ProductFormProps = {
  categories: Category[];
  token: string;
  onEdit: boolean;
  onCreated: (product: Product) => void;
  onEditCencel: () => void;
  selectedProduct: Product | null;
};

export function ProductForm({
  categories,
  token,
  onCreated,
  onEdit,
  onEditCencel,
  selectedProduct,
}: ProductFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      price: undefined,
      category_id: "",
      description: "",
      image: null,
    },
  });
  const image = form.watch("image");
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProduct?.image_url) {
      setExistingImageUrl(selectedProduct.image_url);
    } else {
      setExistingImageUrl(null);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (!selectedProduct) {
      form.reset({
        name: "",
        price: undefined,
        category_id: "",
        description: "",
        image: null,
      });
      return;
    }

    form.reset({
      name: selectedProduct.name,
      price: selectedProduct.price,
      category_id: String(selectedProduct.category_id),
      description: selectedProduct.description ?? "",
      image: null,
    });
  }, [selectedProduct, form]);

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const handleSave = async (values: ProductFormValues) => {
    try {
      if (onEdit && selectedProduct) {
        const updated = await updateProduct(
          selectedProduct.id,
          {
            name: values.name,
            price: values.price,
            category_id: values.category_id,
            description: values.description || undefined,
            image: values.image ?? undefined,
            active: selectedProduct.active,
          },
          token,
        );
        onCreated(updated);
        onEditCencel();
        toast.success("Product updated successfully");
        return;
      }

      const product = await createProduct(
        {
          name: values.name,
          price: values.price,
          category_id: values.category_id,
          description: values.description || undefined,
          image: values.image,
          active: true,
        },
        token,
      );
      onCreated(product);
      form.reset({
        name: "",
        price: undefined,
        category_id: "",
        description: "",
        image: null,
      });
      toast.success("Product created successfully");
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Unable to save the product",
      );
    }
  };

  const clearImage = () => {
    form.setValue("image", null, { shouldValidate: true });
    setExistingImageUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{onEdit ? "Edit product" : "New product"}</CardTitle>
        <CardDescription>
          {onEdit
            ? "Update this menu item and replace the image if needed."
            : "Add an item to the menu, including an optional image."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={
                          (field.value as string | number | undefined) ?? ""
                        }
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Select {...field} value={field.value ?? ""}>
                        <option value="">Select category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="image"
              render={({ field: { onChange } }) => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <FormControl>
                    <div
                      className="rounded-lg border border-dashed border-input p-4 text-center transition-colors hover:border-primary"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        onChange(event.dataTransfer.files[0] ?? null);
                      }}
                    >
                      <Input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) =>
                          onChange(event.target.files?.[0] ?? null)
                        }
                      />
                      {previewUrl || existingImageUrl ? (
                        <div className="relative mx-auto max-w-xs">
                          <img
                            src={previewUrl ?? existingImageUrl ?? undefined}
                            alt="Selected product preview"
                            className="h-40 w-full rounded-md object-cover"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="absolute right-2 top-2"
                            onClick={clearImage}
                            aria-label="Remove image"
                          >
                            <X />
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="flex w-full flex-col items-center gap-2 py-5 text-sm text-muted-foreground"
                          onClick={() => inputRef.current?.click()}
                        >
                          <Upload className="size-6" />
                          <span>Drop an image here or choose a file</span>
                        </button>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    JPEG, PNG, WebP, or GIF up to 5MB.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-row items-center gap-2">
              {onEdit ? (
                <Button variant="outline" onClick={onEditCencel}>
                  <X/>
                  Cancel
                </Button>
              ) : null}
              <Button
                type="submit"
                disabled={
                  form.formState.isSubmitting || categories.length === 0
                }
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    {!onEdit ? (
                      <>
                        <BiPlus /> Add product
                      </>
                    ) : (
                      <>
                        <BiArrowToTop /> Update product
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
