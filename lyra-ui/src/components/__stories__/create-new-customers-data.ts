/**
 * Mock "Customers" dataset for the CreateNew → Outbound flow story.
 *
 * Kept in its own file rather than inline in CreateNew.stories.tsx — same
 * reasoning as create-new-agents-data.ts.
 */
import type { ChannelType } from "../channel-row";

export interface CreateNewCustomerRecord {
  id: string;
  name: string;
  customerId: string;
  /** Which channels this customer can be reached on — drives the per-row
   *  hover flyout in the Outbound picker (only supported channels show). */
  channels: ChannelType[];
  avatarClassName: string;
  /** This customer's own labeled phone numbers (Mobile/Home/etc.) — same
   *  `{value, label}` shape as `CreateNewOutboundContact.phoneNumbers`, and
   *  passed straight through to it (see `OUTBOUND_CUSTOMERS` in
   *  AgentNextGenPage.tsx). Lets the Outbound picker's Customers search
   *  match on a phone number, not just name/customerId — a customer with
   *  more than one number on file (e.g. Mobile + Home) can be found by
   *  either. */
  phoneNumbers: { value: string; label: string }[];
}

const FIRST_NAMES = [
  "Alex", "Sarah", "David", "Priya", "Miguel", "Elena", "Omar", "Grace", "Noah", "Fatima",
  "Liam", "Sofia", "Kenji", "Amara", "Lucas", "Ingrid", "Diego", "Yuki", "Hannah", "Tariq",
];
const LAST_NAMES = [
  "Kowalski", "Miller", "Brown", "Nair", "Santos", "Petrov", "Haddad", "Okafor", "Bennett", "Rahman",
  "Sullivan", "Alvarez", "Tanaka", "Mensah", "Fontaine", "Larsen", "Reyes", "Mori", "Costa", "Ibrahim",
];
const AVATAR_COLORS = [
  "blue", "purple", "green", "orange", "teal", "red", "pink", "yellow", "lime", "slate",
];
// Customers skew toward email/sms — most don't take a direct "voice" agent
// line the way internal agents do, which also gives the flyout some
// realistic variety row to row.
const ALL_CHANNELS: ChannelType[] = ["email", "sms", "whatsapp", "voice"];

// Deterministic per-customer area codes so every generated phone number
// looks plausible (10 digits, no real-looking exchange) without touching
// `Math.random()` — same "deterministic, not random" convention as the rest
// of this file.
const AREA_CODES = ["201", "312", "404", "512", "615", "702", "818", "904", "206", "305"];

function formatPhone(digits10: string): string {
  return `(${digits10.slice(0, 3)}) ${digits10.slice(3, 6)}-${digits10.slice(6)}`;
}

function buildCustomers(count: number): CreateNewCustomerRecord[] {
  const customers: CreateNewCustomerRecord[] = [];
  for (let i = 0; i < count; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[(i + Math.floor(i / FIRST_NAMES.length)) % LAST_NAMES.length];
    const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
    const extra = ALL_CHANNELS.slice(1).filter((_, idx) => (i + idx) % 3 !== 0);
    const areaCode = AREA_CODES[i % AREA_CODES.length];
    const line = String(1000 + ((i * 37) % 9000)).padStart(4, "0");
    const digits = `${areaCode}555${line}`;
    customers.push({
      id: `customer-${i + 1}`,
      name: `${first} ${last}`,
      customerId: `CST-${10000 + i * 37}`,
      channels: ["email", ...extra],
      avatarClassName: `bg-lyra-accent-${color}-soft text-lyra-accent-${color}-strong`,
      phoneNumbers: [{ value: `+1${digits}`, label: `Mobile · ${formatPhone(digits)}` }],
    });
  }
  return customers;
}

export const CREATE_NEW_CUSTOMERS: CreateNewCustomerRecord[] = buildCustomers(60);

// Priya Nair (FIRST_NAMES[3] + LAST_NAMES[3], landing at i === 3 — see
// `buildCustomers`' index math) gets a second number on file, "Home," so
// the Outbound picker's Customers search can find her by either one —
// demonstrates a customer having more than one number, not just the single
// generated "Mobile" every other record gets.
const priyaNair = CREATE_NEW_CUSTOMERS.find((c) => c.name === "Priya Nair");
if (priyaNair) {
  priyaNair.phoneNumbers = [
    ...priyaNair.phoneNumbers,
    { value: "+14565559981", label: "Home · (456) 555-9981" },
  ];
}
