import { z } from "zod";

export const bggSearchItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  yearPublished: z.number().nullable(),
});
export type BggSearchItem = z.infer<typeof bggSearchItemSchema>;

export const bggGameDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  thumbnail: z.string(),
  yearPublished: z.number().nullable(),
  alternateNames: z.array(z.string()),
  totalVotes: z.number(),
});
export type BggGameDetail = z.infer<typeof bggGameDetailSchema>;

export const matchResultSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("found"),
    id: z.number(),
    name: z.string(),
  }),
  z.object({ status: z.literal("not_found") }),
  z.object({
    status: z.literal("ambiguous"),
    candidateIds: z.array(z.number()),
  }),
]);
export type MatchResult = z.infer<typeof matchResultSchema>;
