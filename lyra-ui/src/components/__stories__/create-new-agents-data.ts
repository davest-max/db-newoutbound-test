/**
 * Mock "Agents" dataset for the CreateNew → Outbound flow story.
 *
 * Kept in its own file rather than inline in CreateNew.stories.tsx so the
 * story file isn't dominated by a 100-row fixture — see CONTRIBUTING.md
 * (avoid inline code bloat for generated/large mock datasets).
 */
import type { ChannelType } from "../channel-row";
import type { AgentPresenceStatus } from "../create-new";

export interface CreateNewAgentRecord {
  id: string;
  name: string;
  agentId: string;
  /** Which channels this agent can be reached on — drives the per-row
   *  hover flyout in the Outbound picker (only supported channels show). */
  channels: ChannelType[];
  avatarClassName: string;
  /** Current availability — rendered as a status chip next to the agent's
   *  name in the Outbound picker's "Select Agent" list. */
  status: AgentPresenceStatus;
  /** This agent's own labeled phone numbers (Mobile/Work) — same
   *  `{value, label}` shape as `CreateNewOutboundContact.phoneNumbers`, and
   *  passed straight through to it (see `OUTBOUND_AGENTS` in
   *  AgentNextGenPage.tsx). Without this, the Select Phone dropdown falls
   *  back to the shared, unlabeled `outbound.phoneOptions` pool — giving
   *  every agent their own numbers means the agent using this picker can
   *  actually tell which line they're about to call. */
  phoneNumbers: { value: string; label: string }[];
}

const FIRST_NAMES = [
  "Jamie", "Priya", "Wei", "Alex", "Sarah", "David", "Miguel", "Elena", "Omar", "Grace",
  "Noah", "Fatima", "Liam", "Sofia", "Kenji", "Amara", "Lucas", "Ingrid", "Diego", "Yuki",
];
const LAST_NAMES = [
  "Torres", "Nair", "Chen", "Kowalski", "Miller", "Brown", "Santos", "Petrov", "Haddad", "Okafor",
  "Bennett", "Rahman", "Sullivan", "Alvarez", "Tanaka", "Mensah", "Fontaine", "Larsen", "Reyes", "Mori",
];
const AVATAR_COLORS = [
  "blue", "orange", "teal", "purple", "green", "red", "pink", "yellow", "lime", "slate",
];
const ALL_CHANNELS: ChannelType[] = ["voice", "email", "sms", "whatsapp"];
// Weighted so most agents are actually reachable (available/away) rather
// than an unrealistic even 1-in-5 split — busy/in-call/offline are real but
// less common states on a roster like this.
const STATUS_CYCLE: AgentPresenceStatus[] = [
  "available", "available", "busy", "available", "away",
  "available", "in-call", "available", "offline", "available",
];

// Deterministic per-agent area codes for the generated Mobile/Work
// numbers — same "no Math.random" convention as the rest of this file.
// Distinct from create-new-customers-data.ts's own AREA_CODES list, and
// Mobile/Work use different exchanges ("555"/"200") so the two numbers
// generated for the same agent never collide with each other.
const AREA_CODES = ["213", "339", "480", "530", "646", "719", "808", "907", "225", "406"];

function formatPhone(digits10: string): string {
  return `(${digits10.slice(0, 3)}) ${digits10.slice(3, 6)}-${digits10.slice(6)}`;
}

/** Deterministic (no Math.random) so the story renders identically every
 *  time — cycles through name/color pools and varies channel support per
 *  agent instead of giving every agent all four channels. */
function buildAgents(count: number): CreateNewAgentRecord[] {
  const agents: CreateNewAgentRecord[] = [];
  for (let i = 0; i < count; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[(i + Math.floor(i / FIRST_NAMES.length)) % LAST_NAMES.length];
    const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
    // Vary channel support: every agent gets voice, and a rotating subset
    // of the remaining three so the flyout isn't identical for every row.
    const extra = ALL_CHANNELS.slice(1).filter((_, idx) => (i + idx) % 3 !== 0);
    const areaCode = AREA_CODES[i % AREA_CODES.length];
    const mobileDigits = `${areaCode}555${String(1000 + ((i * 41) % 9000)).padStart(4, "0")}`;
    const workDigits = `${areaCode}200${String(1000 + ((i * 53) % 9000)).padStart(4, "0")}`;
    agents.push({
      id: `agent-${i + 1}`,
      name: `${first} ${last}`,
      agentId: `AGT-${2000 + i}`,
      channels: ["voice", ...extra],
      avatarClassName: `bg-lyra-accent-${color}-soft text-lyra-accent-${color}-strong`,
      status: STATUS_CYCLE[i % STATUS_CYCLE.length],
      phoneNumbers: [
        { value: `+1${mobileDigits}`, label: `Mobile · ${formatPhone(mobileDigits)}` },
        { value: `+1${workDigits}`, label: `Work · ${formatPhone(workDigits)}` },
      ],
    });
  }
  return agents;
}

export const CREATE_NEW_AGENTS: CreateNewAgentRecord[] = buildAgents(100);
