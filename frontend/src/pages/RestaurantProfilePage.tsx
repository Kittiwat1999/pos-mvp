import { useEffect, useRef, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  ImagePlus,
  MapPin,
  Phone,
  Save,
  Store,
  Upload,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SettingsSidebar from "@/components/layout/SettingsSidebar";
import { cn } from "@/lib/utils";
import {
  restaurantFormSchema,
  type restaurantFormInput,
  type restaurantFormValues,
} from "@/features/restaurants/restaurantFormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateRestaurant,
  getRestaurant,
  updateServicesType,
  type ServiceType,
} from "@/features/restaurants";
import { useAuth } from "@/features/auth";

export default function RestaurantProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuth();
  const form = useForm<restaurantFormInput, unknown, restaurantFormValues>({
    resolver: zodResolver(restaurantFormSchema),
    defaultValues: {
      name: "",
      phone_number: "",
      address: "",
      image: null,
    },
  });
  const image = form.watch("image");
  const { register, setValue, handleSubmit, formState } = form;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [services, setServices] = useState<ServiceType[]>([]);

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const loadRestaurant = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const response = await getRestaurant(token);
      const restaurant = response.restaurant;
      setServices(response.service_types);
      setExistingImageUrl(restaurant.image_url);
      form.reset({
        name: restaurant.name,
        phone_number: restaurant.phone_number,
        address: restaurant.address,
        image: null,
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load the restaurant profile.",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadRestaurant();
  }, [loadRestaurant]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    setValue("image", file, { shouldValidate: true });
    toast.success("Logo preview updated");
  };

  const handleSave = async (values: restaurantFormValues) => {
    try {
      await updateRestaurant(
        {
          name: values.name,
          phone_number: values.phone_number,
          address: values.address,
          image: values.image,
        },
        token ?? undefined,
      );
      toast.success("Restaurant profile saved");
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Unable to save the restaurant profile",
      );
    }
  };

  const toggleService = async (service: ServiceType) => {
    const nextActive = !service.active;
    try {
      const updated = await updateServicesType(
        service.id,
        { active: nextActive },
        token ?? undefined,
      );

      setServices((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success("Service type saved.");
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Unable to save the Service type",
      );
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-background p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              className={cn(
                buttonVariants({ variant: "link", size: "sm" }),
                "mb-3 -ml-2",
              )}
              to="/dashboard"
            >
              <ArrowLeft />
              Back to dashboard
            </Link>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
              Settings
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Restaurant profile
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Keep the details your team and guests see across the POS
              experience.
            </p>
          </div>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
            <span className="size-2 rounded-full bg-primary" />
            Changes are ready to save
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <SettingsSidebar />

          <form
            className="min-w-0 space-y-6"
            onSubmit={handleSubmit(handleSave)}
          >
            <Card>
              <CardHeader className="border-b border-border">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Store className="size-5" />
                  </div>
                  <div>
                    <CardTitle>Business details</CardTitle>
                    <CardDescription className="mt-1">
                      The essentials for receipts, ordering, and staff
                      workflows.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-5 pt-6 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  Restaurant name <span className="text-destructive">*</span>
                  <Input
                    {...register("name")}
                    placeholder="Your Restaurant Name"
                  />
                  {formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {formState.errors.name.message}
                    </p>
                  )}
                </label>
                <label className="space-y-2 text-sm font-medium">
                  Phone number <span className="text-destructive">*</span>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...register("phone_number")}
                      className="pl-9"
                      inputMode="tel"
                    />
                    {formState.errors.phone_number && (
                      <p className="text-sm text-destructive">
                        {formState.errors.phone_number.message}
                      </p>
                    )}
                  </div>
                </label>
                <label className="space-y-2 text-sm font-medium md:col-span-2">
                  Address <span className="text-destructive">*</span>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
                    <Textarea
                      {...register("address")}
                      className="min-h-24 pl-9"
                    />
                    {formState.errors.address && (
                      <p className="text-sm text-destructive">
                        {formState.errors.address.message}
                      </p>
                    )}
                  </div>
                </label>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle>Brand identity</CardTitle>
                <CardDescription className="mt-1">
                  Give your staff console and receipts a recognizable mark.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5 pt-6 sm:flex-row sm:items-center">
                <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-primary/40 bg-primary/5 text-primary">
                  {previewUrl || existingImageUrl ? (
                    <img
                      src={previewUrl ?? existingImageUrl ?? undefined}
                      alt="Restaurant logo preview"
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImagePlus className="size-8" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Restaurant logo</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    PNG or JPG, recommended as a square image.
                  </p>
                  <input
                    ref={fileInputRef}
                    className="sr-only"
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleLogoChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload />
                    Upload logo
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle>Service types</CardTitle>
                <CardDescription className="mt-1">
                  Choose how guests can place orders at your restaurant.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 pt-6 md:grid-cols-2">
                {services.map((service) => (
                  <button
                    key={service.name + service.id}
                    type="button"
                    role="switch"
                    aria-checked={service.active}
                    onClick={() => toggleService(service)}
                    className={cn(
                      "flex items-center justify-between gap-4 rounded-xl border p-4 text-left transition-colors",
                      service.active
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-background hover:bg-muted/60",
                    )}
                  >
                    <span>
                      <span className="block font-medium">{service.name}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {service.description}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                        service.active ? "bg-primary" : "bg-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-1 size-4 rounded-full bg-white shadow-sm transition-transform",
                          service.active ? "translate-x-6" : "translate-x-1",
                        )}
                      />
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>

            <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Discard changes
              </Button>
              <Button type="submit" disabled={formState.isSubmitting}>
                <Save />
                {formState.isSubmitting ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
