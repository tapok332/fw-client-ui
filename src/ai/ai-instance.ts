// src/ai/ai-instance.ts
import { Genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ai = new Genkit({
  plugins: [googleAI()],
});
