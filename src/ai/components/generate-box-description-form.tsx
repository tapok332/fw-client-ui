"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { generateBoxDescription } from "@/ai/flows/generate-box-description";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  boxName: z.string().min(2, {
    message: "Box name must be at least 2 characters.",
  }),
  foodItems: z.string().min(10, {
    message: "Please provide a detailed list of food items.",
  }),
  restaurantName: z.string().min(2, {
    message: "Restaurant name must be at least 2 characters.",
  }),
  discountPercentage: z.number().min(1).max(99),
  originalPrice: z.number().min(1),
});

interface GenerateBoxDescriptionFormProps {
  className?: string;
}
export function GenerateBoxDescriptionForm({ className }: GenerateBoxDescriptionFormProps) {
  const [generatedDescription, setGeneratedDescription] = React.useState<string | null>(null);

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      boxName: "",
      foodItems: "",
      restaurantName: "",
      discountPercentage: 30,
      originalPrice: 50,
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the values.
    // ✅ This will be type-safe and validated.
    const result = await generateBoxDescription(values);
    setGeneratedDescription(result?.description ?? "Failed to generate description.");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="boxName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Box Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Bakery Surprise Box" {...field} />
              </FormControl>
              <FormDescription>
                What's the name of this amazing surprise box?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="foodItems"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Food Items</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g. 3 croissants, 1 loaf of sourdough bread" {...field} />
              </FormControl>
              <FormDescription>
                List the food items included in the surprise box. Be as specific as possible.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="restaurantName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Restaurant Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. The Daily Bread" {...field} />
              </FormControl>
              <FormDescription>
                What's the name of the restaurant offering this box?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex space-x-4">
          <FormField
            control={form.control}
            name="discountPercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount (%)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g. 30" {...field} />
                </FormControl>
                <FormDescription>
                  What percentage discount does this box offer?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="originalPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Original Price</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g. 50" {...field} />
                </FormControl>
                <FormDescription>
                  What was the original price of the food items?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit">Generate Description</Button>
        {generatedDescription && (
          <div className="mt-4">
            <Label>Generated Description</Label>
            <Textarea value={generatedDescription} readOnly />
          </div>
        )}
      </form>
    </Form>
  );
}
