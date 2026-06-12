import { z } from "zod";

export const StoreTypeSchema = z.enum([
  "RESTAURANT", "GROCERY", "BAKERY", "CAFE", "SWEETS", "OTHER",
]);

export const CategorySchema = z.object({
  id: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  iconName: z.string().nullable(),
});

export const LocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const StoreDtoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: StoreTypeSchema,
  category: CategorySchema.nullable(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  heroImageUrl: z.string().nullable(),
  address: z.string().nullable(),
  location: LocationSchema.nullable(),
  rating: z.number().min(0).max(5).nullable(),
  opensAt: z.string().nullable(),
  closesAt: z.string().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  deliveryFee: z.number().nullable(),
  minOrderAmount: z.number().nullable(),
  priceLevel: z.number().int().min(1).max(4).nullable(),
  currentlyOpen: z.boolean(),
  menuItems: z.array(z.any()).default([]),
  combos: z.array(z.any()).default([]),
  distance: z.number().nullable(),
  // deprecated mirror — backend keeps sending it for 1 more sprint
  categoryName: z.string().nullable().optional(),
});

export const PageSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    content: z.array(item),
    totalElements: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    size: z.number().int().positive(),
    number: z.number().int().nonnegative(),
    first: z.boolean(),
    last: z.boolean(),
    empty: z.boolean(),
    numberOfElements: z.number().int().nonnegative(),
  });

export const StoresPageSchema = PageSchema(StoreDtoSchema);
export const CategoriesListSchema = z.array(CategorySchema);

export type StoreDto = z.infer<typeof StoreDtoSchema>;
export type CategoryDto = z.infer<typeof CategorySchema>;
export type StoresPage = z.infer<typeof StoresPageSchema>;
