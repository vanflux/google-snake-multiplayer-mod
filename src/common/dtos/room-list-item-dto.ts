import { z } from "zod";

export const roomListItemDtoSchema = z.object({
  id: z.string(),
  capacity: z.number().int(),
  playersCount: z.number().int(),
});

export type RoomListItemDto = z.infer<typeof roomListItemDtoSchema>;
