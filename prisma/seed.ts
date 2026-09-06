import {
  PrismaClient,
  EventType,
  EventStatus,
  GuestStatus,
  TaskStatus,
  TaskPriority,
  QRCodeType,
  OrgRole,
  PlatformRole,
  Locale,
  SubscriptionStatus,
  TableShape,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "demo123456";
const ORG_SLUG = "perfect-weddings-greece";
const EVENT_SLUG = "gamos-giorgos-maria";

const GREEK_FIRST_NAMES = [
  "Γιώργος", "Μαρία", "Νίκος", "Ελένη", "Κώστας", "Σοφία", "Δημήτρης", "Αννα",
  "Παύλος", "Χριστίνα", "Αλέξανδρος", "Κατερίνα", "Μιχάλης", "Ευαγγελία", "Αντώνης",
  "Δέσποινα", "Θανάσης", "Ιωάννα", "Σπύρος", "Βασιλική", "Χρήστος", "Αγγελική",
  "Βασίλης", "Φωτεινή", "Στέφανος", "Μαρίνα", "Ανδρέας", "Ειρήνη", "Πέτρος", "Θεοδώρα",
  "Μάκης", "Λουκία", "Γιάννης", "Ναταλία", "Ηλίας", "Σταυρούλα", "Λεωνίδας", "Μελίνα",
  "Κυριάκος", "Ολυμπία", "Τάσος", "Ζωή", "Βαγγέλης", "Αλεξάνδρα", "Φίλιππος", "Δήμητρα",
  "Αργύρης", "Παναγιώτα", "Σωτήρης", "Καλλιόπη", "Μάνος", "Βικτώρια", "Γρηγόρης", "Αθηνά",
  "Νεκτάριος", "Χαρίκλεια", "Λάζαρος", "Μυρτώ", "Απόστολος", "Κωνσταντίνα", "Θεόδωρος", "Λήδα",
];

const GREEK_LAST_NAMES = [
  "Παπαδόπουλος", "Αντωνίου", "Γεωργίου", "Νικολάου", "Δημητρίου", "Κωνσταντίνου",
  "Παπαδάκης", "Βασιλείου", "Αθανασίου", "Ιωαννίδης", "Μιχαηλίδης", "Στεφάνου",
  "Καραγιάννης", "Λαζαρίδης", "Μακρή", "Πετρίδης", "Σαββίδης", "Τσακίρης", "Φωτιάδης",
  "Χριστοδούλου", "Αλεξίου", "Βλάχος", "Γαλάνη", "Δούκας", "Ευθυμίου", "Ζαχαρίου",
  "Θεοδώρου", "Καββαδία", "Λιβάνιος", "Μανώλης", "Νικολέτου", "Ξανθόπουλος", "Οικονόμου",
  "Παπανδρέου", "Ράπτης", "Σιδέρης", "Τζώρτζης", "Φλωρίδης", "Χατζής", "Ψαρράς",
];

const GUEST_STATUSES: GuestStatus[] = [
  GuestStatus.CONFIRMED,
  GuestStatus.DECLINED,
  GuestStatus.PENDING,
  GuestStatus.NO_RESPONSE,
  GuestStatus.MAYBE,
];

const PLANS = [
  {
    name: "FREE",
    slug: "free",
    description: "Για μικρά events και δοκιμή της πλατφόρμας",
    priceMonthly: 0,
    priceYearly: 0,
    sortOrder: 0,
    limits: {
      maxEvents: 1,
      maxGuests: 50,
      maxStorage: 500,
      maxCollaborators: 1,
      maxMessages: 100,
      maxWhatsAppMessages: 0,
    },
  },
  {
    name: "STARTER",
    slug: "starter",
    description: "Για freelance planners και μικρές εκδηλώσεις",
    priceMonthly: 2900,
    priceYearly: 29000,
    sortOrder: 1,
    limits: {
      maxEvents: 5,
      maxGuests: 200,
      maxStorage: 5000,
      maxCollaborators: 3,
      maxMessages: 1000,
      maxWhatsAppMessages: 100,
    },
  },
  {
    name: "PRO",
    slug: "pro",
    description: "Για επαγγελματίες event planners",
    priceMonthly: 7900,
    priceYearly: 79000,
    sortOrder: 2,
    limits: {
      maxEvents: 25,
      maxGuests: 1000,
      maxStorage: 25000,
      maxCollaborators: 10,
      maxMessages: 10000,
      maxWhatsAppMessages: 1000,
    },
  },
  {
    name: "BUSINESS",
    slug: "business",
    description: "Για agencies με πολλαπλές ομάδες",
    priceMonthly: 14900,
    priceYearly: 149000,
    sortOrder: 3,
    limits: {
      maxEvents: 100,
      maxGuests: 5000,
      maxStorage: 100000,
      maxCollaborators: 25,
      maxMessages: 50000,
      maxWhatsAppMessages: 5000,
    },
  },
  {
    name: "ENTERPRISE",
    slug: "enterprise",
    description: "Custom λύση για μεγάλους οργανισμούς",
    priceMonthly: 0,
    priceYearly: 0,
    sortOrder: 4,
    limits: {
      maxEvents: -1,
      maxGuests: -1,
      maxStorage: -1,
      maxCollaborators: -1,
      maxMessages: -1,
      maxWhatsAppMessages: -1,
    },
  },
] as const;

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function pickGuestStatus(index: number): GuestStatus {
  const weights = [35, 12, 25, 18, 10];
  const bucket = index % 100;
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (bucket < cumulative) return GUEST_STATUSES[i];
  }
  return GuestStatus.PENDING;
}

