import { EventType } from "@prisma/client";

export type WizardStepId =
  | "type"
  | "details"
  | "location"
  | "people"
  | "theme"
  | "review";

export const WIZARD_STEPS: WizardStepId[] = [
  "type",
  "details",
  "location",
  "people",
  "theme",
  "review",
];

export type GuestFieldKey =
  | "expectedGuests"
  | "expectedCouples"
  | "expectedChildren"
  | "expectedVip";

export interface ThemeDefaults {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  style: string;
}

export interface EventTypeConfig {
  steps: WizardStepId[];
  host: {
    show: boolean;
    labelKeys: {
      name: string;
      phone: string;
      email: string;
    };
  };
  guests: Record<GuestFieldKey, boolean>;
  guestLabelKeys: Partial<Record<GuestFieldKey, string>>;
  defaults: ThemeDefaults;
  namePlaceholderKey: string;
  descriptionKey: string;
}

export const EVENT_TYPE_CONFIG: Record<EventType, EventTypeConfig> = {
  [EventType.WEDDING]: {
    steps: WIZARD_STEPS,
    host: {
      show: true,
      labelKeys: {
        name: "hostLabels.coupleName",
        phone: "hostLabels.couplePhone",
        email: "hostLabels.coupleEmail",
      },
    },
    guests: {
      expectedGuests: true,
      expectedCouples: true,
      expectedChildren: true,
      expectedVip: true,
    },
    guestLabelKeys: {},
    defaults: {
      primaryColor: "#7C3AED",
      secondaryColor: "#F59E0B",
      accentColor: "#F472B6",
      style: "elegant",
    },
    namePlaceholderKey: "namePlaceholders.wedding",
    descriptionKey: "stepQuestions.details.wedding",
  },
  [EventType.ENGAGEMENT]: {
    steps: WIZARD_STEPS,
    host: {
      show: true,
      labelKeys: {
        name: "hostLabels.coupleName",
        phone: "hostLabels.couplePhone",
        email: "hostLabels.coupleEmail",
      },
    },
    guests: {
      expectedGuests: true,
      expectedCouples: true,
      expectedChildren: false,
      expectedVip: false,
    },
    guestLabelKeys: {},
    defaults: {
      primaryColor: "#DB2777",
      secondaryColor: "#F97316",
      accentColor: "#FBBF24",
      style: "elegant",
    },
    namePlaceholderKey: "namePlaceholders.engagement",
    descriptionKey: "stepQuestions.details.engagement",
  },
  [EventType.BAPTISM]: {
    steps: WIZARD_STEPS,
    host: {
      show: true,
      labelKeys: {
        name: "hostLabels.parentName",
        phone: "hostLabels.parentPhone",
        email: "hostLabels.parentEmail",
      },
    },
    guests: {
      expectedGuests: true,
      expectedCouples: false,
      expectedChildren: true,
      expectedVip: false,
    },
    guestLabelKeys: {
      expectedChildren: "guestLabels.godchildren",
    },
    defaults: {
      primaryColor: "#60A5FA",
      secondaryColor: "#34D399",
      accentColor: "#FDE68A",
      style: "classic",
    },
    namePlaceholderKey: "namePlaceholders.baptism",
    descriptionKey: "stepQuestions.details.baptism",
  },
  [EventType.BIRTHDAY]: {
    steps: WIZARD_STEPS,
    host: {
      show: true,
      labelKeys: {
        name: "hostLabels.celebrantName",
        phone: "hostLabels.hostPhone",
        email: "hostLabels.hostEmail",
      },
    },
    guests: {
      expectedGuests: true,
      expectedCouples: false,
      expectedChildren: true,
      expectedVip: false,
    },
    guestLabelKeys: {},
    defaults: {
      primaryColor: "#8B5CF6",
      secondaryColor: "#EC4899",
      accentColor: "#FBBF24",
      style: "modern",
    },
    namePlaceholderKey: "namePlaceholders.birthday",
    descriptionKey: "stepQuestions.details.birthday",
  },
  [EventType.PARTY]: {
    steps: WIZARD_STEPS,
    host: {
      show: true,
      labelKeys: {
        name: "hostLabels.organizerName",
        phone: "hostLabels.organizerPhone",
        email: "hostLabels.organizerEmail",
      },
    },
    guests: {
      expectedGuests: true,
      expectedCouples: false,
      expectedChildren: false,
      expectedVip: true,
    },
    guestLabelKeys: {},
    defaults: {
      primaryColor: "#6366F1",
      secondaryColor: "#A855F7",
      accentColor: "#22D3EE",
      style: "modern",
    },
    namePlaceholderKey: "namePlaceholders.party",
    descriptionKey: "stepQuestions.details.party",
  },
  [EventType.CORPORATE]: {
    steps: WIZARD_STEPS,
    host: {
      show: true,
      labelKeys: {
        name: "hostLabels.contactName",
        phone: "hostLabels.contactPhone",
        email: "hostLabels.contactEmail",
      },
    },
    guests: {
      expectedGuests: true,
      expectedCouples: false,
      expectedChildren: false,
      expectedVip: true,
    },
    guestLabelKeys: {
      expectedGuests: "guestLabels.attendees",
      expectedVip: "guestLabels.executives",
    },
    defaults: {
      primaryColor: "#1E3A5F",
      secondaryColor: "#64748B",
      accentColor: "#0EA5E9",
      style: "modern",
    },
    namePlaceholderKey: "namePlaceholders.corporate",
    descriptionKey: "stepQuestions.details.corporate",
  },
  [EventType.CONFERENCE]: {
    steps: WIZARD_STEPS,
    host: {
      show: true,
      labelKeys: {
        name: "hostLabels.organizerName",
        phone: "hostLabels.organizerPhone",
        email: "hostLabels.organizerEmail",
      },
    },
    guests: {
      expectedGuests: true,
      expectedCouples: false,
      expectedChildren: false,
      expectedVip: true,
    },
    guestLabelKeys: {
      expectedGuests: "guestLabels.attendees",
      expectedVip: "guestLabels.speakers",
    },
    defaults: {
      primaryColor: "#0F766E",
      secondaryColor: "#475569",
      accentColor: "#38BDF8",
      style: "modern",
    },
    namePlaceholderKey: "namePlaceholders.conference",
    descriptionKey: "stepQuestions.details.conference",
  },
  [EventType.OTHER]: {
    steps: WIZARD_STEPS,
    host: {
      show: true,
      labelKeys: {
        name: "hostLabels.hostName",
        phone: "hostLabels.hostPhone",
        email: "hostLabels.hostEmail",
      },
    },
    guests: {
      expectedGuests: true,
      expectedCouples: true,
      expectedChildren: true,
      expectedVip: true,
    },
    guestLabelKeys: {},
    defaults: {
      primaryColor: "#8B5CF6",
      secondaryColor: "#F59E0B",
      accentColor: "#10B981",
      style: "elegant",
    },
    namePlaceholderKey: "namePlaceholders.other",
    descriptionKey: "stepQuestions.details.other",
  },
};

