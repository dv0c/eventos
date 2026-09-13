import { EventType } from "@prisma/client";
import { z } from "zod";

const timeString = z
  .string()
  .trim()
  .regex(/^\d{1,2}:\d{2}(?::\d{2})?$/, "Invalid time")
  .or(z.literal(""));

export const wizardGameSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1),
  description: z.string().optional(),
  presetKey: z.string().nullable().optional(),
  mode: z.enum(["photo", "collage"]),
  enabled: z.boolean(),
  sortOrder: z.number().int(),
  coverImage: z.string().nullable().optional(),
  fields: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["prompt", "photo", "choice"]),
      label: z.string(),
      options: z.array(z.string()).optional(),
      required: z.boolean().optional(),
    }),
  ),
});

export const wizardBaseSchema = z.object({
  type: z.nativeEnum(EventType),
  name: z.string().trim().min(1),
  description: z.string().optional(),
  date: z.string().min(1),
  startTime: timeString,
  expectedGuests: z.number().int().min(0),
  expectedCouples: z.number().int().min(0),
  expectedChildren: z.number().int().min(0),
  expectedVip: z.number().int().min(0),
  primaryColor: z.string().min(1),
  secondaryColor: z.string().min(1),
  accentColor: z.string().min(1),
  style: z.string().min(1),
  coverImageKey: z.string().optional(),
  games: z.array(wizardGameSchema),
});

export const wizardSchema = wizardBaseSchema;

export type WizardFormData = z.infer<typeof wizardBaseSchema>;
export type WizardGameForm = z.infer<typeof wizardGameSchema>;

export const stepSchemas = {
  type: wizardBaseSchema.pick({ type: true }),
  details: wizardBaseSchema.pick({
    name: true,
    description: true,
    date: true,
    startTime: true,
  }),
  theme: wizardBaseSchema.pick({
    primaryColor: true,
    secondaryColor: true,
    accentColor: true,
    style: true,
    coverImageKey: true,
  }),
  games: wizardBaseSchema.pick({ games: true }),
  review: wizardSchema,
} as const;

export function getDefaultFormValues(): WizardFormData {
  return {
    type: EventType.WEDDING,
    name: "",
    description: "",
    date: "",
    startTime: "18:00",
    expectedGuests: 0,
    expectedCouples: 0,
    expectedChildren: 0,
    expectedVip: 0,
    primaryColor: "#7C3AED",
    secondaryColor: "#F59E0B",
    accentColor: "#F472B6",
    style: "elegant",
    coverImageKey: undefined,
    games: [],
  };
}
