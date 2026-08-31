import { EventType } from "@prisma/client";
import { z } from "zod";

export const wizardSchema = z.object({
  type: z.nativeEnum(EventType),
  name: z.string().trim().min(1),
  description: z.string().optional(),
  date: z.string().min(1),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  hostName: z.string().optional(),
  hostPhone: z.string().optional(),
  hostEmail: z.string().email().optional().or(z.literal("")),
  expectedGuests: z.number().int().min(0),
  expectedCouples: z.number().int().min(0),
  expectedChildren: z.number().int().min(0),
  expectedVip: z.number().int().min(0),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  style: z.string(),
  coverImageKey: z.string().optional(),
});

export type WizardFormData = z.infer<typeof wizardSchema>;

export const stepSchemas = {
  type: wizardSchema.pick({ type: true }),
  details: wizardSchema.pick({
    name: true,
    description: true,
    date: true,
    startTime: true,
    endTime: true,
  }),
  location: wizardSchema.pick({ location: true, address: true }),
  people: wizardSchema.pick({
    hostName: true,
    hostPhone: true,
    hostEmail: true,
    expectedGuests: true,
    expectedCouples: true,
    expectedChildren: true,
    expectedVip: true,
  }),
  theme: wizardSchema.pick({
    primaryColor: true,
    secondaryColor: true,
    accentColor: true,
    style: true,
    coverImageKey: true,
  }),
  review: wizardSchema,
} as const;

export function getDefaultFormValues(): WizardFormData {
  return {
    type: EventType.WEDDING,
    name: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    address: "",
    hostName: "",
    hostPhone: "",
    hostEmail: "",
    expectedGuests: 0,
    expectedCouples: 0,
    expectedChildren: 0,
    expectedVip: 0,
    primaryColor: "#7C3AED",
    secondaryColor: "#F59E0B",
    accentColor: "#F472B6",
    style: "elegant",
    coverImageKey: undefined,
  };
}
