import { z } from "zod";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const restaurantFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Product name is required")
    .max(150, "Name must be 150 characters or fewer"),

  phone_number: z
    .string()
    .max(50, "Phone number must be 50 characters or fewer")
    .optional()
    .or(z.literal("")),

  address: z
    .string()
    .max(255, "Address must be 255 characters or fewer")
    .optional()
    .or(z.literal("")),

  image: z
    .custom<File | null>(
      (value) => value === null || value === undefined || value instanceof File,
      {
        message: "Invalid image file",
      },
    )
    .nullable()
    .optional()
    .refine(
      (file) =>
        !file ||
        ALLOWED_IMAGE_TYPES.includes(
          file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
        ),
      "Use a JPEG, PNG, WebP, or GIF image",
    )
    .refine(
      (file) => !file || file.size <= MAX_IMAGE_BYTES,
      "Image must be 5MB or smaller",
    ),
});

export type restaurantFormValues = z.infer<typeof restaurantFormSchema>;
export type restaurantFormInput = z.input<typeof restaurantFormSchema>;