function generatePhone(index: number): string | null {
  if (index % 5 === 0) return null;
  const prefix = ["690", "691", "694", "697", "698"][index % 5];
  const suffix = String(1000000 + index * 7919).slice(-7);
  return `+30${prefix}${suffix}`;
}

async function seedPlans() {
  const plans: Record<string, { id: string }> = {};
  for (const plan of PLANS) {
    const created = await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        limits: plan.limits,
        sortOrder: plan.sortOrder,
        isActive: true,
      },
      create: {
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        limits: plan.limits,
        sortOrder: plan.sortOrder,
      },
    });
    plans[plan.slug] = created;
  }
  return plans;
}

async function seedUsers(passwordHash: string) {
  const planner = await prisma.user.upsert({
    where: { email: "planner@eventos.gr" },
    update: {
      name: "Μαρία Παπαδοπούλου",
      passwordHash,
      locale: Locale.el,
      platformRole: PlatformRole.USER,
    },
    create: {
      email: "planner@eventos.gr",
      name: "Μαρία Παπαδοπούλου",
      passwordHash,
      locale: Locale.el,
      platformRole: PlatformRole.USER,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@eventos.gr" },
    update: {
      name: "Νίκος Αντωνίου",
      passwordHash,
      locale: Locale.el,
      platformRole: PlatformRole.USER,
    },
    create: {
      email: "manager@eventos.gr",
      name: "Νίκος Αντωνίου",
      passwordHash,
      locale: Locale.el,
      platformRole: PlatformRole.USER,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@eventos.gr" },
    update: {
      name: "Eventos Admin",
      passwordHash,
      locale: Locale.el,
      platformRole: PlatformRole.ADMIN,
    },
    create: {
      email: "admin@eventos.gr",
      name: "Eventos Admin",
      passwordHash,
      locale: Locale.el,
      platformRole: PlatformRole.ADMIN,
    },
  });

  return { planner, manager, admin };
}

async function seedOrganization(proPlanId: string) {
  return prisma.organization.upsert({
    where: { slug: ORG_SLUG },
    update: {
      name: "Perfect Weddings Greece",
      planId: proPlanId,
      primaryColor: "#8B5CF6",
      secondaryColor: "#F59E0B",
    },
    create: {
      name: "Perfect Weddings Greece",
      slug: ORG_SLUG,
      planId: proPlanId,
      primaryColor: "#8B5CF6",
      secondaryColor: "#F59E0B",
    },
  });
}

async function seedOrgMembers(
  organizationId: string,
  plannerId: string,
  managerId: string,
) {
  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: { organizationId, userId: plannerId },
    },
    update: { role: OrgRole.OWNER },
    create: {
      organizationId,
      userId: plannerId,
      role: OrgRole.OWNER,
    },
  });

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: { organizationId, userId: managerId },
    },
    update: { role: OrgRole.MANAGER },
    create: {
      organizationId,
      userId: managerId,
      role: OrgRole.MANAGER,
    },
  });
}

