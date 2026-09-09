import { z } from 'zod'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'] as const

export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Product name is required')
    .max(150, 'Name must be 150 characters or fewer'),
  price: z.coerce
    .number({ error: 'Price is required' })
    .positive('Price must be greater than 0'),
  category_id: z.string().min(1, 'Category is required'),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or fewer')
    .optional()
    .or(z.literal('')),
  image: z
    .custom<File | null>((value) => value === null || value === undefined || value instanceof File, {
      message: 'Invalid image file',
    })
    .nullable()
    .optional()
    .refine(
      (file) => !file || ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number]),
      'Use a JPEG, PNG, WebP, or GIF image',
    )
    .refine((file) => !file || file.size <= MAX_IMAGE_BYTES, 'Image must be 5MB or smaller'),
})

export type ProductFormValues = z.infer<typeof productFormSchema>
export type ProductFormInput = z.input<typeof productFormSchema>
