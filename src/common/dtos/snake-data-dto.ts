import z from "zod";
import { vector2DtoSchema } from "./vector2-dto";

export const snakeDataDtoSchema = z.object({
  xaaDelta: z.number().int(),
  saa: z.number().int(),
  headState: z.boolean(),
  snakeBodyConfig: z.object({
    bodyPoses: z.array(vector2DtoSchema),
    tailPos: vector2DtoSchema,
    direction: z.string(),
    oldDirection: z.string(),
    directionChanged: z.boolean(),
    deathHeadState: z.number().int(),
    color1: z.string(),
    color2: z.string(),
  }),
});

export type SnakeDataDto = z.infer<typeof snakeDataDtoSchema>;