async function seedSubscription(organizationId: string, planId: string) {
  const existing = await prisma.subscription.findFirst({
    where: { organizationId, planId },
  });

  if (existing) {
    return prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: addDays(new Date(), 30),
      },
    });
  }

  return prisma.subscription.create({
    data: {
      organizationId,
      planId,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: addDays(new Date(), 30),
    },
  });
}

async function seedClient(organizationId: string) {
  const existing = await prisma.client.findFirst({
    where: {
      organizationId,
      name: "Maria Papadopoulou",
      email: "maria.papadopoulou@example.gr",
    },
  });

  if (existing) {
    return prisma.client.update({
      where: { id: existing.id },
      data: {
        phone: "+306912345678",
        notes: "Νύφη – γάμος Γιώργος & Μαρία, Κτήμα Αριάδνη",
      },
    });
  }

  return prisma.client.create({
    data: {
      organizationId,
      name: "Maria Papadopoulou",
      email: "maria.papadopoulou@example.gr",
      phone: "+306912345678",
      notes: "Νύφη – γάμος Γιώργος & Μαρία, Κτήμα Αριάδνη",
    },
  });
}

async function cleanupDemoEvent() {
  const existing = await prisma.event.findUnique({
    where: { slug: EVENT_SLUG },
  });
  if (existing) {
    await prisma.event.delete({ where: { id: existing.id } });
  }
}

async function seedEvent(
  organizationId: string,
  clientId: string,
  eventDate: Date,
) {
  return prisma.event.create({
    data: {
      organizationId,
      clientId,
      name: "Γάμος Γιώργος & Μαρία",
      slug: EVENT_SLUG,
      type: EventType.WEDDING,
      status: EventStatus.PLANNING,
      description:
        "Ρομαντικός γάμος στο Κτήμα Αριάδνη με θέα στην Αττική. Κλασική ελληνική τελετή και δεξίωση.",
      date: eventDate,
      startTime: "17:00",
      endTime: "02:00",
      location: "Κτήμα Αριάδνη",
      address: "Λεωφ. Μαραθώνος 45, Παλλήνη, Αθήνα 15351",
      hostName: "Γιώργος Παπαδόπουλος & Μαρία Παπαδοπούλου",
      hostPhone: "+306912345678",
      hostEmail: "maria.papadopoulou@example.gr",
      expectedGuests: 120,
      expectedCouples: 45,
      expectedChildren: 8,
      expectedVip: 12,
    },
  });
}

async function seedEventSettings(eventId: string, rsvpDeadline: Date) {
  const mediaUploadToken = nanoid(24);
  return prisma.eventSettings.create({
    data: {
      eventId,
      isPublic: true,
      allowRsvp: true,
      requirePhone: false,
      requireEmail: true,
      allowPlusOnes: true,
      allowChildren: true,
      allowMaybe: true,
      enableGallery: true,
      enableWall: true,
      indexable: false,
      rsvpDeadline,
      sections: {
        hero: true,
        schedule: true,
        rsvp: true,
        gallery: true,
        map: true,
        contact: true,
        mediaUploadToken,
      },
    },
  });
}

async function seedEventTheme(eventId: string) {
  return prisma.eventTheme.create({
    data: {
      eventId,
      primaryColor: "#C4A77D",
      secondaryColor: "#FFFFFF",
      accentColor: "#2D5016",
      fontHeading: "Playfair Display",
      fontBody: "Inter",
      style: "elegant",
    },
  });
}

async function seedCollaborators(
  eventId: string,
  plannerId: string,
  managerId: string,
) {
  await prisma.collaborator.createMany({
    data: [
      { eventId, userId: plannerId, role: OrgRole.OWNER },
      { eventId, userId: managerId, role: OrgRole.MANAGER },
    ],
  });
}

