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

export const wizardObjectSchema = z.object({
  type: z.nativeEnum(EventType),
  name: z.string().trim().min(1),
  description: z.string().optional(),
  date: z.string().optional().or(z.literal("")),
  startTime: timeString,
  requireManualApproval: z.boolean(),
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

export const wizardBaseSchema = wizardObjectSchema.superRefine((data, ctx) => {
  if (data.date && data.date.trim() !== "" && !data.startTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Start time required when date is set",
      path: ["startTime"],
    });
  }
});

export const wizardSchema = wizardBaseSchema;

export type WizardFormData = z.infer<typeof wizardObjectSchema>;
export type WizardGameForm = z.infer<typeof wizardGameSchema>;

export const stepSchemas = {
  type: wizardObjectSchema.pick({ type: true }),
  details: wizardObjectSchema.pick({
    name: true,
    description: true,
    date: true,
    startTime: true,
    requireManualApproval: true,
  }),
  theme: wizardObjectSchema.pick({
    primaryColor: true,
    secondaryColor: true,
    accentColor: true,
    style: true,
    coverImageKey: true,
  }),
  games: wizardObjectSchema.pick({ games: true }),
  review: wizardSchema,
} as const;

export function getDefaultFormValues(): WizardFormData {
  return {
    type: EventType.WEDDING,
    name: "",
    description: "",
    date: "",
    startTime: "",
    requireManualApproval: false,
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