export function getEventTypeConfig(type: EventType): EventTypeConfig {
  return EVENT_TYPE_CONFIG[type];
}

export function getHiddenGuestFields(
  config: EventTypeConfig,
): GuestFieldKey[] {
  return (Object.keys(config.guests) as GuestFieldKey[]).filter(
    (key) => !config.guests[key],
  );
}

export interface ThemePreset {
  id: string;
  nameKey: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  style: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "elegant-purple",
    nameKey: "presets.elegantPurple",
    primaryColor: "#7C3AED",
    secondaryColor: "#F59E0B",
    accentColor: "#F472B6",
    style: "elegant",
  },
  {
    id: "romantic-rose",
    nameKey: "presets.romanticRose",
    primaryColor: "#DB2777",
    secondaryColor: "#F97316",
    accentColor: "#FBBF24",
    style: "elegant",
  },
  {
    id: "soft-sky",
    nameKey: "presets.softSky",
    primaryColor: "#60A5FA",
    secondaryColor: "#34D399",
    accentColor: "#FDE68A",
    style: "classic",
  },
  {
    id: "modern-violet",
    nameKey: "presets.modernViolet",
    primaryColor: "#6366F1",
    secondaryColor: "#A855F7",
    accentColor: "#22D3EE",
    style: "modern",
  },
  {
    id: "corporate-slate",
    nameKey: "presets.corporateSlate",
    primaryColor: "#1E3A5F",
    secondaryColor: "#64748B",
    accentColor: "#0EA5E9",
    style: "modern",
  },
  {
    id: "forest-teal",
    nameKey: "presets.forestTeal",
    primaryColor: "#0F766E",
    secondaryColor: "#475569",
    accentColor: "#38BDF8",
    style: "modern",
  },
];

export const EVENT_TYPES = Object.values(EventType);