async function seedGuests(eventId: string) {
  const guestsData = Array.from({ length: 120 }, (_, i) => {
    const firstName = GREEK_FIRST_NAMES[i % GREEK_FIRST_NAMES.length];
    const lastName = GREEK_LAST_NAMES[(i * 7) % GREEK_LAST_NAMES.length];
    const phone = generatePhone(i);
    return {
      eventId,
      firstName,
      lastName,
      email: i % 3 === 0 ? `${firstName.toLowerCase().replace(/[^a-z]/g, "")}.${lastName.toLowerCase().replace(/[^a-z]/g, "")}${i}@guest.example.gr` : null,
      phone,
      language: i % 10 === 0 ? Locale.en : Locale.el,
      partySize: i % 8 === 0 ? 2 : 1,
      plusOne: i % 8 === 0,
      plusOneName: i % 8 === 0 ? "Συνοδός" : null,
      children: i % 15 === 0 ? 1 : 0,
      status: pickGuestStatus(i),
      isVip: i < 12,
      invitationStatus: i % 4 === 0 ? "sent" : "not_sent",
    };
  });

  await prisma.guest.createMany({ data: guestsData });
  return prisma.guest.findMany({ where: { eventId }, orderBy: { createdAt: "asc" } });
}

async function seedTables(eventId: string) {
  const tablesData = Array.from({ length: 15 }, (_, i) => ({
    eventId,
    name: `Τραπέζι ${i + 1}`,
    shape: i === 0 ? TableShape.HEAD : i < 3 ? TableShape.VIP : TableShape.ROUND,
    capacity: i % 2 === 0 ? 10 : 8,
    positionX: (i % 5) * 120,
    positionY: Math.floor(i / 5) * 120,
    sortOrder: i,
  }));

  await prisma.table.createMany({ data: tablesData });
  return prisma.table.findMany({
    where: { eventId },
    orderBy: { sortOrder: "asc" },
  });
}

async function assignGuestsToTables(
  guests: { id: string }[],
  tables: { id: string; capacity: number }[],
) {
  const guestsToAssign = guests.slice(0, 80);
  let tableIndex = 0;
  let seatsAtTable = 0;

  for (const guest of guestsToAssign) {
    while (
      tableIndex < tables.length &&
      seatsAtTable >= tables[tableIndex].capacity
    ) {
      tableIndex++;
      seatsAtTable = 0;
    }
    if (tableIndex >= tables.length) break;

    const table = tables[tableIndex];
    await prisma.guest.update({
      where: { id: guest.id },
      data: { tableId: table.id },
    });
    await prisma.seatingAssignment.create({
      data: {
        tableId: table.id,
        guestId: guest.id,
      },
    });
    seatsAtTable++;
  }
}

async function seedInvitations(eventId: string, guests: { id: string }[]) {
  await prisma.invitation.createMany({
    data: guests.map((guest) => ({
      eventId,
      guestId: guest.id,
      rsvpToken: nanoid(21),
    })),
  });
}

