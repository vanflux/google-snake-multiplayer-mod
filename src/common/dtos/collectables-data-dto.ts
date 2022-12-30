import { z } from "zod";
import { vector2DtoSchema } from "./vector2-dto";

export const collectablesDataDtoSchema = z.object({
  collectables: z.array(z.object({
    position: vector2DtoSchema,
    animationStep: z.number().int(),
    type: z.number().int(),
    appearing: z.boolean(),
    velocity: vector2DtoSchema,
    f6: vector2DtoSchema,
    isPoisoned: z.boolean(),
    isGhost: z.boolean(),
    light: z.number(),
  })),
});

export type CollectablesDataDto = z.infer<typeof collectablesDataDtoSchema>;
