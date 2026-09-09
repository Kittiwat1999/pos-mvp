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
} from "@/features/products";
import {
  productFormSchema,
  type ProductFormInput,
  type ProductFormValues,
} from "@/features/products/productFormSchema";

type ProductFormProps = {
  categories: Category[];
  token: string;
  onCreated: (product: Product) => void;
};

export function ProductForm({
  categories,
  token,
  onCreated,
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

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const submit = async (values: ProductFormValues) => {
    try {
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
        category_id: values.category_id,
        description: "",
        image: null,
      });
      toast.success("Product created successfully");
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Unable to create the product",
      );
    }
  };

  const clearImage = () => {
    form.setValue("image", null, { shouldValidate: true });
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New product</CardTitle>
        <CardDescription>
          Add an item to the menu, including an optional image.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
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
                        value={field.value as number | undefined}
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
                      <Select {...field}>
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
                      {previewUrl ? (
                        <div className="relative mx-auto max-w-xs">
                          <img
                            src={previewUrl}
                            alt="Selected product preview"
                            className="h-40 w-full rounded-md object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
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
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || categories.length === 0}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <ImagePlus /> Add product
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