async function seedTasks(
  eventId: string,
  plannerId: string,
  managerId: string,
  eventDate: Date,
) {
  const taskDefs: {
    name: string;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeId?: string;
    daysBeforeEvent: number;
  }[] = [
    { name: "Επιβεβαίωση κράτησης venue", status: TaskStatus.DONE, priority: TaskPriority.URGENT, assigneeId: plannerId, daysBeforeEvent: 90 },
    { name: "Επιλογή catering menu", status: TaskStatus.DONE, priority: TaskPriority.HIGH, assigneeId: managerId, daysBeforeEvent: 75 },
    { name: "Αποστολή προσκλήσεων", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, assigneeId: managerId, daysBeforeEvent: 45 },
    { name: "Τελική λίστα καλεσμένων", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, assigneeId: plannerId, daysBeforeEvent: 40 },
    { name: "Δοκιμή φορέματος νύφης", status: TaskStatus.DONE, priority: TaskPriority.MEDIUM, daysBeforeEvent: 35 },
    { name: "Συνάντηση με φωτογράφο", status: TaskStatus.DONE, priority: TaskPriority.MEDIUM, assigneeId: plannerId, daysBeforeEvent: 30 },
    { name: "Διάταξη τραπεζιών", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, assigneeId: managerId, daysBeforeEvent: 25 },
    { name: "Επιλογή λουλουδιών", status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, daysBeforeEvent: 20 },
    { name: "Επιβεβαίωση DJ playlist", status: TaskStatus.TODO, priority: TaskPriority.LOW, assigneeId: managerId, daysBeforeEvent: 18 },
    { name: "RSVP reminders", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, assigneeId: managerId, daysBeforeEvent: 15 },
    { name: "Τελική επιβεβαίωση προμηθευτών", status: TaskStatus.TODO, priority: TaskPriority.URGENT, assigneeId: plannerId, daysBeforeEvent: 14 },
    { name: "Δοκιμή κέικ", status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, daysBeforeEvent: 12 },
    { name: "Rehearsal dinner", status: TaskStatus.TODO, priority: TaskPriority.LOW, daysBeforeEvent: 10 },
    { name: "Επιβεβαίωση μεταφοράς", status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, assigneeId: managerId, daysBeforeEvent: 8 },
    { name: "Timeline τελετής", status: TaskStatus.DONE, priority: TaskPriority.HIGH, assigneeId: plannerId, daysBeforeEvent: 7 },
    { name: "QR codes & signage", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, assigneeId: managerId, daysBeforeEvent: 5 },
    { name: "Τελικές πληρωμές", status: TaskStatus.TODO, priority: TaskPriority.URGENT, assigneeId: plannerId, daysBeforeEvent: 4 },
    { name: "Welcome bags", status: TaskStatus.TODO, priority: TaskPriority.LOW, daysBeforeEvent: 3 },
    { name: "Briefing ομάδας venue", status: TaskStatus.TODO, priority: TaskPriority.HIGH, assigneeId: plannerId, daysBeforeEvent: 2 },
    { name: "Day-of checklist", status: TaskStatus.TODO, priority: TaskPriority.URGENT, assigneeId: plannerId, daysBeforeEvent: 1 },
  ];

  await prisma.task.createMany({
    data: taskDefs.map((task) => ({
      eventId,
      name: task.name,
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId,
      dueDate: addDays(eventDate, -task.daysBeforeEvent),
    })),
  });
}

async function seedTimeline(eventId: string) {
  const items = [
    { time: "16:00", title: "Άφιξη καλεσμένων", location: "Κήπος", description: "Welcome drinks και μουσική", sortOrder: 0 },
    { time: "17:00", title: "Τελετή γάμου", location: "Εκκλησία Αγ. Νικολάου", description: "Θρησκευτική τελετή", sortOrder: 1 },
    { time: "18:30", title: "Φωτογράφιση ζευγαριού", location: "Κτήμα Αριάδνη", description: "Golden hour photos", sortOrder: 2 },
    { time: "19:30", title: "Cocktail hour", location: "Terrace", description: "Καλωσόρισμα & canapés", sortOrder: 3 },
    { time: "20:30", title: "Είσοδος νεόνυμφων", location: "Αίθουσα δεξίωσης", description: "Grand entrance", sortOrder: 4 },
    { time: "21:00", title: "Δείπνο", location: "Αίθουσα δεξίωσης", description: "3-course menu", sortOrder: 5 },
    { time: "22:30", title: "Πρώτος χορός", location: "Πίστα", description: "Ζευγάρι & παράταξη", sortOrder: 6 },
    { time: "00:00", title: "Party & cutting cake", location: "Πίστα", description: "DJ set & κοπή τούρτας", sortOrder: 7 },
  ];

  await prisma.timelineItem.createMany({
    data: items.map((item) => ({ eventId, ...item })),
  });
}

async function seedQRCodes(eventId: string, albumToken: string, orgSlug: string) {
  const baseUrl = `https://eventos.gr/e/${EVENT_SLUG}`;
  const types: { type: QRCodeType; url: string }[] = [
    { type: QRCodeType.EVENT, url: baseUrl },
    { type: QRCodeType.RSVP, url: `${baseUrl}/rsvp` },
    { type: QRCodeType.UPLOAD, url: `https://eventos.gr/a/${albumToken}` },
    { type: QRCodeType.WALL, url: `${baseUrl}/wall` },
    {
      type: QRCodeType.MODERATION,
      url: `https://eventos.gr/el/org/${orgSlug}/events/${eventId}/mod`,
    },
  ];

  for (const { type, url } of types) {
    const existing = await prisma.qRCode.findFirst({
      where: { eventId, type },
    });
    if (existing) {
      await prisma.qRCode.update({
        where: { id: existing.id },
        data: { url, storageKey: null },
      });
    } else {
      await prisma.qRCode.create({
        data: {
          eventId,
          type,
          url,
        },
      });
    }
  }
}

