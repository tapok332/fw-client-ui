// src/ai/flows/generate-box-description.ts
'use server';

/**
 * @fileOverview An AI agent to generate descriptions for surprise boxes.
 *
 * - generateBoxDescription - A function that handles the description generation process.
 * - GenerateBoxDescriptionInput - The input type for the generateBoxDescription function.
 * - GenerateBoxDescriptionOutput - The return type for the generateBoxDescription function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateBoxDescriptionInputSchema = z.object({
  boxName: z.string().describe('The name of the surprise box.'),
  foodItems: z
    .string()
    .describe(
      'A comma-separated list of food items included in the surprise box. Be as specific as possible. Example: 3 croissants, 1 loaf of sourdough bread, 2 pain au chocolat.'
    ),
  restaurantName: z.string().describe('The name of the restaurant offering the surprise box.'),
  discountPercentage: z
    .number()
    .int()
    .min(1)
    .max(99)
    .describe('The discount percentage offered for the surprise box.'),
  originalPrice: z.number().describe('The original price of the food items in the surprise box.'),
});
export type GenerateBoxDescriptionInput = z.infer<typeof GenerateBoxDescriptionInputSchema>;

const GenerateBoxDescriptionOutputSchema = z.object({
  description: z.string().describe('A compelling description for the surprise box.'),
});
export type GenerateBoxDescriptionOutput = z.infer<typeof GenerateBoxDescriptionOutputSchema>;

export async function generateBoxDescription(
  input: GenerateBoxDescriptionInput
): Promise<GenerateBoxDescriptionOutput> {
  return generateBoxDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBoxDescriptionPrompt',
  input: {
    schema: z.object({
      boxName: z.string().describe('The name of the surprise box.'),
      foodItems: z
        .string()
        .describe(
          'A comma-separated list of food items included in the surprise box. Be as specific as possible. Example: 3 croissants, 1 loaf of sourdough bread, 2 pain au chocolat.'
        ),
      restaurantName: z.string().describe('The name of the restaurant offering the surprise box.'),
      discountPercentage: z
        .number()
        .int()
        .min(1)
        .max(99)
        .describe('The discount percentage offered for the surprise box.'),
      originalPrice: z.number().describe('The original price of the food items in the surprise box.'),
    }),
  },
  output: {
    schema: z.object({
      description: z.string().describe('A compelling description for the surprise box.'),
    }),
  },
  prompt: `You are a marketing expert specializing in writing compelling descriptions for food items.

You are writing a description for a surprise box offered by {{restaurantName}}. The surprise box is named "{{boxName}}" and contains the following food items: {{foodItems}}. The box is offered at a discount of {{discountPercentage}}% off the original price of {{originalPrice}}.

Write a short, enticing description to attract customers. Focus on the value and the element of surprise. Highlight the savings and the quality of the food. Make people want to rescue this food!
`,
});

const generateBoxDescriptionFlow = ai.defineFlow<
  typeof GenerateBoxDescriptionInputSchema,
  typeof GenerateBoxDescriptionOutputSchema
>({
  name: 'generateBoxDescriptionFlow',
  inputSchema: GenerateBoxDescriptionInputSchema,
  outputSchema: GenerateBoxDescriptionOutputSchema,
},
async input => {
  const {output} = await prompt(input);
  return output!;
});
