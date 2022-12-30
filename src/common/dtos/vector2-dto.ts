import { z } from "zod";

export const vector2DtoSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
});

export type Vector2 = z.infer<typeof vector2DtoSchema>;