async function main() {
  console.log("🌱 Seeding Eventos database...\n");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const plans = await seedPlans();
  console.log(`✓ ${PLANS.length} plans (FREE → ENTERPRISE)`);

  const { planner, manager, admin } = await seedUsers(passwordHash);
  console.log("✓ 3 users (planner, manager, admin)");

  const org = await seedOrganization(plans.pro.id);
  console.log(`✓ Organization: ${org.name}`);

  await seedOrgMembers(org.id, planner.id, manager.id);
  await seedSubscription(org.id, plans.pro.id);
  console.log("✓ Org members & subscription");

  const client = await seedClient(org.id);
  console.log(`✓ Client: ${client.name}`);

  await cleanupDemoEvent();

  const eventDate = addDays(new Date(), 60);
  eventDate.setHours(17, 0, 0, 0);
  const rsvpDeadline = addDays(eventDate, -14);

  const event = await seedEvent(org.id, client.id, eventDate);
  const settings = await seedEventSettings(event.id, rsvpDeadline);
  await seedEventTheme(event.id);
  await seedCollaborators(event.id, planner.id, manager.id);
  console.log(`✓ Event: ${event.name} (${eventDate.toLocaleDateString("el-GR")})`);

  const guests = await seedGuests(event.id);
  console.log(`✓ ${guests.length} guests`);

  const tables = await seedTables(event.id);
  await assignGuestsToTables(guests, tables);
  console.log(`✓ ${tables.length} tables (~80 guests seated)`);

  await seedInvitations(event.id, guests);
  console.log(`✓ ${guests.length} invitations with rsvpToken`);

  await seedTasks(event.id, planner.id, manager.id, eventDate);
  console.log("✓ 20 tasks");

  await seedTimeline(event.id);
  console.log("✓ 8 timeline items");

  const albumToken =
    ((settings.sections as { mediaUploadToken?: string } | null)?.mediaUploadToken) ??
    nanoid(24);
  await seedQRCodes(event.id, albumToken, ORG_SLUG);
  console.log("✓ 5 QR codes (EVENT, RSVP, UPLOAD, WALL, MODERATION)");

  const guestRecords = await prisma.guest.findMany({
    where: { eventId: event.id },
    select: { status: true },
  });
  const guestStatusSummary = GUEST_STATUSES.reduce(
    (acc, status) => {
      acc[status] = guestRecords.filter((g) => g.status === status).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  console.log("\n" + "=".repeat(60));
  console.log("📋 SEED SUMMARY");
  console.log("=".repeat(60));
  console.log(`Plans:          ${PLANS.length}`);
  console.log(`Organization:   ${org.name} (${ORG_SLUG}) — PRO plan`);
  console.log(`Users:          3 (planner, manager, admin)`);
  console.log(`Client:         ${client.name}`);
  console.log(`Event:          ${event.name} — ${EventStatus.PLANNING}`);
  console.log(`Guests:         ${guests.length} (${Object.entries(guestStatusSummary).map(([k, v]) => `${k}: ${v}`).join(", ")})`);
  console.log(`Tables:         ${tables.length} (80 seated)`);
  console.log(`Tasks:          20`);
  console.log(`Timeline:       8 items`);
  console.log(`Invitations:    ${guests.length}`);
  console.log(`QR Codes:       4`);
  console.log("=".repeat(60));
  console.log("\n🔐 DEMO CREDENTIALS");
  console.log("=".repeat(60));
  console.log(`Password (all demo users): ${DEMO_PASSWORD}`);
  console.log("");
  console.log("Planner (OWNER):  planner@eventos.gr  — Μαρία Παπαδοπούλου");
  console.log("Manager:          manager@eventos.gr  — Νίκος Αντωνίου");
  console.log("Platform Admin:   admin@eventos.gr");
  console.log("");
  console.log(`Event URL slug:   ${EVENT_SLUG}`);
  console.log(`Org slug:         ${ORG_SLUG}`);
  console.log("=".repeat(60));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
