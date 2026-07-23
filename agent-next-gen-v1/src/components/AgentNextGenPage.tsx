import React, { useState, useEffect, useMemo, useRef } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";
import {
  AppHeader,
  AppName,
  AppMenu,
  CXoneLogo,
  Modal,
  AiPanel,
  DraggablePanel,
  NotificationsBell,
  AgentNotifications,
  AgentProfile,
  Container,
  InteriorPanel,
  CustomerInformationPanel,
  PanelPinButton,
  PageHeader,
  Button,
  ActionIconButton,
  AiSparkleIcon,
  Tag,
  Input,
  LeftNav,
  CreateNew,
  useOutboundAddButton,
  InteractionNavItem,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  SortableTableHead,
  Icon,
  Separator,
  DonutChart,
  DashboardCard,
  DashboardQueue,
  AgentWelcomeMessage,
  TabList,
  Tab,
  ChannelTab,
  Popover,
  RadioGroup,
  RadioGroupItem,
  DateRangePicker,
  filterChipVariants,
  Menu,
  Select,
  Tooltip,
  type SelectOption,
  type NavItem,
  type SortDirection,
  type DateRange,
  type CreateNewOutboundConfig,
  type CreateNewOutboundContact,
  type InteractionChannel,
  type ChannelType,
  type AgentStatus,
  type AppMenuGroup,
  type AgentNotification,
  type DraggableVariant,
  type MenuEntry,
} from "@nicecxone/lyra-ui";
import { CREATE_NEW_AGENTS } from "@nicecxone/lyra-ui/agents-data";
import { CREATE_NEW_CUSTOMERS } from "@nicecxone/lyra-ui/customers-data";
import appIcon from "@/assets/app-icon.svg";
import {
  Home,
  Settings,
  Phone,
  PhoneOutgoing,
  PhoneIncoming,
  Voicemail,
  ClipboardList,
  Mail,
  MessageSquare,
  MessageCircle,
  Share2,
  Clock,
  ArrowDown,
  ArrowUp,
  TrendingUp,
  CheckCircle2,
  CircleDot,
  MinusCircle,
  Gauge,
  ChevronDown,
  MoreVertical,
  RotateCcw,
  UserPlus,
  UserRound,
  User,
  Info,
  Inbox,
  CalendarDays,
  MonitorUp,
  type LucideIcon,
} from "lucide-react";

/* ── App menu builder (needs onNavigate so built inside the component) ── */

function buildAppMenuGroups(onNavigate?: (page: Page) => void): AppMenuGroup[] {
  return [
    {
      items: [
        { label: "Agent Next Gen", active: true },
        { label: "Agent Workspace Premium", onClick: () => onNavigate?.("agent-workspace") },
        { label: "Outbound Engagement", onClick: () => onNavigate?.("outbound") },
        { label: "Login", onClick: () => onNavigate?.("login") },
      ],
    },
  ];
}

/* ── Create New → Outbound config ──
   Mirrors lyra-ui's CreateNew "Create New → Outbound" story (see
   lyra-ui/src/components/__stories__/create-new-outbound-mock.tsx) — only
   "Outbound" is wired up, the rest render as coming-soon placeholders. Teams
   and skills below are small, app-specific lists kept local, but the agent
   and customer "database" records themselves come from lyra-ui's shared
   fixture files (via the /agents-data and /customers-data aliases in
   vite.config.ts) so this app's Outbound picker can't quietly drift out of
   sync with lyra-ui's own story — same records, mapped into the shape
   `CreateNew` expects exactly like lyra-ui's own mock file does. */

function initialsFor(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

const OUTBOUND_AGENTS: NonNullable<CreateNewOutboundConfig["groups"][number]["contacts"]> = CREATE_NEW_AGENTS.map((a) => ({
  id: a.id,
  name: a.name,
  initials: initialsFor(a.name),
  subtitle: a.agentId,
  avatarClassName: a.avatarClassName,
  channels: a.channels,
  status: a.status,
}));

const OUTBOUND_CUSTOMERS: NonNullable<CreateNewOutboundConfig["groups"][number]["contacts"]> = CREATE_NEW_CUSTOMERS.map((c) => ({
  id: c.id,
  name: c.name,
  initials: initialsFor(c.name),
  subtitle: c.customerId,
  avatarClassName: c.avatarClassName,
  channels: c.channels,
}));

const OUTBOUND_TEAMS: NonNullable<CreateNewOutboundConfig["groups"][number]["contacts"]> = [
  { id: "t1", name: "Billing Support",    initials: "BS", subtitle: "TEAM-04", avatarClassName: "bg-lyra-accent-purple-soft text-lyra-accent-purple-strong", channels: ["voice", "email"] },
  { id: "t2", name: "Tier 2 Escalations", initials: "T2", subtitle: "TEAM-07", avatarClassName: "bg-lyra-accent-red-soft text-lyra-accent-red-strong",       channels: ["voice", "email"] },
];

const OUTBOUND_SKILLS: NonNullable<CreateNewOutboundConfig["groups"][number]["contacts"]> = [
  { id: "s1", name: "Spanish Language",  initials: "ES", subtitle: "SKL-12", avatarClassName: "bg-lyra-accent-green-soft text-lyra-accent-green-strong", channels: ["voice", "email"], status: "available", queueCount: 4, waitTimeSeconds: 200 },
  { id: "s2", name: "Technical Support", initials: "TS", subtitle: "SKL-03", avatarClassName: "bg-lyra-accent-blue-soft text-lyra-accent-blue-strong",   channels: ["voice", "email"], status: "busy",      queueCount: 7, waitTimeSeconds: 95 },
];

const OUTBOUND_CONFIG: CreateNewOutboundConfig = {
  outboundTitle: "New Outbound",
  groups: [
    { id: "favorites", label: "Favorites", kind: "favorites", emptyMessage: "No favorites yet" },
    { id: "agents", label: "Agents", searchPlaceholder: "Search Agents", contacts: OUTBOUND_AGENTS },
    { id: "teams", label: "Teams", searchPlaceholder: "Search teams", contacts: OUTBOUND_TEAMS },
    { id: "skills", label: "Skills", searchPlaceholder: "Search skills", contacts: OUTBOUND_SKILLS },
    { id: "customers", label: "Customers", searchPlaceholder: "Search customers", contacts: OUTBOUND_CUSTOMERS },
    { id: "dialpad", label: "Dial Pad", kind: "dialpad" },
  ],
  defaultGroupId: "agents",
  channelOptions: [
    { id: "voice",    label: "Call",     selectLabel: "Voice", icon: <Phone         className="h-5 w-5" strokeWidth={1.5} /> },
    { id: "email",    label: "Email",                          icon: <Mail          className="h-5 w-5" strokeWidth={1.5} /> },
    { id: "sms",      label: "SMS",                            icon: <MessageSquare className="h-5 w-5" strokeWidth={1.5} /> },
    { id: "whatsapp", label: "WhatsApp",                       icon: <MessageCircle className="h-5 w-5" strokeWidth={1.5} /> },
  ],
  phoneOptions: [
    { value: "+14563833329", label: "(456) 383-3329" },
    { value: "+14565559981", label: "(456) 555-9981" },
    { value: "+14565550147", label: "(456) 555-0147" },
  ],
  skillOptions: [
    { value: "general", label: "General Support" },
    { value: "technical", label: "Technical Support" },
    { value: "billing", label: "Billing" },
    { value: "sales", label: "Sales" },
    { value: "escalations", label: "Escalations" },
    { value: "vip", label: "VIP Support" },
  ],
  onQuickDial: (phoneNumber) => {
    // eslint-disable-next-line no-console
    console.log("Quick dial:", phoneNumber);
  },
  onStartCall: (selection) => {
    // eslint-disable-next-line no-console
    console.log(
      "Start call:",
      selection.channel,
      "→",
      selection.contact.name,
      `(phone: ${selection.phone}, skill: ${selection.skillId})`
    );
  },
  pageSize: 10,
};

/* ── Left nav interactions ──
   Live InteractionNavItem cards launched from CreateNew above — see
   lyra-ui's AgentNextGenTemplate.stories.tsx for the reference
   implementation this mirrors. No cards exist until the agent actually
   starts one; starting a second channel with a contact who already has a
   card folds it into that same card *only* when it's the same channel type
   on the same address (restarting its timer) — a different address on the
   same type (e.g. a second SMS thread on a different number) opens as its
   own additional row instead of replacing the first, since it's a genuinely
   separate conversation. "Unassign & Dismiss" (any channel's kebab menu)
   removes just that channel via InteractionNavItem's `onDismissChannel`
   when others are still open, or the whole card via `onDismiss` when it was
   the last one — see `handleDismissChannel`/`handleDismissInteraction`. */

/** A channel open within one live interaction — tracks when it started
 *  (in ticks of the shared clock below) rather than a fixed elapsed string,
 *  so the rendered `InteractionChannel.elapsed` keeps counting up live. */
interface TrackedChannel {
  /** Unique identity for this specific channel, so two channels of the same
   *  `type` (e.g. two SMS threads on different numbers) are tracked as
   *  separate rows instead of one overwriting the other — see
   *  `InteractionChannel.id`'s own doc comment in lyra-ui. Built from
   *  `type` + `value` (`"sms:+14565559981"`) so restarting the *same*
   *  address correctly reuses/refreshes the existing row (see
   *  `handleStartCall`) while a different address never collides with it.
   *  Quick-dialed/redialed channels (no CreateNew contact/address) just use
   *  their `type`, since those flows already fully replace `channels`
   *  rather than merging into it. */
  id: string;
  type: ChannelType;
  startTick: number;
  /** Routing skill label for this channel, shown as its body copy — looked
   *  up from OUTBOUND_CONFIG.skillOptions at start-call time. */
  preview?: string;
  /** The phone number/email address/WhatsApp handle this channel was
   *  started on (from `handleStartCall`'s `selection.phone`) — surfaced
   *  back into CreateNew's `openChannelAddresses` so reopening the outbound
   *  picker for this contact disables only that exact address in "Select
   *  Phone"/"Select Email Address"/"Select WhatsApp Handle", not the whole
   *  field. Undefined for quick-dialed/redialed channels, which don't go
   *  through CreateNew's contact flow. */
  value?: string;
  /** Human-readable version of `value` for display (e.g. "(456) 383-3329"
   *  vs. `value`'s raw "+14563833329") — looked up from
   *  `OUTBOUND_CONFIG.phoneOptions` at start-call time, same pattern as
   *  `preview`/`skillLabel` above. Kept separate from `value` since `value`
   *  has to stay the raw address for the `openChannelAddresses` dedup match
   *  in "Select Phone"/etc. to keep working. Shown on this channel's
   *  `ChannelTab` (see the `activeInteraction` block below) as "SMS |
   *  (456) 383-3329" — undefined just means the tab shows icon + type label
   *  with no address (e.g. a redialed voice call, which has no stored
   *  number at all). */
  addressLabel?: string;
  /** Whether the customer has sent a message on this channel that the agent
   *  hasn't replied to yet — drives the row's red/critical chip+clock
   *  styling (green/success otherwise). Always omitted (falsy) at
   *  start-call/quick-dial/redial time: an agent-initiated outbound channel
   *  has nothing pending from the customer the moment it opens, so it
   *  should never render red immediately just because its `type` isn't
   *  voice. There's no live customer-reply event in this demo to flip it
   *  true later — this field exists so that mechanism has somewhere to
   *  plug in without re-introducing the "every non-voice channel is
   *  permanently red" bug this replaced. */
  awaitingResponse?: boolean;
  /** Total message count for this channel's conversation, shown only on this
   *  channel's `ChannelTab` tooltip (see the `activeInteraction` block
   *  below), never on the tab face itself. There's no real message store in
   *  this demo, so `handleStartCall`/`handleQuickDial`/`handleRedial` just
   *  set this directly at channel-creation time: `0` for a freshly started
   *  outbound conversation on any digital channel (the tooltip reads "0
   *  Messages", which is correct — nothing's been exchanged yet), left
   *  `undefined` entirely for voice (no message concept at all, so the
   *  tooltip's message segment is omitted rather than showing "0 Messages"
   *  for a channel type that doesn't have messages). */
  messageCount?: number;
  /** This channel's own conversation/session id — distinct from
   *  `ActiveInteraction.recordId` below (the *customer/case* record shown in
   *  the page header): one record can have several channels open, each its
   *  own conversation with its own id. Synthesized via
   *  `generateInteractionId()` at channel-creation time (for every channel
   *  type, including voice); shown on this channel's `ChannelTab` tooltip as
   *  "#{interactionId}". */
  interactionId?: string;
}

/** One live interaction in the left nav — an agent/customer/team/skill
 *  contact (or, for a quick-dialed number with no contact record, the
 *  number itself) plus every channel currently open with them. Keyed by
 *  contact id (or `quickdial:<number>`) so starting a second channel with
 *  the same contact adds to this interaction's `channels` instead of
 *  creating a second card. */
interface ActiveInteraction {
  id: string;
  customerName?: string;
  /** Customer/agent/team/skill record id shown under the name on this
   *  interaction's detail page header — the contact's real id
   *  (`CreateNewOutboundContact.subtitle`, e.g. a customerId/agentId) when
   *  the interaction was started from a known record, `entry.caseId` when
   *  redialed from Contact History, or a freshly generated case number
   *  (`generateCaseId`) for quick-dialed numbers with no matching record. */
  recordId: string;
  channels: TrackedChannel[];
  /** Which open channel is "current" — shared source of truth between this
   *  interaction's `InteractionNavItem` card (its `currentChannelKey` prop)
   *  and its `ChannelTab` bar (each tab's `active`), so clicking either one
   *  updates the other. A `TrackedChannel.id` (falls back to the last
   *  channel's own id when unset — see the `?? mostRecentId` reads below —
   *  same default a fresh interaction already had before this field
   *  existed). Kept in sync by `handleStartCall`/`handleQuickDial`/
   *  `handleRedial` (a new/refreshed channel always takes over as current,
   *  mirroring `InteractionNavItem`'s own auto-select-newest rule) and by
   *  `handleChannelSelect` (a row or tab click). */
  currentChannelId?: string;
}

/** Fallback case id for interactions with no real customer/agent/team/skill
 *  record behind them (quick-dialed numbers) — same "CS-" + digits shape as
 *  every other generated case id in this file, just namespaced separately
 *  since those already-real ids come with their own prefix per record type
 *  (customerId/agentId/TEAM-.../SKL-.../ASN-...). */
function generateCaseId(): string {
  return `CS-${Math.floor(1000000 + Math.random() * 9000000)}`;
}

/** Synthesized per-channel conversation/session id — same plain-numeric
 *  shape as the reference screenshot ("#707535188548", 12 digits, no
 *  prefix) — distinct from `generateCaseId`'s "CS-" shape, which is a
 *  customer/case-level id, not a per-channel one. See
 *  `TrackedChannel.interactionId`'s own doc comment for why these are two
 *  different things. */
function generateInteractionId(): string {
  return String(Math.floor(100000000000 + Math.random() * 900000000000));
}

/** Renders a tick count (seconds since the channel/interaction started) as
 *  the "MM:SS" format InteractionNavItem's `elapsed` prop expects. */
function formatElapsedTime(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const mm = Math.floor(clamped / 60);
  const ss = clamped % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/** Same idea as `formatElapsedTime` above but "HH:MM:SS", for the home tab's
 *  queue widgets — their wait time can run past an hour (e.g. voicemail),
 *  unlike a just-started interaction's MM:SS elapsed display. */
function formatWaitTime(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const hh = Math.floor(clamped / 3600);
  const mm = Math.floor((clamped % 3600) / 60);
  const ss = clamped % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/* ── Left nav items ──
   Built from whether an interaction is currently active (see
   `activeInteraction` below) rather than a static array, so "Home" (the
   rail item — still routes to the Desk dashboard) stops showing as active —
   and becomes clickable to navigate back — the moment an assignment takes
   over the main content area. "Settings" sits below Home as a plain rail
   item (same convention as lyra-ux-templates' and the
   lyra-ui template story's own `buildNavItems`/`NAV_ITEMS`, both of which
   already end their rail with a Settings item) rather than a standalone
   AppHeader icon — see the `actions` block below, which no longer has one.
   Settings is now a real third view (see `showSettings` state) — clicking
   it opens a blank "Settings" page in the content column and highlights
   this rail item, same on/off-exclusivity as Home vs. an active
   interaction. */

function buildNavItems(
  hasActiveInteraction: boolean,
  onDeskClick: () => void,
  showSettings: boolean,
  onSettingsClick: () => void
): NavItem[] {
  return [
    {
      icon: <Home className="h-4 w-4" strokeWidth={1.5} />,
      label: "Home",
      active: !hasActiveInteraction && !showSettings,
      onClick: onDeskClick,
    },
    {
      icon: <Settings className="h-4 w-4" strokeWidth={1.5} />,
      label: "Settings",
      active: showSettings,
      onClick: onSettingsClick,
    },
  ];
}

/* ── Sample notifications ── */

const INITIAL_NOTIFICATIONS: AgentNotification[] = [
  { id: "1", type: "new-case",    title: "New Case",    subtitle: "Noah Patel",    timestamp: "13m ago", read: false },
  { id: "2", type: "new-chat",    title: "New Chat",    subtitle: "Sarah Miller",  timestamp: "18m ago", read: false },
  { id: "3", type: "escalation",  title: "Escalation",  subtitle: "Lauren Kim",    timestamp: "24m ago", read: false },
  { id: "4", type: "new-case",    title: "New Case",    subtitle: "Ethan Zhang",   timestamp: "37m ago", read: true  },
  { id: "5", type: "new-chat",    title: "New Chat",    subtitle: "Olivia Reed",   timestamp: "51m ago", read: true  },
  { id: "6", type: "missed-call", title: "Missed Call", subtitle: "David Brown",   timestamp: "1h ago",  read: true  },
];

/* ── Sample latest contacts ── */

interface ContactInteraction {
  id: string;
  caseId: string;
  priority: number;
  type: "email" | "chat" | "voice";
  direction: "inbound" | "outbound";
  createDate: string;
  status: "open" | "closed";
  channel: string;
  resolutionTime: string;
  skill: string;
  owner: string;
}

interface LatestContact {
  id: string;
  name: string;
  status: "open" | "closed";
  /** Rendered left of the name in the accordion trigger row — matches the queue's channel type (chat/voice/voicemail/task). */
  icon: LucideIcon;
  /** Drives both the body copy ("{N} contacts in queue") and the "Contacts" metric at the end of the row, so the two numbers can't drift apart. */
  contactsCount: number;
  /** Drives the "Skills" metric at the end of the row. */
  skillsCount: number;
  /** "Agents" metric on the home tab's queue widget — a static per-queue headcount (not derived from `QueueSubItem`, which has no single "assigned agents" total of its own to stay in sync with). */
  agentsCount: number;
  channel: string;
  wait: string;
  caseId: string;
  interactions: ContactInteraction[];
}

/* Sample interaction-history rows, cycled per contact so each accordion's
   interior table has a few realistic-looking prior interactions. Each source
   pairs a Type icon (email/chat/voice) with a real-looking channel + skill label. */
const INTERACTION_CHANNELS: { type: ContactInteraction["type"]; channel: string; skill: string }[] = [
  { type: "chat",  channel: "mojo_finance_async", skill: "" },
  { type: "email", channel: "CXi SME Email",      skill: "Chat_General" },
  { type: "chat",  channel: "Chat_General",       skill: "Chat_General" },
  { type: "chat",  channel: "Rebooking_Chat",     skill: "Rebooking" },
  { type: "voice", channel: "Voice_General",      skill: "" },
  { type: "email", channel: "Email_Support",      skill: "Billing_Support" },
  { type: "chat",  channel: "SMS_General",        skill: "Technical_Support" },
];

const RESOLUTION_TIMES = ["0 sec", "12 sec", "45 sec", "1 min", "2 min", "3 min", "5 min", "8 min"];

/* Logged-in agent — matches the "Good morning, John" home screen greeting.
   Used both to populate the Owner Assignee column and to decide whether an
   interaction's kebab menu should offer "Assign To Me" (only when it isn't
   already his). */
const CURRENT_AGENT_NAME = "John Smith";
const [CURRENT_AGENT_FIRST_NAME, CURRENT_AGENT_LAST_NAME] = CURRENT_AGENT_NAME.split(" ");

/* Home tab greeting — "Good morning/afternoon/evening" based on the
   visitor's actual local time (not the static "Good morning" the welcome
   modal below always shows), read fresh on every render. */
function getGreetingPeriod(): "morning" | "afternoon" | "evening" {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

/* Welcome modal — last login timestamp, assigned-skills count, and live
   online/available teammate counts shown under the greeting. */
const WELCOME_MODAL_LAST_LOGIN = "Today at 8:42 AM";
const AGENT_SKILLS_COUNT = 3;
const TEAMMATES_ONLINE_COUNT = 8;
const TEAMMATES_AVAILABLE_COUNT = 5;

const INTERACTION_OWNERS = [
  "John Smith",
  "Kevin Jensen",
  "Andres Arenas",
  "Priya Anand",
  "Erwin de Vera",
  "Tim O'Connor",
  "Josh Robertson",
];

/* Deterministic 12-digit case-ID generator (no Math.random, so the dashboard
   renders the same sample data on every load) */
function makeCaseId(seed: number, i: number): string {
  return String(470000000000 + seed * 111111 + i * 7777);
}

function formatCreateDate(seed: number, i: number): string {
  const month = 1 + ((seed * 5 + i) % 12);
  const day = 1 + ((seed * 3 + i * 5) % 28);
  const year = 24 + ((seed + i) % 3);
  const hour24 = (seed * 2 + i * 3) % 24;
  const minute = (seed * 7 + i * 13) % 60;
  const isPM = hour24 >= 12;
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}/${year} ${hour12}:${String(minute).padStart(2, "0")} ${isPM ? "PM" : "AM"}`;
}

/* contactStatus drives every interaction's status: a closed case has every
   interaction closed; an open case has exactly one (its most recent, i === 0)
   still-open interaction — which also has no resolution time yet — while the
   rest of its history is closed. */
function buildInteractions(seed: number, contactStatus: "open" | "closed", count: number): ContactInteraction[] {
  return Array.from({ length: count }, (_, i) => {
    const source = INTERACTION_CHANNELS[(seed + i) % INTERACTION_CHANNELS.length];
    const isStillOpen = contactStatus === "open" && i === 0;
    return {
      id: `${seed}-${i}`,
      caseId: makeCaseId(seed, i),
      priority: 0,
      type: source.type,
      direction: i % 2 === 0 ? "inbound" : "outbound",
      createDate: formatCreateDate(seed, i),
      status: isStillOpen ? "open" : "closed",
      channel: source.channel,
      resolutionTime: isStillOpen ? "—" : RESOLUTION_TIMES[(seed * 3 + i * 5) % RESOLUTION_TIMES.length],
      skill: source.skill,
      owner: INTERACTION_OWNERS[(seed * 5 + i * 3) % INTERACTION_OWNERS.length],
    };
  });
}

/* ── Queue widget side panel (drill-down) ──
   Clicking one of the four home-tab queue widgets opens the interior panel
   with this queue's own skills — e.g. "Digital" breaks down into its own
   channels (UX Chat, UX Email, UX SMS, Social Support). Each row shows an
   icon matching its own label (not a single icon reused across every row),
   how many contacts are waiting, the longest wait time, and — per explicit
   confirmation — the same Available/Working/Unavailable agent breakdown
   the Activity/Productivity cards already use: same icons
   (CheckCircle2/CircleDot/MinusCircle), same success/warning/critical
   colors, same left-to-right order, just rendered as compact circular
   `Icon` badges here instead of a donut or bar.

   `INITIAL_QUEUE_SUB_ITEMS` is only the *seed* — the component below holds
   the live copy in `queueSubItems` state (see "Live queue simulation" near
   the component's other state) so the home tab's Contacts metric can
   visibly fluctuate over time while staying derived from this same list
   (see `sumInQueue` below), not an independently-randomized number.

   Defined before the queue-widget row (rather than after, as it originally
   was) so each queue widget's `skillsCount` can be derived from this
   list's own length — see the comment on `LATEST_CONTACTS_STATIC` below. */
interface QueueSubItem {
  id: string;
  label: string;
  icon: LucideIcon;
  inQueueCount: number;
  wait: string;
  available: number;
  working: number;
  unavailable: number;
}

const INITIAL_QUEUE_SUB_ITEMS: Record<string, QueueSubItem[]> = {
  "1": [
    { id: "d1", label: "UX Chat",         icon: MessageSquare, inQueueCount: 2, wait: "3m 5s", available: 3, working: 1, unavailable: 0 },
    { id: "d2", label: "UX Email",        icon: Mail,          inQueueCount: 2, wait: "3m 5s", available: 3, working: 1, unavailable: 0 },
    { id: "d3", label: "UX SMS",          icon: MessageCircle, inQueueCount: 2, wait: "3m 5s", available: 3, working: 1, unavailable: 0 },
    { id: "d4", label: "Social Support",  icon: Share2,        inQueueCount: 2, wait: "3m 5s", available: 3, working: 1, unavailable: 0 },
  ],
  "2": [
    { id: "v1", label: "AKR_Phone_IB",              icon: PhoneIncoming, inQueueCount: 0, wait: "0s", available: 0, working: 0, unavailable: 1 },
    { id: "v2", label: "AKR_Phone_IB_Sales",        icon: PhoneIncoming, inQueueCount: 0, wait: "0s", available: 0, working: 0, unavailable: 1 },
    { id: "v3", label: "Auto Attendant",            icon: PhoneIncoming, inQueueCount: 0, wait: "0s", available: 0, working: 0, unavailable: 1 },
    { id: "v4", label: "Auto Inbound",               icon: PhoneIncoming, inQueueCount: 0, wait: "0s", available: 0, working: 0, unavailable: 1 },
    { id: "v5", label: "KJ_Inbound_Phone",          icon: PhoneIncoming, inQueueCount: 0, wait: "0s", available: 1, working: 0, unavailable: 1 },
    { id: "v6", label: "mojo_finance_voice_support", icon: PhoneIncoming, inQueueCount: 0, wait: "0s", available: 0, working: 0, unavailable: 1 },
  ],
  "3": [
    { id: "vm1", label: "UX Voicemail",  icon: Voicemail, inQueueCount: 3, wait: "15m", available: 1, working: 0, unavailable: 1 },
    { id: "vm2", label: "After-Hours VM", icon: Voicemail, inQueueCount: 0, wait: "0s",  available: 0, working: 0, unavailable: 0 },
  ],
  "4": [
    { id: "w1", label: "Case Management", icon: ClipboardList, inQueueCount: 4, wait: "30m", available: 2, working: 3, unavailable: 0 },
    { id: "w2", label: "Escalations",     icon: ClipboardList, inQueueCount: 1, wait: "10m", available: 1, working: 1, unavailable: 0 },
    { id: "w3", label: "Billing Review",  icon: ClipboardList, inQueueCount: 0, wait: "0s",  available: 1, working: 0, unavailable: 0 },
  ],
};

/* Contact-in-queue counts for each queue widget — NOT independently
   randomized (that was the bug: an earlier version generated these with
   `randomContactsCount()`, a plausible-looking number with no connection to
   the actual queue data, so the metric card's "Contacts" count and the side
   panel's own "In Queue" figures for the same queue could — and did —
   disagree, e.g. "2 Contacts" on a queue whose sub-items summed to 5).
   Fixed the same way `skillsCount` already worked, and still true now that
   the source list is React state instead of a module constant: derived
   directly from a `QueueSubItem[]`, the same list the side panel renders,
   so the two can never drift apart — including while the live simulation
   below is nudging that list's counts up and down. */
function sumInQueue(items: QueueSubItem[]): number {
  return items.reduce((total, item) => total + item.inQueueCount, 0);
}

/** Static per-queue "Agents" metric for the home tab's queue widgets — a
 *  headcount `QueueSubItem` has no single equivalent of (its own
 *  available/working/unavailable are per-channel, not a queue-wide total),
 *  so unlike `contactsCount`/`skillsCount` this one has no underlying list
 *  to derive from and is just seeded to match the reference screenshot. */
const AGENTS_COUNT_BY_QUEUE: Record<string, number> = { "1": 3, "2": 2, "3": 3, "4": 11 };

/** Baseline queue-wait seconds (matches the reference screenshot's
 *  00:02:34 / 00:00:00 / 00:02:00 / 00:00:24) — the component below adds
 *  the shared `clockTick` counter to these every render so the home tab's
 *  "Wait Time" ticks up in real time like a live clock, the same
 *  convention `formatElapsedTime`'s callers already use for interaction
 *  elapsed-time displays. */
const QUEUE_WAIT_BASE_SECONDS: Record<string, number> = { "1": 154, "2": 0, "3": 120, "4": 24 };

/* Everything about each queue widget that never changes on its own — kept
   separate from the derived/ticking fields (`contactsCount`, `skillsCount`,
   `agentsCount`, `wait`) so those can be recomputed each render (see the
   `latestContacts` useMemo inside the component) without re-running
   `buildInteractions` every tick. */
const LATEST_CONTACTS_STATIC: Omit<LatestContact, "contactsCount" | "skillsCount" | "agentsCount" | "wait">[] = [
  { id: "1", name: "Digital",       icon: MessageSquare, status: "open",   channel: "Atlas", caseId: "CST-21009", interactions: buildInteractions(1, "open", 3) },
  { id: "2", name: "Inbound Voice", icon: PhoneIncoming, status: "open",   channel: "Atlas", caseId: "CST-21016", interactions: buildInteractions(2, "open", 5) },
  { id: "3", name: "Voicemail",     icon: Voicemail,     status: "closed", channel: "Atlas", caseId: "CST-21028", interactions: buildInteractions(3, "closed", 1) },
  { id: "4", name: "Work Item",     icon: ClipboardList, status: "open",   channel: "Emily", caseId: "CST-15001", interactions: buildInteractions(4, "open", 7) },
];

/* ── Home screen summary cards ── */

type DateFilterValue = "today" | "yesterday" | "last7" | "custom";

/* Dummy Performance data per date range — drives the Performance summary
   card's rows/footer so the numbers actually change when a range is picked.
   `overallPerformance` is a percentage (replaces the old "CSAT Score"
   0-5 rating), stored pre-formatted with the "%" like every other range
   here does with its own unit. */
const PERFORMANCE_DATA_BY_RANGE: Record<
  DateFilterValue,
  { casesResolved: string; overallPerformance: string; handleTime: string; improvement: string }
> = {
  today:     { casesResolved: "12",  overallPerformance: "96%", handleTime: "8m 32s", improvement: "15% improvement" },
  yesterday: { casesResolved: "19",  overallPerformance: "92%", handleTime: "9m 05s", improvement: "8% improvement" },
  last7:     { casesResolved: "104", overallPerformance: "94%", handleTime: "8m 50s", improvement: "11% improvement" },
  custom:    { casesResolved: "—",   overallPerformance: "—",   handleTime: "—",      improvement: "Select a range" },
};

/* Channel Type breakdown (Performance card) — Inbound/Outbound call counts,
   "you" vs. "team", per date range. Same static-meta + per-range-values
   split as `PRODUCTIVITY_STATUS_META`/`PRODUCTIVITY_DATA_BY_RANGE` below,
   and rendered with that same row shape (icon+label+value, indented "Team"
   comparison line beneath) rather than a literal `Table` — a plain stacked
   list reads fine for 2-3 rows and keeps this card visually consistent
   with the Productivity card right next to it. */

type ChannelTypeId = "inbound" | "outbound";

interface ChannelTypeMeta {
  id: ChannelTypeId;
  label: string;
  icon: LucideIcon;
}

const CHANNEL_TYPE_META: ChannelTypeMeta[] = [
  { id: "inbound",  label: "Inbound",  icon: PhoneIncoming },
  { id: "outbound", label: "Outbound", icon: PhoneOutgoing },
];

interface ChannelTypeValue {
  you: number;
  team: number;
}

const CHANNEL_TYPE_DATA_BY_RANGE: Record<DateFilterValue, Record<ChannelTypeId, ChannelTypeValue>> = {
  // Matches the reference screenshot's all-zero state — no calls logged yet today.
  today: {
    inbound:  { you: 0, team: 0 },
    outbound: { you: 0, team: 0 },
  },
  yesterday: {
    inbound:  { you: 14, team: 162 },
    outbound: { you: 9,  team: 98  },
  },
  last7: {
    inbound:  { you: 88, team: 1024 },
    outbound: { you: 52, team: 640  },
  },
  custom: {
    inbound:  { you: 0, team: 0 },
    outbound: { you: 0, team: 0 },
  },
};

/** "% of Team" for a single row — you as a share of the team total. 0 when the team total is 0 (avoids dividing by zero). */
function percentOfTeam(you: number, team: number): number {
  return team > 0 ? Math.round((you / team) * 100) : 0;
}

/* ── Productivity breakdown card (agent state duration bars + date filter chip) ──
   Replaces the third summary card slot — same Container/header styling as the
   Schedule/Performance stat cards (no Table), with a FilterChip (search + Select
   All + checkbox options) for the date filter in the header. Each agent state
   (Available/Working/Unavailable) shows the agent's own duration bar + time,
   plus a lighter "Team" comparison bar + time beneath it. Static id/label/icon
   metadata is kept separate from the per-range numeric values so the date
   filter can swap the values without touching the row definitions. */

type ProductivityStatusId = "available" | "working" | "unavailable";

interface ProductivityStatusMeta {
  id: ProductivityStatusId;
  label: string;
  icon: LucideIcon;
  iconColorClassName: string;
}

const PRODUCTIVITY_STATUS_META: ProductivityStatusMeta[] = [
  { id: "available",   label: "Available",   icon: CheckCircle2, iconColorClassName: "text-lyra-status-success-strong" },
  { id: "working",     label: "Working",     icon: CircleDot,    iconColorClassName: "text-lyra-status-warning-strong" },
  { id: "unavailable", label: "Unavailable", icon: MinusCircle,  iconColorClassName: "text-lyra-status-critical-strong" },
];

/* Sub-state breakdown shown in the info tooltip on the Productivity card's
   Unavailable row — which specific unavailable codes made up that time. */
const UNAVAILABLE_STATE_BREAKDOWN: { label: string; percent: number }[] = [
  { label: "Bio Break", percent: 100 },
  { label: "Break",     percent: 0 },
  { label: "Meeting",   percent: 0 },
  { label: "Team",      percent: 100 },
];

interface ProductivityStatusValue {
  percent: number;
  teamPercent: number;
  time: string;
  teamTime: string;
}

const PRODUCTIVITY_DATA_BY_RANGE: Record<DateFilterValue, Record<ProductivityStatusId, ProductivityStatusValue>> = {
  today: {
    available:   { percent: 22, teamPercent: 28, time: "01:45:12", teamTime: "02:14:40" },
    working:     { percent: 61, teamPercent: 55, time: "04:53:08", teamTime: "04:24:00" },
    unavailable: { percent: 17, teamPercent: 17, time: "01:21:40", teamTime: "01:21:20" },
  },
  yesterday: {
    available:   { percent: 18, teamPercent: 24, time: "01:26:24", teamTime: "01:55:12" },
    working:     { percent: 67, teamPercent: 58, time: "05:21:36", teamTime: "04:38:24" },
    unavailable: { percent: 15, teamPercent: 18, time: "01:12:00", teamTime: "01:26:24" },
  },
  last7: {
    available:   { percent: 24, teamPercent: 27, time: "13:26:00", teamTime: "15:07:20" },
    working:     { percent: 58, teamPercent: 54, time: "32:26:24", teamTime: "30:14:24" },
    unavailable: { percent: 18, teamPercent: 19, time: "10:04:48", teamTime: "10:38:16" },
  },
  custom: {
    available:   { percent: 0, teamPercent: 0, time: "00:00:00", teamTime: "00:00:00" },
    working:     { percent: 0, teamPercent: 0, time: "00:00:00", teamTime: "00:00:00" },
    unavailable: { percent: 0, teamPercent: 0, time: "00:00:00", teamTime: "00:00:00" },
  },
};

const DATE_FILTER_OPTIONS: { value: DateFilterValue; label: string }[] = [
  { value: "today",     label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7",     label: "Last 7 days" },
  { value: "custom",    label: "Custom" },
];

/* Single-select date filter chip — same trigger styling as FilterChip's
   "default" (neutral) variant, via the exported filterChipVariants, so it
   matches the same gray chip look FilterChip itself uses whenever nothing
   is actively narrowing/differing from the norm — including DashboardCard's
   own header FilterChip in its unselected state. This picker always has
   *some* range selected ("Today" by default), but that's just its resting
   state, not a filter being "applied" the way FilterChip's blue "active"
   variant signals — so it shouldn't render permanently blue the way
   `variant: "active"` did before. Uses a RadioGroup (not checkboxes) in the
   popover since only one range can be selected at a time. Selecting
   "Custom" reveals a DateRangePicker beneath the radio list. */
function DateFilterChip({ onValueChange }: { onValueChange?: (value: DateFilterValue) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<DateFilterValue>("today");
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);

  const selectedLabel = DATE_FILTER_OPTIONS.find((o) => o.value === value)?.label ?? "";

  const handleValueChange = (v: DateFilterValue) => {
    setValue(v);
    onValueChange?.(v);
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement="bottom"
      content={
        <div className="flex flex-col gap-3 p-3 w-[260px]">
          <RadioGroup value={value} onValueChange={(v) => handleValueChange(v as DateFilterValue)}>
            {DATE_FILTER_OPTIONS.map((option) => (
              <RadioGroupItem key={option.value} value={option.value} label={option.label} />
            ))}
          </RadioGroup>
          {value === "custom" && (
            <DateRangePicker
              value={customRange}
              onChange={setCustomRange}
              placeholder="Select date range"
            />
          )}
        </div>
      }
    >
      <button type="button" className={cn(filterChipVariants({ variant: "default" }), "rounded-lyra-md")}>
        <span className="inline-flex items-baseline gap-1">
          <span className="lyra-body-md-emphasis whitespace-nowrap">Date:</span>
          <span className="lyra-body-md truncate">{selectedLabel}</span>
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 flex-shrink-0 transition-transform", open && "rotate-180")} strokeWidth={1.5} aria-hidden="true" />
      </button>
    </Popover>
  );
}

/* ── Activity card (donut chart) ──
   Replaces the old Schedule summary card. Reuses the same Available/Working/
   Unavailable status metadata and values as the ring chart at the bottom of
   the Productivity card below (see `ACTIVITY_STATUS_COLORS`), so the two
   stay visually consistent — same colors, same percentages. */
const ACTIVITY_STATUS_COLORS: Record<ProductivityStatusId, { dotClassName: string; colorVar: string }> = {
  available:   { dotClassName: "bg-lyra-status-success-strong",  colorVar: "var(--lyra-color-status-success-strong)" },
  working:     { dotClassName: "bg-lyra-status-warning-strong",  colorVar: "var(--lyra-color-status-warning-strong)" },
  unavailable: { dotClassName: "bg-lyra-status-critical-strong", colorVar: "var(--lyra-color-status-critical-strong)" },
};

/* Productivity breakdown card — agent state duration bars (Available/
   Working/Unavailable, each with a "Team" comparison line beneath) plus,
   below all three rows, the same ring-chart + legend that used to be its
   own standalone "Activity" card. Folded into this card (rather than kept
   separate) on request — the ring visualizes the exact same
   Available/Working/Unavailable percentages already listed above it, so it
   reads as one more view of this card's own data instead of a second card
   repeating it. Both the rows and the ring now share the one live
   `dateFilter`/`values` this card already owns — the ring is no longer
   pinned to "today" the way the standalone Activity card was. */
function PerformanceBreakdownCard() {
  const [dateFilter, setDateFilter] = useState<DateFilterValue>("today");
  const values = PRODUCTIVITY_DATA_BY_RANGE[dateFilter];
  const ringData = PRODUCTIVITY_STATUS_META.map((meta) => ({
    id: meta.id,
    label: meta.label,
    percent: values[meta.id].percent,
    ...ACTIVITY_STATUS_COLORS[meta.id],
  }));

  return (
    <DashboardCard
      variant="neutral-subtle"
      headerTitle="Productivity"
      headerIcon={<Icon icon={Gauge} size="md" background="info" shape="rounded" decorative />}
      headerActions={<DateFilterChip onValueChange={setDateFilter} />}
    >
      <div className="flex flex-col gap-4 px-4 pb-4">
        {PRODUCTIVITY_STATUS_META.map((meta) => {
          const row = values[meta.id];
          return (
            <div key={meta.id} className="flex flex-col gap-1.5">
              {/* Self row */}
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 lyra-body-md-emphasis text-lyra-fg-default">
                  <meta.icon className={cn("h-4 w-4", meta.iconColorClassName)} strokeWidth={1.5} />
                  {meta.label}
                  <span className="lyra-body-sm text-lyra-fg-secondary font-normal">({row.percent}%)</span>
                  {meta.id === "unavailable" && (
                    <Tooltip
                      placement="right"
                      content={
                        <div className="flex flex-col gap-1">
                          {UNAVAILABLE_STATE_BREAKDOWN.map((state) => (
                            <span key={state.label} className="lyra-body-sm text-lyra-fg-default whitespace-nowrap">
                              {state.label} ({state.percent}%)
                            </span>
                          ))}
                        </div>
                      }
                    >
                      <span className="inline-flex items-center text-lyra-fg-secondary hover:text-lyra-fg-action transition-colors cursor-default">
                        <Info className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                        <span className="sr-only">
                          Unavailable breakdown: {UNAVAILABLE_STATE_BREAKDOWN.map((s) => `${s.label} (${s.percent}%)`).join(", ")}
                        </span>
                      </span>
                    </Tooltip>
                  )}
                </span>
                <span className="lyra-body-md-emphasis tabular-nums text-lyra-fg-default">{row.time}</span>
              </div>
              {/* Team comparison row */}
              <div className="flex items-center justify-between gap-3 pl-6">
                <span className="lyra-body-sm text-lyra-fg-secondary">Team ({row.teamPercent}%)</span>
                <span className="lyra-body-sm tabular-nums text-lyra-fg-secondary">{row.teamTime}</span>
              </div>
            </div>
          );
        })}

        <Separator />

        {/* Ring chart + legend — same Available/Working/Unavailable data as
            the rows above, just visualized as a ring instead of stacked bars. */}
        <div className="flex items-center gap-6">
          <div className="h-[120px] w-[120px] shrink-0">
            <DonutChart
              data={ringData.map((d) => ({ label: d.label, value: d.percent, colorVar: d.colorVar }))}
            />
          </div>
          <div className="flex flex-1 flex-col gap-2.5">
            {ringData.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 lyra-body-md text-lyra-fg-secondary">
                  <span className={cn("h-2.5 w-2.5 rounded-full", d.dotClassName)} aria-hidden="true" />
                  {d.label}
                </span>
                <span className="lyra-heading-sm text-lyra-fg-default">{d.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

/* Performance summary card — mirrors PerformanceBreakdownCard's pattern:
   owns its own date filter state and looks up dummy data per range so the
   Assignments Resolved / Overall Performance numbers — and the Channel Type
   breakdown below them — change when a range is picked. */
function PerformanceSummaryCard() {
  const [dateFilter, setDateFilter] = useState<DateFilterValue>("today");
  const data = PERFORMANCE_DATA_BY_RANGE[dateFilter];
  const channelData = CHANNEL_TYPE_DATA_BY_RANGE[dateFilter];
  const overallYou = CHANNEL_TYPE_META.reduce((sum, meta) => sum + channelData[meta.id].you, 0);
  const overallTeam = CHANNEL_TYPE_META.reduce((sum, meta) => sum + channelData[meta.id].team, 0);

  return (
    <DashboardCard
      variant="neutral-subtle"
      headerTitle="Performance"
      headerIcon={<Icon icon={TrendingUp} size="md" background="success" shape="rounded" decorative />}
      headerActions={<DateFilterChip onValueChange={setDateFilter} />}
    >
      <div className="flex flex-col gap-3 px-4 pb-4">
        <div className="flex items-center justify-between">
          <span className="lyra-body-md text-lyra-fg-secondary">Assignments Resolved</span>
          <span className="lyra-heading-sm text-lyra-fg-default">{data.casesResolved}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="lyra-body-md text-lyra-fg-secondary">Overall Performance</span>
          <span className="lyra-heading-sm text-lyra-status-success-strong">{data.overallPerformance}</span>
        </div>
        <Separator />

        {/* Channel Type breakdown — same row shape as PerformanceBreakdownCard's
            Productivity rows (icon+label+value, indented "Team" comparison line
            beneath) rather than a Table, so this section reads consistently with
            the card right next to it. */}
        <span className="lyra-body-sm-emphasis text-lyra-fg-secondary">Channel Type</span>
        <div className="flex flex-col gap-4">
          {CHANNEL_TYPE_META.map((meta) => {
            const row = channelData[meta.id];
            const pct = percentOfTeam(row.you, row.team);
            return (
              <div key={meta.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 lyra-body-md-emphasis text-lyra-fg-default">
                    <meta.icon className="h-4 w-4 text-lyra-fg-secondary" strokeWidth={1.5} />
                    {meta.label}
                  </span>
                  <span className="lyra-body-md-emphasis tabular-nums text-lyra-fg-default">{row.you}</span>
                </div>
                <div className="flex items-center justify-between gap-3 pl-6">
                  <span className="lyra-body-sm text-lyra-fg-secondary">Team ({pct}% of Team)</span>
                  <span className="lyra-body-sm tabular-nums text-lyra-fg-secondary">{row.team}</span>
                </div>
              </div>
            );
          })}

          <Separator />

          {/* Overall — the summed total, same row shape but with no icon and no indent on its own Team line (it's a total, not a per-channel comparison). */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="lyra-body-md-emphasis text-lyra-fg-default">Overall</span>
              <span className="lyra-body-md-emphasis tabular-nums text-lyra-fg-default">{overallYou}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="lyra-body-sm text-lyra-fg-secondary">Team ({percentOfTeam(overallYou, overallTeam)}% of Team)</span>
              <span className="lyra-body-sm tabular-nums text-lyra-fg-secondary">{overallTeam}</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

/* ── Contact History card (home tab, below Performance/Productivity) ──
   A recent-customer-contacts summary — name, resolution status, an optional
   "Redial" action for voice contacts, a one-line case summary, case ID, and
   (right-aligned) the channel + how long ago it happened, plus the handle
   time. The base 5 rows (`CONTACT_HISTORY`) are from a screenshot of
   exactly this content, so those values are that screenshot's own data,
   not derived from any other part of the app. Composed entirely from
   existing lyra-ui atoms — `DashboardCard` for the card shell
   (`headerActions` holding the same `DateFilterChip` the Performance/
   Productivity cards' own headers use, not a one-off "View All" button, so
   this card's date control matches theirs exactly), `Tag` for the status
   pill (`variant="success"` for Resolved, `"warning"` for Transferred —
   the same bordered-tint look CONTRIBUTING.md's Tag entry documents), and
   a plain `Button variant="outline"` for "Redial" (reusing the same
   `PhoneOutgoing` icon `InteractionRowActions`' kebab menu already uses for
   its own "Redial" action, rather than inventing a second icon for the
   same meaning) — no hand-rolled badge/pill markup.

   Row set is driven by the selected date range (`CONTACT_HISTORY_BY_RANGE`):
   "Today" (the default on login — nothing has happened yet this session)
   and "Custom" (no range chosen yet) both render empty, showing a
   "Nothing to Display" placeholder instead of an empty list; "Yesterday"
   shows the base 5 rows; "Last 7 days" widens that with 5 more rows pulled
   from the shared customer "database" (`CREATE_NEW_CUSTOMERS`, the same
   fixture `OUTBOUND_CUSTOMERS` above already sources from) rather than
   inventing unrelated names, so a wider range reads as more of the same
   real customer base. */

interface ContactHistoryEntry {
  id: string;
  name: string;
  statusLabel: string;
  statusVariant: "success" | "warning";
  /** Voice contacts only — shows a "Redial" action next to the status tag. */
  redial: boolean;
  description: string;
  caseId: string;
  channelType: "voice" | "chat" | "email";
  channelLabel: string;
  timeAgo: string;
  duration: string;
}

const CONTACT_HISTORY_CHANNEL_ICON: Record<ContactHistoryEntry["channelType"], LucideIcon> = {
  voice: Phone,
  chat:  MessageCircle,
  email: Mail,
};

const CONTACT_HISTORY: ContactHistoryEntry[] = [
  {
    id: "ch1", name: "Nathan Cole", statusLabel: "Resolved", statusVariant: "success", redial: true,
    description: "Customer was locked out after 5 failed attempts. Verified identity via KBA, reset credentials, and confirmed access restored.",
    caseId: "CST-22841", channelType: "voice", channelLabel: "Voice", timeAgo: "8m ago", duration: "8m 14s",
  },
  {
    id: "ch2", name: "Priya Shah", statusLabel: "Resolved", statusVariant: "success", redial: false,
    description: "Duplicate charge dispute — $89.99 refund issued",
    caseId: "CST-30164", channelType: "chat", channelLabel: "Chat", timeAgo: "34m ago", duration: "12m 02s",
  },
  {
    id: "ch3", name: "Omar Farooq", statusLabel: "Resolved", statusVariant: "success", redial: false,
    description: "Plan upgrade confirmation & feature overview",
    caseId: "CST-16823", channelType: "email", channelLabel: "Email", timeAgo: "2h ago", duration: "6m 30s",
  },
  {
    id: "ch4", name: "Lauren Briggs", statusLabel: "Transferred", statusVariant: "warning", redial: true,
    description: "Escalated fraud investigation — 4 suspicious transactions",
    caseId: "CST-27760", channelType: "voice", channelLabel: "Voice", timeAgo: "5h ago", duration: "22m 47s",
  },
  {
    id: "ch5", name: "Mei Tanaka", statusLabel: "Resolved", statusVariant: "success", redial: false,
    description: "Shipping delay — expedited replacement dispatched",
    caseId: "CST-31045", channelType: "chat", channelLabel: "Chat", timeAgo: "1d ago", duration: "9m 15s",
  },
];

const CONTACT_HISTORY_CHANNEL_LABEL: Record<ContactHistoryEntry["channelType"], string> = {
  voice: "Voice",
  chat: "Chat",
  email: "Email",
};

/** Maps a customer's supported `ChannelType[]` (from `CREATE_NEW_CUSTOMERS`,
 *  e.g. `["email", "sms", "voice"]`) down to Contact History's own narrower
 *  channel grouping — voice takes priority (it's what "Redial" needs),
 *  then sms/whatsapp both read as "Chat", falling back to "Email" (every
 *  customer record includes it). */
function contactHistoryChannelType(channels: ChannelType[]): ContactHistoryEntry["channelType"] {
  if (channels.includes("voice")) return "voice";
  if (channels.includes("sms") || channels.includes("whatsapp")) return "chat";
  return "email";
}

// Fixed customer indexes + content templates for the 5 extra "Last 7 days"
// rows — deterministic (not `Math.random()`), matching the rest of this
// file's dummy-data convention. Names/case IDs come from the real
// `CREATE_NEW_CUSTOMERS` records at these indexes; only the description/
// status/timing are authored here.
const EXTENDED_CONTACT_HISTORY_CUSTOMER_INDEXES = [5, 12, 19, 26, 33];
const EXTENDED_CONTACT_HISTORY_TEMPLATES: {
  statusLabel: string;
  statusVariant: "success" | "warning";
  description: string;
  timeAgo: string;
  duration: string;
}[] = [
  { statusLabel: "Resolved", statusVariant: "success", description: "Password reset — identity verified via KBA, access restored", timeAgo: "1d ago", duration: "7m 40s" },
  { statusLabel: "Resolved", statusVariant: "success", description: "Billing question — walked through recent charges, no refund needed", timeAgo: "1d ago", duration: "5m 18s" },
  { statusLabel: "Transferred", statusVariant: "warning", description: "Product setup issue escalated to Tier 2 for configuration support", timeAgo: "2d ago", duration: "14m 05s" },
  { statusLabel: "Resolved", statusVariant: "success", description: "Subscription cancellation request — retention offer accepted", timeAgo: "3d ago", duration: "10m 52s" },
  { statusLabel: "Resolved", statusVariant: "success", description: "Shipping delay follow-up — updated delivery window provided", timeAgo: "4d ago", duration: "4m 27s" },
];

const EXTENDED_CONTACT_HISTORY: ContactHistoryEntry[] = EXTENDED_CONTACT_HISTORY_CUSTOMER_INDEXES.map((customerIndex, i) => {
  const customer = CREATE_NEW_CUSTOMERS[customerIndex];
  const channelType = contactHistoryChannelType(customer.channels);
  return {
    id: `ch-ext-${customer.id}`,
    name: customer.name,
    // `customer.customerId` is already "CST-…"-prefixed — use it as-is
    // rather than re-prefixing into "CST-CST-…".
    caseId: customer.customerId,
    channelType,
    channelLabel: CONTACT_HISTORY_CHANNEL_LABEL[channelType],
    redial: channelType === "voice",
    ...EXTENDED_CONTACT_HISTORY_TEMPLATES[i],
  };
});

const CONTACT_HISTORY_BY_RANGE: Record<DateFilterValue, ContactHistoryEntry[]> = {
  today: [],
  yesterday: CONTACT_HISTORY,
  last7: [...CONTACT_HISTORY, ...EXTENDED_CONTACT_HISTORY],
  custom: [],
};

function ContactHistoryCard({ onRedial }: { onRedial?: (entry: ContactHistoryEntry) => void }) {
  const [dateFilter, setDateFilter] = useState<DateFilterValue>("today");
  const entries = CONTACT_HISTORY_BY_RANGE[dateFilter];

  return (
    <DashboardCard
      variant="neutral-subtle"
      headerTitle="Contact History"
      headerActions={<DateFilterChip onValueChange={setDateFilter} />}
    >
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
          <Inbox className="h-6 w-6 text-lyra-fg-secondary" strokeWidth={1.5} aria-hidden="true" />
          <span className="lyra-body-md text-lyra-fg-secondary">Nothing to Display</span>
        </div>
      ) : (
        <div className="flex flex-col">
          {entries.map((entry, i) => {
            const ChannelIcon = CONTACT_HISTORY_CHANNEL_ICON[entry.channelType];
            return (
              <div
                key={entry.id}
                className={cn(
                  "flex items-start justify-between gap-4 px-4 py-4",
                  i > 0 && "border-t border-lyra-border-subtle"
                )}
              >
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="lyra-body-md-emphasis text-lyra-fg-default">{entry.name}</span>
                    <Tag label={entry.statusLabel} variant={entry.statusVariant} />
                    {entry.redial && (
                      <Button variant="outline" size="sm" onClick={() => onRedial?.(entry)}>
                        <PhoneOutgoing className="h-3.5 w-3.5" strokeWidth={1.5} />
                        Redial
                      </Button>
                    )}
                  </div>
                  <span className="lyra-body-md text-lyra-fg-secondary">{entry.description}</span>
                  <span className="lyra-body-sm text-lyra-fg-secondary">{entry.caseId}</span>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="inline-flex items-center gap-1.5 lyra-body-sm text-lyra-fg-secondary whitespace-nowrap">
                    <ChannelIcon className="h-4 w-4" strokeWidth={1.5} />
                    {entry.channelLabel} · {entry.timeAgo}
                  </span>
                  <span className="lyra-body-md-emphasis tabular-nums text-lyra-fg-default whitespace-nowrap">{entry.duration}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
}

/* ── Interaction history table (sortable) — content of each Latest Interactions accordion item ── */

type InteractionSortKey = "owner" | "priority" | "createDate" | "status" | "channel" | "resolutionTime" | "skill";

function nextInteractionSortDirection(current: SortDirection): SortDirection {
  if (current === null) return "asc";
  if (current === "asc") return "desc";
  return null;
}

/* Per-row "more options" kebab — opens a Menu with a single contextual
   action: voice interactions offer "Redial", everything else offers "Reopen". */
function InteractionRowActions({ interaction }: { interaction: ContactInteraction }) {
  const [open, setOpen] = useState(false);
  const isVoice = interaction.type === "voice";
  const isAssignedToMe = interaction.owner === CURRENT_AGENT_NAME;

  const items: MenuEntry[] = [];
  items.push(
    isVoice
      ? { id: "redial", label: "Redial", icon: <PhoneOutgoing className="h-4 w-4" strokeWidth={1.5} />, onClick: () => setOpen(false) }
      : {
          id: interaction.status === "open" ? "open-interaction" : "reopen",
          label: interaction.status === "open" ? "Open Interaction" : "Reopen",
          icon: <RotateCcw className="h-4 w-4" strokeWidth={1.5} />,
          onClick: () => setOpen(false),
        }
  );
  if (!isAssignedToMe) {
    items.push({
      id: "assign-to-me",
      label: "Assign To Me",
      icon: <UserPlus className="h-4 w-4" strokeWidth={1.5} />,
      onClick: () => setOpen(false),
    });
  }
  items.push("separator");
  items.push({
    id: "customer-info",
    label: "Customer Information",
    icon: <UserRound className="h-4 w-4" strokeWidth={1.5} />,
    onClick: () => setOpen(false),
  });

  return (
    <Popover open={open} onOpenChange={setOpen} placement="bottom" content={<Menu items={items} />}>
      <button
        type="button"
        aria-label="More options"
        className="flex h-7 w-7 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary hover:bg-lyra-bg-surface-shell transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2"
      >
        <MoreVertical className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
      </button>
    </Popover>
  );
}

function InteractionsTable({ interactions }: { interactions: ContactInteraction[] }) {
  const [sortKey, setSortKey] = useState<InteractionSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  const handleSort = (key: InteractionSortKey) => {
    if (sortKey === key) {
      const next = nextInteractionSortDirection(sortDir);
      setSortDir(next);
      if (next === null) setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const dirFor = (key: InteractionSortKey): SortDirection => (sortKey === key ? sortDir : null);

  const sorted = [...interactions].sort((a, b) => {
    if (!sortKey || !sortDir) return 0;
    const aVal = String(a[sortKey]).toLowerCase();
    const bVal = String(b[sortKey]).toLowerCase();
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[48px] shrink-0"><span className="sr-only">Type</span></TableHead>
          <SortableTableHead className="flex-[1.4]" sortDirection={dirFor("owner")} onSort={() => handleSort("owner")}>Owner Assignee</SortableTableHead>
          <SortableTableHead className="flex-[0.7]" sortDirection={dirFor("priority")} onSort={() => handleSort("priority")}>Priority</SortableTableHead>
          <SortableTableHead className="flex-1" sortDirection={dirFor("createDate")} onSort={() => handleSort("createDate")}>Create Date</SortableTableHead>
          <SortableTableHead className="flex-1" sortDirection={dirFor("status")} onSort={() => handleSort("status")}>Status</SortableTableHead>
          <SortableTableHead className="flex-[1.2]" sortDirection={dirFor("channel")} onSort={() => handleSort("channel")}>Channel</SortableTableHead>
          <SortableTableHead className="flex-1" sortDirection={dirFor("resolutionTime")} onSort={() => handleSort("resolutionTime")}>Resolution Time</SortableTableHead>
          <SortableTableHead className="flex-1" sortDirection={dirFor("skill")} onSort={() => handleSort("skill")}>Skill</SortableTableHead>
          <TableHead className="w-[48px] shrink-0"><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((interaction) => (
          <TableRow key={interaction.id}>
            <TableCell className="w-[48px] shrink-0">
              <span className="relative inline-flex h-4 w-4 items-center justify-center text-lyra-fg-secondary">
                {interaction.type === "email" ? (
                  <Mail className="h-4 w-4" strokeWidth={1.5} />
                ) : interaction.type === "voice" ? (
                  <Phone className="h-4 w-4" strokeWidth={1.5} />
                ) : (
                  <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                )}
                {interaction.direction === "inbound" ? (
                  <ArrowDown className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full bg-lyra-bg-surface-base p-[1px]" strokeWidth={2} />
                ) : (
                  <ArrowUp className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full bg-lyra-bg-surface-base p-[1px]" strokeWidth={2} />
                )}
              </span>
            </TableCell>
            <TableCell className="flex-[1.4]">{interaction.owner}</TableCell>
            <TableCell className="flex-[0.7]">{interaction.priority}</TableCell>
            <TableCell className="flex-1">{interaction.createDate}</TableCell>
            <TableCell className="flex-1">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    interaction.status === "open" ? "bg-lyra-status-success-strong" : "bg-lyra-status-critical-strong"
                  )}
                  aria-hidden="true"
                />
                {interaction.status === "open" ? "Open" : "Closed"}
              </span>
            </TableCell>
            <TableCell className="flex-[1.2]">{interaction.channel}</TableCell>
            <TableCell className="flex-1">{interaction.resolutionTime}</TableCell>
            <TableCell className="flex-1">{interaction.skill || "—"}</TableCell>
            <TableCell className="w-[48px] shrink-0">
              <InteractionRowActions interaction={interaction} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/* ── AgentNextGenPage ── */

type Page = "agent-workspace" | "agent" | "outbound" | "login";

const AI_PANEL_DEFAULT_WIDTH = 360;

// Screen Pop — external apps an agent can pop the current contact/record
// into. Dummy list; wiring an actual screen-pop integration per app is out
// of scope for now.
const SCREEN_POP_APPS: SelectOption[] = [
  { value: "salesforce", label: "Salesforce" },
  { value: "zendesk",    label: "Zendesk" },
  { value: "servicenow", label: "ServiceNow" },
  { value: "hubspot",    label: "HubSpot" },
  { value: "freshdesk",  label: "Freshdesk" },
];

export function AgentNextGenPage({
  showPageHeader = false,
  showPanelToggle = false,
  showInteriorPanel = true,
  onNavigate,
  initialInteraction,
  sidePanelToggleLabel,
}: {
  showPageHeader?: boolean;
  showPanelToggle?: boolean;
  showInteriorPanel?: boolean;
  onNavigate?: (page: Page) => void;
  /**
   * Seeds `interactions`/`activeInteractionId` with an already-active call
   * instead of starting empty — mirrors lyra-ui's `AgentNextGenTemplate`
   * "Active Interaction" story prop of the same name (see that story's own
   * doc comment for the full rationale). Not passed anywhere in this app
   * today — kept as an opt-in capability so this component stays in sync
   * with the canonical template's shape, not to change default behavior.
   */
  initialInteraction?: ActiveInteraction;
  /**
   * Overrides the record-header `PanelPinButton`'s tooltip (both pinned and
   * unpinned label, since "Toggle Overview" describes the action generically
   * rather than a pin/unpin pair) — mirrors lyra-ui's `AgentNextGenTemplate`
   * prop of the same name. Defaults to "Toggle Overview" here too, matching
   * that template's current copy; pass a different string to override it.
   */
  sidePanelToggleLabel?: string;
}) {
  const [navOpen, setNavOpen] = useState(!!initialInteraction);
  // No interactions exist until the agent launches one from the CreateNew
  // menu (Start Interaction / quick dial) — see handleStartCall/handleQuick
  // Dial below. Click any resulting InteractionNavItem card to make it the
  // active one. `initialInteraction` (see above) seeds this instead, for
  // callers that want to start already mid-call.
  const [interactions, setInteractions] = useState<ActiveInteraction[]>(
    () => (initialInteraction ? [initialInteraction] : [])
  );
  const [activeInteractionId, setActiveInteractionId] = useState<string | null>(
    () => initialInteraction?.id ?? null
  );
  // Drives the main content area: whenever an interaction is active, the
  // Desk dashboard is replaced by that interaction's blank detail page (see
  // the PageHeader "record header" mode below) — starting/quick-dialing/
  // redialing a new assignment always sets this, so the screen switches
  // over automatically the moment one is added.
  const activeInteraction = interactions.find((i) => i.id === activeInteractionId) ?? null;
  // Shared clock powering every open channel's live "MM:SS since it
  // started" elapsed display — independent of `elapsedSeconds` below, which
  // is the agent's own status timer and resets on status change.
  const [clockTick, setClockTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setClockTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const [activeDeskTab, setActiveDeskTab] = useState<"home" | "customers" | "accounts" | "tickets" | "interactions" | "wem">("home");
  /* Settings — a third top-level view alongside Desk/interaction-record,
     shown in place of both in the content column when the Settings rail
     item is clicked. Mutually exclusive with an active interaction: opening
     one closes the other. Interaction → Settings is enforced below via an
     effect (selecting/starting any interaction always takes over the
     content column, same "one primary view at a time" rule Desk already
     follows per `buildNavItems`'s `active: !hasActiveInteraction`); Settings
     → interaction is enforced the other way, directly in the `LeftNav`
     `onSettingsClick` handler, since there's only that one call site
     (unlike `setActiveInteractionId`, which has several). */
  const [showSettings, setShowSettings] = useState(false);

  // Effect rather than touching every `setActiveInteractionId` call site
  // individually.
  useEffect(() => {
    if (activeInteractionId) setShowSettings(false);
  }, [activeInteractionId]);
  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>("unavailable");
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [appMenuOpen, setAppMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => document.documentElement.getAttribute("data-theme") === "dark"
  );

  const handleDarkModeToggle = () => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
      return next;
    });
  };

  const appMenuGroups = buildAppMenuGroups((page) => {
    setAppMenuOpen(false);
    onNavigate?.(page);
  });

  /* Panel animation state machine — see AgentNextGenTemplate.stories.tsx for full comment */
  type PanelState = "closed" | "open" | "closing";

  /* AI panel state */
  const [aiPanelOpen,  setAiPanelOpen]  = useState(false);
  const [aiMounted,    setAiMounted]    = useState(false);
  const [aiState,      setAiState]      = useState<PanelState>("closed");
  // Defaults to "float" (a transient, portal-positioned panel anchored
  // under the trigger button — same pattern as `notifVariant` below and
  // the same behavior lyra-ui's own `AppHeader.stories.tsx`/
  // `AgentNextGenTemplate.stories.tsx` demonstrate for this exact button:
  // `ReactDOM.createPortal` + `getBoundingClientRect()`-derived fixed
  // position, not a layout-pushing docked panel). This had drifted to
  // `"docked"` — opening the full docked side panel immediately on first
  // click instead of the floating popover-style panel lyra-ui shows —
  // caught by the user comparing behavior directly. "docked" is still
  // reachable afterward (dragging the panel to the edge, same as
  // Notifications), just no longer the default on first open.
  const [aiVariant,    setAiVariant]    = useState<DraggableVariant>("float");
  const [aiWidth,      setAiWidth]      = useState(AI_PANEL_DEFAULT_WIDTH);
  const [aiHeight,     setAiHeight]     = useState(860);
  const [aiIsResizing, setAiIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const aiFloatLeft  = useRef<number | null>(null);
  const aiFloatTop   = useRef<number | null>(null);
  const aiPanelRef   = useRef<HTMLDivElement>(null);
  const aiAnimTimer  = useRef<ReturnType<typeof setTimeout>>();

  /* Notifications panel state */
  const [notifOpen,       setNotifOpen]       = useState(false);
  const [notifMounted,    setNotifMounted]    = useState(false);
  const [notifState,      setNotifState]      = useState<PanelState>("closed");
  const [notifVariant,    setNotifVariant]    = useState<DraggableVariant>("float");
  const [notifWidth,      setNotifWidth]      = useState(360);
  const [notifHeight,     setNotifHeight]     = useState(860);
  const [notifIsResizing, setNotifIsResizing] = useState(false);
  const notifFloatLeft = useRef<number | null>(null);
  const notifFloatTop  = useRef<number | null>(null);
  const notifPanelRef  = useRef<HTMLDivElement>(null);
  const notifAnimTimer = useRef<ReturnType<typeof setTimeout>>();

  /* Conversations panel state — blank `DraggablePanel` (lyra-ui), same
     open/mounted/state/variant/size/position shape as AI and Notifications
     above (see the shared `dockPanelExclusively`/`getFloatStyle` helpers
     below, which generalize the single-dock rule across all four panels
     instead of hand-duplicating pairwise checks a third and fourth time). */
  const [convOpen,       setConvOpen]       = useState(false);
  const [convMounted,    setConvMounted]    = useState(false);
  const [convState,      setConvState]      = useState<PanelState>("closed");
  const [convVariant,    setConvVariant]    = useState<DraggableVariant>("float");
  const [convWidth,      setConvWidth]      = useState(360);
  const [convHeight,     setConvHeight]     = useState(860);
  const [convIsResizing, setConvIsResizing] = useState(false);
  const convFloatLeft = useRef<number | null>(null);
  const convFloatTop  = useRef<number | null>(null);
  const convPanelRef  = useRef<HTMLDivElement>(null);
  const convAnimTimer = useRef<ReturnType<typeof setTimeout>>();

  /* Schedule panel state — same shape as Conversations above */
  const [schedOpen,       setSchedOpen]       = useState(false);
  const [schedMounted,    setSchedMounted]    = useState(false);
  const [schedState,      setSchedState]      = useState<PanelState>("closed");
  const [schedVariant,    setSchedVariant]    = useState<DraggableVariant>("float");
  const [schedWidth,      setSchedWidth]      = useState(360);
  const [schedHeight,     setSchedHeight]     = useState(860);
  const [schedIsResizing, setSchedIsResizing] = useState(false);
  const schedFloatLeft = useRef<number | null>(null);
  const schedFloatTop  = useRef<number | null>(null);
  const schedPanelRef  = useRef<HTMLDivElement>(null);
  const schedAnimTimer = useRef<ReturnType<typeof setTimeout>>();

  /* Screen Pop panel state — same shape as Conversations/Schedule above */
  const [popOpen,       setPopOpen]       = useState(false);
  const [popMounted,    setPopMounted]    = useState(false);
  const [popState,      setPopState]      = useState<PanelState>("closed");
  const [popVariant,    setPopVariant]    = useState<DraggableVariant>("float");
  const [popWidth,      setPopWidth]      = useState(360);
  const [popHeight,     setPopHeight]     = useState(860);
  const [popIsResizing, setPopIsResizing] = useState(false);
  const popFloatLeft = useRef<number | null>(null);
  const popFloatTop  = useRef<number | null>(null);
  const popPanelRef  = useRef<HTMLDivElement>(null);
  const popAnimTimer = useRef<ReturnType<typeof setTimeout>>();
  const [screenPopApp, setScreenPopApp] = useState("");

  /* z-index "bring to front" ordering, shared by all five draggable panels */
  const [topPanel, setTopPanel] = useState<"ai" | "notif" | "conversations" | "schedule" | "screenpop" | null>(null);

  /* Interior panel (right) */
  const [interiorPanelOpen, setInteriorPanelOpen] = useState(false);
  /* Which home-tab queue widget (if any) is selected — reuses the same
     interior panel slot as Case Details, swapping its content instead of
     stacking a second right-docked panel. */
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);

  /* ── Live queue simulation ──
     The home tab's queue widgets should look "live" — wait time ticks up
     like a real clock, and Contacts fluctuates a bit over time — without
     reintroducing the old `randomContactsCount()` bug (an independently-
     randomized number that could disagree with the side panel's own
     breakdown, see the comment on `sumInQueue` above). So the *only* thing
     that gets randomized here is `queueSubItems` itself — the same list
     the side panel renders and `sumInQueue` totals for the Contacts metric
     — every few seconds one random sub-item's `inQueueCount` nudges by
     -1/0/+1 (clamped to [0, 20]). Both the widget's Contacts number and the
     side panel's "In Queue" figures re-derive from this one state update,
     so they can't drift apart. Wait time uses the shared `clockTick`
     (declared above) instead of its own timer — same "count seconds since
     mount" convention `formatElapsedTime`'s callers already use — added to
     each queue's `QUEUE_WAIT_BASE_SECONDS` baseline every render. */
  const [queueSubItems, setQueueSubItems] = useState<Record<string, QueueSubItem[]>>(INITIAL_QUEUE_SUB_ITEMS);
  useEffect(() => {
    const id = setInterval(() => {
      setQueueSubItems((prev) => {
        const queueIds = Object.keys(prev);
        const queueId = queueIds[Math.floor(Math.random() * queueIds.length)];
        const items = prev[queueId];
        const itemIndex = Math.floor(Math.random() * items.length);
        const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        const nextCount = Math.max(0, Math.min(20, items[itemIndex].inQueueCount + delta));
        if (nextCount === items[itemIndex].inQueueCount) return prev;
        return {
          ...prev,
          [queueId]: items.map((item, i) => (i === itemIndex ? { ...item, inQueueCount: nextCount } : item)),
        };
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  /* Home tab's queue widget row — `LATEST_CONTACTS_STATIC`'s fixed fields
     merged with the live `contactsCount`/`skillsCount` (derived from
     `queueSubItems`) and `wait` (derived from `clockTick`) every time
     either changes. Wait is pinned to zero once a queue actually empties
     (matches the reference screenshot's own Inbound Voice row: 0 contacts,
     00:00:00 wait) rather than ticking up forever regardless of whether
     anyone's still waiting. */
  const latestContacts = useMemo<LatestContact[]>(() => {
    return LATEST_CONTACTS_STATIC.map((base) => {
      const contactsCount = sumInQueue(queueSubItems[base.id]);
      return {
        ...base,
        contactsCount,
        skillsCount: queueSubItems[base.id].length,
        agentsCount: AGENTS_COUNT_BY_QUEUE[base.id],
        wait: contactsCount > 0 ? formatWaitTime(QUEUE_WAIT_BASE_SECONDS[base.id] + clockTick) : formatWaitTime(0),
      };
    });
  }, [queueSubItems, clockTick]);

  /* Side panel */
  const [sidePanelOpen,      setSidePanelOpen]      = useState(false);
  const [sidePanelPinned,    setSidePanelPinned]    = useState(false);
  const [sidePanelResizing,  setSidePanelResizing]  = useState(false);
  const [sidePanelWidth,     setSidePanelWidth]     = useState(256);
  const [containerWidth,     setContainerWidth]     = useState(9999);
  const sidePanelTimer = useRef<ReturnType<typeof setTimeout>>();

  // Track container width to force unpinned below 768px
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isNarrowContainer = containerWidth < 768;
  // When narrow: force overlay mode and hide pin button
  const effectivePinned = isNarrowContainer ? false : sidePanelPinned;

  // Close (and fully unpin) the Designer panel the moment the container
  // drops below 768px — same "reset state on narrow, don't just hide it
  // visually" pattern as the nav/docked-panel effects below. Without this,
  // a panel left open+pinned at a wide width stayed open (just re-skinned
  // as an overlay by `effectivePinned` above) the instant the container
  // narrowed, instead of actually closing.
  useEffect(() => {
    if (isNarrowContainer) {
      setSidePanelOpen(false);
      setSidePanelPinned(false);
    }
  }, [isNarrowContainer]);

  // The Designer panel belongs to the interaction it was opened from — its
  // only trigger is the record icon on the interaction `PageHeader`, which
  // doesn't exist on the Desk dashboard at all. Leaving the interaction
  // (dismissing it, or navigating to Desk/another tab) must close it the
  // same way narrowing the container does above; otherwise a panel pinned
  // open on one customer stays pinned open after switching to a page that
  // has no icon to close it with. Keyed on the id (a stable primitive)
  // rather than the `activeInteraction` object itself.
  useEffect(() => {
    if (!activeInteractionId) {
      setSidePanelOpen(false);
      setSidePanelPinned(false);
    }
  }, [activeInteractionId]);

  // Track window width for nav overlay breakpoint
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isNavNarrow = windowWidth < 1280;
  const isCompactHeader = windowWidth < 760;

  // Auto-collapse the expanded nav when viewport drops below 1280px
  useEffect(() => {
    if (isNavNarrow && navOpen) setNavOpen(false);
  }, [isNavNarrow]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close and undock any docked panels when viewport drops below 1280px
  useEffect(() => {
    if (isNavNarrow) {
      if (aiVariant === "docked") {
        setAiVariant("float");
        setAiPanelOpen(false);
      }
      if (notifVariant === "docked") {
        setNotifVariant("float");
        setNotifOpen(false);
      }
    }
  }, [isNavNarrow]); // eslint-disable-line react-hooks/exhaustive-deps

  // Both guarded on `sidePanelPinned` — matches `admin-shell.tsx`'s
  // `handleLeftHoverStart`/`handleLeftHoverEnd` (the canonical `SidePanel`
  // reference): hover previews the panel while *unpinned* only. Once
  // pinned, hover does nothing at all in either direction — open/closed is
  // controlled exclusively by the click toggle (`handleSidePanelIconToggle`)
  // while pinned, same as every other `SidePanel` consumer in this system.
  // `onSidePanelHoverStart` used to have no pinned guard at all, so hovering
  // the icon could silently reopen a pinned-but-closed panel — inconsistent
  // with the click-only contract above. (Still no `sidePanelHoverEnabled`
  // flag or other hidden gating beyond this one plain check — that flag was
  // removed earlier this session for leaving a stricter one-off "click to
  // reopen" state stuck after an icon-click unpin; this fix is orthogonal to
  // that and doesn't reintroduce it.)
  const onSidePanelHoverStart = () => {
    if (sidePanelPinned) return;
    clearTimeout(sidePanelTimer.current);
    setSidePanelOpen(true);
  };
  const onSidePanelHoverEnd = () => {
    if (sidePanelPinned) return;
    sidePanelTimer.current = setTimeout(() => setSidePanelOpen(false), 300);
  };
  const handleSidePanelPinToggle = () => {
    setSidePanelPinned((v) => !v);
    setSidePanelOpen(true);
  };
  /* Click on the interaction record icon (see the `icon` prop on that
     PageHeader below) — toggles open/closed only, and only while already
     pinned (matching admin-shell.tsx's handleLeftToggle/handleRightToggle:
     a no-op while unpinned, since that state is hover-driven instead).
     Deliberately does NOT touch `sidePanelPinned` — pinning/unpinning is
     `handleSidePanelPinToggle`'s job alone (the panel's own internal pin
     button). This used to also flip `sidePanelPinned` to match, which
     meant "closing" a pinned panel via this icon silently unpinned it too
     — so reopening it later (e.g. by hovering) came back unpinned instead
     of staying pinned like Panel.stories.tsx's "Side Panel" reference
     behavior requires. */
  const handleSidePanelIconToggle = () => {
    if (effectivePinned) setSidePanelOpen((v) => !v);
  };

  const MAX_PANEL_HEIGHT = 860;
  const BOTTOM_PADDING   = 8;

  const computePanelHeight = () => {
    if (!containerRef.current) return MAX_PANEL_HEIGHT;
    const top = containerRef.current.getBoundingClientRect().top;
    return Math.min(window.innerHeight - top - BOTTOM_PADDING, MAX_PANEL_HEIGHT);
  };

  /* Timer */
  useEffect(() => {
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(elapsedSeconds / 3600);
  const m = Math.floor((elapsedSeconds % 3600) / 60);
  const s = elapsedSeconds % 60;
  const formattedTimer = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  const handleStatusChange = (status: AgentStatus) => {
    setAgentStatus(status);
    setElapsedSeconds(0);
  };

  /* ── Launching interactions from CreateNew ──
     Overrides OUTBOUND_CONFIG's default onStartCall/onQuickDial (which just
     console.log) so this page actually surfaces what gets launched as
     InteractionNavItem cards in the left nav. Each handler below also
     expands the nav (`setNavOpen(true)`) — a collapsed rail would otherwise
     hide the card it just launched/updated from view entirely, so starting
     a call always surfaces it regardless of whether the nav happened to be
     collapsed at the time. */
  const handleStartCall = (selection: {
    contact: CreateNewOutboundContact;
    channel: ChannelType;
    phone: string;
    skillId: string;
  }) => {
    const skillLabel = OUTBOUND_CONFIG.skillOptions.find((o) => o.value === selection.skillId)?.label;
    // `phoneOptions` only has a value→label mapping for phone numbers (raw
    // digits → formatted display string) — email/WhatsApp addresses are
    // already human-readable as-is (see `create-new.tsx`'s
    // `defaultDetailValueFor`, where their `value` and `label` are the same
    // string), so falling back to `selection.phone` itself is correct there,
    // not a placeholder.
    const addressLabel = OUTBOUND_CONFIG.phoneOptions.find((o) => o.value === selection.phone)?.label ?? selection.phone;
    const newChannel: TrackedChannel = {
      id: `${selection.channel}:${selection.phone}`,
      type: selection.channel,
      startTick: clockTick,
      preview: skillLabel,
      value: selection.phone,
      addressLabel,
      // A freshly started outbound conversation hasn't exchanged any
      // messages yet — `0` (not omitted) so the tooltip actually reads "0
      // Messages" instead of showing nothing. Voice has no message concept
      // at all, so it's left `undefined` there — see
      // `ChannelTabProps.messageCount`'s own doc comment.
      messageCount: selection.channel === "voice" ? undefined : 0,
      interactionId: generateInteractionId(),
    };

    setInteractions((prev) => {
      const idx = prev.findIndex((i) => i.id === selection.contact.id);
      // No existing interaction with this contact — start a new card.
      if (idx === -1) {
        return [...prev, {
          id: selection.contact.id,
          customerName: selection.contact.name,
          // `subtitle` is the contact's real id (customerId/agentId/
          // TEAM-.../SKL-.../ASN-...) whenever CreateNew's record set one —
          // only missing for records that genuinely have none.
          recordId: selection.contact.subtitle ?? generateCaseId(),
          channels: [newChannel],
          currentChannelId: newChannel.id,
        }];
      }
      // Same contact already has an interaction open — restart the matching
      // channel's timer if this is the *same* type+address (e.g. redialing
      // the same SMS number), or add a new row alongside the existing ones
      // if it's a different address on the same type (e.g. a second SMS
      // thread on a different number) — those are genuinely separate
      // conversations, not a duplicate of the first, so they shouldn't
      // overwrite it.
      return prev.map((interaction, i) => {
        if (i !== idx) return interaction;
        const chIdx = interaction.channels.findIndex((c) => c.id === newChannel.id);
        const channels = chIdx === -1
          ? [...interaction.channels, newChannel]
          : interaction.channels.map((c, j) => (j === chIdx ? newChannel : c));
        // The channel just started/restarted always takes over as current —
        // mirrors InteractionNavItem's own auto-select-newest rule, now
        // mirrored up here too since this state is what drives both the
        // card (via currentChannelKey) and the new ChannelTab bar.
        return { ...interaction, channels, currentChannelId: newChannel.id };
      });
    });
    setActiveInteractionId(selection.contact.id);
    setNavOpen(true);
  };

  const handleQuickDial = (phoneNumber: string) => {
    // No contact record for a quick-dialed number — key the card off the
    // number itself so redialing the same number restarts its card rather
    // than stacking up duplicates.
    const id = `quickdial:${phoneNumber}`;
    // Voice has no message concept at all, so `messageCount` is left
    // undefined here (not `0`) — see `ChannelTabProps.messageCount`'s own
    // doc comment for why that's a deliberate omission, not an oversight.
    const newChannel: TrackedChannel = {
      id: "voice",
      type: "voice",
      startTick: clockTick,
      value: phoneNumber,
      addressLabel: phoneNumber,
      interactionId: generateInteractionId(),
    };
    setInteractions((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx === -1) return [...prev, { id, recordId: generateCaseId(), channels: [newChannel], currentChannelId: newChannel.id }];
      return prev.map((interaction, i) => (i === idx ? { ...interaction, channels: [newChannel], currentChannelId: newChannel.id } : interaction));
    });
    setActiveInteractionId(id);
    setNavOpen(true);
  };

  /* "Redial" from the home tab's Contact History card — same merge-by-id
     pattern as `handleQuickDial` (a fresh "voice" channel, keyed so redialing
     the same past contact again restarts their existing card instead of
     stacking a duplicate), but keyed off that contact-history entry's own id
     (namespaced "redial:" to stay distinct from quick-dial/outbound ids) and
     carrying the customer's real name, since — unlike a quick-dialed number —
     Contact History always has one on hand. Also expands the nav, same
     reasoning as handleStartCall/handleQuickDial above. */
  const handleRedial = (entry: ContactHistoryEntry) => {
    const id = `redial:${entry.id}`;
    // No stored phone number on ContactHistoryEntry — this channel's
    // ChannelTab just shows icon + "Voice" with no address, same as any
    // other channel with no addressLabel.
    const newChannel: TrackedChannel = {
      id: "voice",
      type: "voice",
      startTick: clockTick,
      interactionId: generateInteractionId(),
    };
    setInteractions((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx === -1) return [...prev, { id, customerName: entry.name, recordId: entry.caseId, channels: [newChannel], currentChannelId: newChannel.id }];
      return prev.map((interaction, i) => (i === idx ? { ...interaction, channels: [newChannel], currentChannelId: newChannel.id } : interaction));
    });
    setActiveInteractionId(id);
    setNavOpen(true);
  };

  /* "Unassign & Dismiss" — `InteractionNavItem` itself decides which of
     these two applies (based on how many channels the card has open when
     it's clicked), so these just need to implement each half:
     `onDismiss` (whole card, only called when just one channel was open —
     nothing would be left of the card otherwise) removes the interaction
     entirely, clearing `activeInteractionId` too if it was the active one so
     the side panel/content area doesn't keep pointing at a card that no
     longer exists. `onDismissChannel` (only called when more than one
     channel was open) drops just that one channel, leaving the rest of the
     card and its other channels open. The `ChannelTab` bar's own kebab wires
     to the same two handlers (see the `activeInteraction` block below), so
     dismissing from a tab behaves identically to dismissing from the card. */
  const handleDismissInteraction = (id: string) => {
    setInteractions((prev) => prev.filter((interaction) => interaction.id !== id));
    setActiveInteractionId((current) => (current === id ? null : current));
  };

  const handleDismissChannel = (id: string, channel: Pick<InteractionChannel, "id" | "type">) => {
    // Match on `id` (falling back to `type`, same as InteractionNavItem's
    // own `channelKey` convention) rather than `type` alone — two open
    // channels can share a `type` (e.g. two SMS threads on different
    // numbers), and filtering by `type` would drop *both* instead of just
    // the one the agent actually dismissed.
    const dismissedKey = channel.id ?? channel.type;
    setInteractions((prev) =>
      prev.map((interaction) => {
        if (interaction.id !== id) return interaction;
        const channels = interaction.channels.filter((c) => (c.id ?? c.type) !== dismissedKey);
        // Dismissing the currently-selected channel needs to hand "current"
        // to another remaining one (the new last channel, same fallback
        // InteractionNavItem itself uses) — otherwise the card/tab bar would
        // keep pointing at a channel that no longer exists.
        const currentChannelId = interaction.currentChannelId === dismissedKey
          ? channels[channels.length - 1]?.id
          : interaction.currentChannelId;
        return { ...interaction, channels, currentChannelId };
      })
    );
  };

  /** Fired by a card row's `onCurrentChannelChange` or a `ChannelTab`'s
   *  `onClick` — both point at this same setter so either one updates the
   *  other (see `ActiveInteraction.currentChannelId`'s own doc comment). */
  const handleChannelSelect = (interactionId: string, channelKey: string) => {
    setInteractions((prev) =>
      prev.map((interaction) =>
        interaction.id === interactionId ? { ...interaction, currentChannelId: channelKey } : interaction
      )
    );
  };

  /* ── Preventing duplicate channels from the CreateNew picker ──
     A contact already reachable via a currently-open channel (e.g. Jamie
     Torres has an SMS interaction open on a specific number) still shows
     that channel in "Select Channel" and every address in the detail
     screen's second field ("Select Phone"/"Select Email Address"/"Select
     WhatsApp Handle") — except whichever exact address(es) are already in
     use, which are disabled so starting another interaction on one of them
     wouldn't just duplicate the one already running (a different outbound
     line for the same channel — or a second, still-unused one, even when
     one SMS number is already open — stays selectable).
     `CreateNewOutboundContact.openChannelAddresses` is exactly the
     mechanism `CreateNew` exposes for this (see its own doc comment), so
     rather than adding new disabling logic to that shared component, this
     derives a per-render copy of OUTBOUND_CONFIG that tags each contact
     with every address in use for whichever channels they already have
     open in `interactions` (read off each `TrackedChannel.value`, set at
     start-call time — a contact can have more than one channel of the same
     type open at once, e.g. two SMS threads on different numbers, so this
     is a list per channel type, not a single address), across every group
     (Agents/Teams/Skills/Customers — Favorites is derived from these same
     records, so it inherits the tagging automatically). Recomputed
     whenever `interactions` changes so an address re-enables the moment its
     interaction is dismissed. */
  const outboundConfig = useMemo<CreateNewOutboundConfig>(() => {
    const openAddressesByContactId = new Map<string, Partial<Record<ChannelType, string[]>>>(
      interactions.map((interaction) => {
        const byType: Partial<Record<ChannelType, string[]>> = {};
        for (const c of interaction.channels) {
          if (!c.value) continue;
          (byType[c.type] ??= []).push(c.value);
        }
        return [interaction.id, byType];
      })
    );
    return {
      ...OUTBOUND_CONFIG,
      groups: OUTBOUND_CONFIG.groups.map((group) => {
        if (!group.contacts) return group;
        return {
          ...group,
          contacts: group.contacts.map((contact) => {
            const openChannelAddresses = openAddressesByContactId.get(contact.id);
            if (!openChannelAddresses || Object.keys(openChannelAddresses).length === 0) return contact;
            return { ...contact, openChannelAddresses };
          }),
        };
      }),
    };
  }, [interactions]);

  // Every "Agent Next Gen" consumer (this app, AgentNextGenTemplate.
  // stories.tsx, LeftNav.stories.tsx's "Agent Next Gen Left Nav" story)
  // wants the exact same "+" behavior on each InteractionNavItem card —
  // look up that interaction's underlying outbound contact, scope the
  // flyout to whatever channels it actually supports (falling back to the
  // full unfiltered list for quick-dialed/redialed numbers with no matching
  // contact record), and deep-link a picked channel into CreateNew's
  // `launchRequest`. That's `useOutboundAddButton` (lyra-ui) — a single
  // shared implementation instead of three hand-copied ones that could
  // (and did) quietly drift out of sync.
  const { launchRequest: outboundLaunchRequest, onLaunchRequestHandled, getHeaderAction } = useOutboundAddButton(outboundConfig);

  /* Welcome modal — shown once on page load; "Go Available" flips the agent
     to Available, "Start Unavailable" keeps them Unavailable (the default
     state). lyra-ui's `AgentStatus` dropped "offline" (just
     Available/Unavailable now), so this no longer keeps the agent
     "Offline" — Unavailable is the closest equivalent starting state. */
  const handleGoAvailable = () => {
    handleStatusChange("available");
    setShowWelcomeModal(false);
  };
  const handleStartUnavailable = () => {
    handleStatusChange("unavailable");
    setShowWelcomeModal(false);
  };

  /* Generic open/close state machine, shared by all five draggable panels
     (AI, Notifications, Conversations, Schedule, Screen Pop) — mounts on
     open, transitions through the shared fade/slide animation on close,
     then unmounts. */
  const usePanelOpenEffect = (
    open: boolean,
    setMounted: (v: boolean) => void,
    setState: (v: PanelState) => void,
    setHeight: (v: number) => void,
    setTop: (v: "ai" | "notif" | "conversations" | "schedule" | "screenpop" | null) => void,
    topKey: "ai" | "notif" | "conversations" | "schedule" | "screenpop",
    floatLeft: React.MutableRefObject<number | null>,
    width: number,
    animTimer: React.MutableRefObject<ReturnType<typeof setTimeout> | undefined>
  ) => {
    useEffect(() => {
      clearTimeout(animTimer.current);
      if (open) {
        if (containerRef.current && floatLeft.current === null) {
          const r = containerRef.current.getBoundingClientRect();
          floatLeft.current = r.left + containerRef.current.offsetWidth - width - 16;
        }
        setHeight(computePanelHeight());
        setMounted(true);
        setState("open");
        setTop(topKey);
      } else {
        setState("closing");
        animTimer.current = setTimeout(() => setState("closed"), 150);
      }
      return () => clearTimeout(animTimer.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Shrink panel height with viewport when open
    useEffect(() => {
      if (!open) return;
      const onResize = () => setHeight(computePanelHeight());
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);
  };

  usePanelOpenEffect(aiPanelOpen, setAiMounted, setAiState, setAiHeight, setTopPanel, "ai", aiFloatLeft, aiWidth, aiAnimTimer);
  usePanelOpenEffect(notifOpen,   setNotifMounted, setNotifState, setNotifHeight, setTopPanel, "notif", notifFloatLeft, notifWidth, notifAnimTimer);
  usePanelOpenEffect(convOpen,     setConvMounted, setConvState, setConvHeight, setTopPanel, "conversations", convFloatLeft, convWidth, convAnimTimer);
  usePanelOpenEffect(schedOpen,   setSchedMounted, setSchedState, setSchedHeight, setTopPanel, "schedule", schedFloatLeft, schedWidth, schedAnimTimer);
  usePanelOpenEffect(popOpen,     setPopMounted, setPopState, setPopHeight, setTopPanel, "screenpop", popFloatLeft, popWidth, popAnimTimer);

  /* Single-dock rule (documented in lyra-ui's draggable.tsx): only one
     panel may be docked at a time. Generalized across all five panels
     instead of the old pairwise "if AI is docked, force it to float"
     checks — each panel here would otherwise need four near-identical
     checks (one per sibling), which stops scaling the moment a third
     (or fifth) panel is added. `dockPanelExclusively` looks at every
     *other* panel and floats whichever one is currently docked. */
  const dockPanelExclusively = (dockingKey: "ai" | "notif" | "conversations" | "schedule" | "screenpop") => {
    const panels: Record<
      "ai" | "notif" | "conversations" | "schedule" | "screenpop",
      { variant: DraggableVariant; setVariant: (v: DraggableVariant) => void; width: number; floatLeft: React.MutableRefObject<number | null>; floatTop: React.MutableRefObject<number | null> }
    > = {
      ai:            { variant: aiVariant,    setVariant: setAiVariant,    width: aiWidth,    floatLeft: aiFloatLeft,    floatTop: aiFloatTop },
      notif:         { variant: notifVariant, setVariant: setNotifVariant, width: notifWidth, floatLeft: notifFloatLeft, floatTop: notifFloatTop },
      conversations: { variant: convVariant,  setVariant: setConvVariant,  width: convWidth,  floatLeft: convFloatLeft,  floatTop: convFloatTop },
      schedule:      { variant: schedVariant, setVariant: setSchedVariant, width: schedWidth, floatLeft: schedFloatLeft, floatTop: schedFloatTop },
      screenpop:     { variant: popVariant,   setVariant: setPopVariant,   width: popWidth,   floatLeft: popFloatLeft,   floatTop: popFloatTop },
    };
    (Object.keys(panels) as Array<keyof typeof panels>).forEach((key) => {
      if (key === dockingKey) return;
      const p = panels[key];
      if (p.variant === "docked" && containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        p.floatLeft.current = r.left + containerRef.current.offsetWidth - p.width - 16;
        p.floatTop.current  = null; // use computed default top
        p.setVariant("float");
      }
    });
  };

  // When docking: capture actual rendered position (includes CSS transform
  // drag offset) before the float wrapper unmounts — restored when undocking.
  const captureFloatPosition = (
    panelRef: React.RefObject<HTMLDivElement | null>,
    floatLeft: React.MutableRefObject<number | null>,
    floatTop: React.MutableRefObject<number | null>
  ) => {
    if (panelRef.current) {
      const r = panelRef.current.getBoundingClientRect();
      floatLeft.current = r.left;
      floatTop.current  = r.top;
    }
  };

  const handleAiVariantChange = (v: DraggableVariant) => {
    if (v === "docked") {
      captureFloatPosition(aiPanelRef, aiFloatLeft, aiFloatTop);
      dockPanelExclusively("ai");
    }
    setAiVariant(v);
  };
  const handleNotifVariantChange = (v: DraggableVariant) => {
    if (v === "docked") {
      captureFloatPosition(notifPanelRef, notifFloatLeft, notifFloatTop);
      dockPanelExclusively("notif");
    }
    setNotifVariant(v);
  };
  const handleConvVariantChange = (v: DraggableVariant) => {
    if (v === "docked") {
      captureFloatPosition(convPanelRef, convFloatLeft, convFloatTop);
      dockPanelExclusively("conversations");
    }
    setConvVariant(v);
  };
  const handleSchedVariantChange = (v: DraggableVariant) => {
    if (v === "docked") {
      captureFloatPosition(schedPanelRef, schedFloatLeft, schedFloatTop);
      dockPanelExclusively("schedule");
    }
    setSchedVariant(v);
  };
  const handlePopVariantChange = (v: DraggableVariant) => {
    if (v === "docked") {
      captureFloatPosition(popPanelRef, popFloatLeft, popFloatTop);
      dockPanelExclusively("screenpop");
    }
    setPopVariant(v);
  };

  // Float position — absolute viewport coordinates, same formula every
  // panel uses (anchored via its own `floatLeft`/`floatTop` refs once set).
  const getFloatStyle = (
    floatLeft: React.MutableRefObject<number | null>,
    floatTop: React.MutableRefObject<number | null>,
    width: number,
    key: "ai" | "notif" | "conversations" | "schedule" | "screenpop"
  ): React.CSSProperties => {
    const rect = containerRef.current?.getBoundingClientRect();
    const left = floatLeft.current !== null
      ? floatLeft.current
      : containerRef.current
        ? (rect?.left ?? 0) + containerRef.current.offsetWidth - width - 16
        : 0;
    const top = floatTop.current !== null
      ? floatTop.current
      : (rect?.top ?? 0);
    return {
      position: "fixed",
      top,
      left,
      zIndex: topPanel === key ? 10000 : 9999,
    };
  };
  const getAiFloatStyle    = () => getFloatStyle(aiFloatLeft, aiFloatTop, aiWidth, "ai");
  const getNotifFloatStyle = () => getFloatStyle(notifFloatLeft, notifFloatTop, notifWidth, "notif");
  const getConvFloatStyle   = () => getFloatStyle(convFloatLeft, convFloatTop, convWidth, "conversations");
  const getSchedFloatStyle = () => getFloatStyle(schedFloatLeft, schedFloatTop, schedWidth, "schedule");
  const getPopFloatStyle   = () => getFloatStyle(popFloatLeft, popFloatTop, popWidth, "screenpop");

  const notifPanel = notifMounted ? (
    <AgentNotifications
      ref={notifPanelRef}
      notifications={notifications}
      draggableVariant={notifVariant}
      onVariantChange={handleNotifVariantChange}
      onWidthChange={setNotifWidth}
      onResizeStateChange={setNotifIsResizing}
      onInteract={() => setTopPanel("notif")}
      onMarkAllRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
      onClearAll={() => setNotifications([])}
      onDismiss={(id: string) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
      onNotificationClick={(n: AgentNotification) =>
        setNotifications((prev) => prev.map((i) => i.id === n.id ? { ...i, read: true } : i))
      }
      onClose={() => setNotifOpen(false)}
      defaultWidth={notifWidth}
      height={notifHeight}
    />
  ) : null;

  const aiPanel = aiMounted ? (
    <AiPanel
      ref={aiPanelRef}
      draggable
      draggableVariant={aiVariant}
      defaultDraggableWidth={aiWidth}
      defaultDraggableHeight={aiHeight}
      onVariantChange={handleAiVariantChange}
      onWidthChange={setAiWidth}
      onResizeStateChange={setAiIsResizing}
      onInteract={() => setTopPanel("ai")}
      userName="John"
      suggestions={[
        { id: "1", label: "Summarise this contact's history" },
        { id: "2", label: "Suggest a response to the customer" },
        { id: "3", label: "What changed since yesterday?" },
      ]}
      onClose={() => setAiPanelOpen(false)}
      className={aiVariant === "docked" ? "h-full" : undefined}
    />
  ) : null;

  // Conversations/Schedule — blank `DraggablePanel` (lyra-ui), same shape as
  // AI/Notifications above but with no content of its own yet.
  const conversationsPanel = convMounted ? (
    <DraggablePanel
      ref={convPanelRef}
      title="Conversations"
      draggableVariant={convVariant}
      onVariantChange={handleConvVariantChange}
      defaultWidth={convWidth}
      height={convHeight}
      onWidthChange={setConvWidth}
      onResizeStateChange={setConvIsResizing}
      onInteract={() => setTopPanel("conversations")}
      onClose={() => setConvOpen(false)}
      className={convVariant === "docked" ? "h-full" : undefined}
    />
  ) : null;

  const schedulePanel = schedMounted ? (
    <DraggablePanel
      ref={schedPanelRef}
      title="Schedule"
      draggableVariant={schedVariant}
      onVariantChange={handleSchedVariantChange}
      defaultWidth={schedWidth}
      height={schedHeight}
      onWidthChange={setSchedWidth}
      onResizeStateChange={setSchedIsResizing}
      onInteract={() => setTopPanel("schedule")}
      onClose={() => setSchedOpen(false)}
      className={schedVariant === "docked" ? "h-full" : undefined}
    />
  ) : null;

  // Screen Pop — `DraggablePanel` (lyra-ui), same shape as
  // Conversations/Schedule above, with a Select to choose which external
  // app to pop the current contact/record into. The Select lives in
  // `headerContent` (fixed above the divider, alongside the title row)
  // rather than the scrollable body, so it stays put — no `label` since
  // the field sits in the header, not a body form, where a label would be
  // redundant.
  const screenPopPanel = popMounted ? (
    <DraggablePanel
      ref={popPanelRef}
      title="Screen Pop"
      draggableVariant={popVariant}
      onVariantChange={handlePopVariantChange}
      defaultWidth={popWidth}
      height={popHeight}
      onWidthChange={setPopWidth}
      onResizeStateChange={setPopIsResizing}
      onInteract={() => setTopPanel("screenpop")}
      onClose={() => setPopOpen(false)}
      className={popVariant === "docked" ? "h-full" : undefined}
      headerContent={
        <Select
          placeholder="Select an app..."
          options={SCREEN_POP_APPS}
          value={screenPopApp}
          onValueChange={setScreenPopApp}
        />
      }
    />
  ) : null;

  return (
    <div className="flex flex-col h-screen bg-lyra-bg-surface-shell overflow-hidden animate-in fade-in-0 duration-500">

      {/* ── App Header ── */}
      <AppHeader
        appName={
          <PopoverPrimitive.Root open={appMenuOpen} onOpenChange={setAppMenuOpen}>
            <PopoverPrimitive.Trigger asChild>
              <AppName
                icon={<img src={appIcon} alt="Agent Next Gen" className="h-6 w-6" />}
                name="Agent Next Gen"
                compact={isCompactHeader}
                aria-expanded={appMenuOpen}
              />
            </PopoverPrimitive.Trigger>
            <PopoverPrimitive.Portal>
              <PopoverPrimitive.Content
                side="bottom"
                align="start"
                sideOffset={6}
                onOpenAutoFocus={(e: Event) => e.preventDefault()}
                className="z-[9999] animate-in fade-in-0 slide-in-from-top-2 duration-150 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1 data-[state=closed]:duration-100"
              >
                <AppMenu
                  groups={appMenuGroups}
                  footer={<CXoneLogo />}
                  header={isCompactHeader ? "Agent Next Gen" : undefined}
                />
              </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
          </PopoverPrimitive.Root>
        }
        actions={
          <>
            {/* Screen Pop / Conversations / Schedule / Notifications / Ask AI
                — all five now go through lyra-ui's `ActionIconButton`
                (`size="xl"`, 44px), the single canonical AppHeader
                icon-button shape. These used to be hand-rolled
                `<button>`s (`h-10 w-10 rounded-lyra-lg`) matching
                `NotificationsBell`'s own trigger, which at the time was
                also hand-rolled rather than built on `ActionIconButton` —
                lyra-ui has since consolidated `NotificationsBell` and
                `ActionIconButton` onto one shared implementation (composing
                `Button` internally), with 44px/`rounded-lyra-sm` as the
                confirmed canonical AppHeader size, so this row now matches
                `Header.tsx`'s (and lyra-ui's own `AppHeader.stories.tsx`)
                icon buttons instead of diverging from them. Labeled
                "Conversations" (renamed from "Messages" — same
                trigger/panel, just the label). Screen Pop sits to the left
                of Conversations, using lucide's `MonitorUp` (monitor + up
                arrow) to match the requested icon exactly. */}
            <ActionIconButton
              size="xl"
              title="Screen Pop"
              aria-expanded={popOpen}
              onClick={() => setPopOpen((v) => !v)}
              className={popOpen ? "bg-lyra-state-hover" : undefined}
            >
              <MonitorUp className="h-5 w-5" strokeWidth={1.5} />
            </ActionIconButton>
            <ActionIconButton
              size="xl"
              title="Conversations"
              aria-expanded={convOpen}
              onClick={() => setConvOpen((v) => !v)}
              className={convOpen ? "bg-lyra-state-hover" : undefined}
            >
              <MessageSquare className="h-5 w-5" strokeWidth={1.5} />
            </ActionIconButton>
            <ActionIconButton
              size="xl"
              title="Schedule"
              aria-expanded={schedOpen}
              onClick={() => setSchedOpen((v) => !v)}
              className={schedOpen ? "bg-lyra-state-hover" : undefined}
            >
              <CalendarDays className="h-5 w-5" strokeWidth={1.5} />
            </ActionIconButton>
            <NotificationsBell
              notifications={notifications}
              open={notifOpen}
              onOpenChange={setNotifOpen}
              renderPanel={false}
            />
            {/* Sole "Ask AI" entry point — the PageHeader labeled button
                (Desk dashboard and the record-page header) was removed so
                this AppHeader icon is the only trigger for `aiPanelOpen`/
                `AiPanel` now. Renders lyra-ui's exported `AiSparkleIcon` —
                the same solid-color sparkle mark `AgentNextGenTemplate.
                stories.tsx` and `lyra-ux-templates`' `AgentNextGenPage.tsx`
                both use here — via `ActionIconButton` (44px, matching every
                other icon button in this row now). */}
            <ActionIconButton
              size="xl"
              title="Ask AI"
              aria-expanded={aiPanelOpen}
              onClick={() => setAiPanelOpen((v) => !v)}
              className={aiPanelOpen ? "bg-lyra-state-hover" : undefined}
            >
              <AiSparkleIcon />
            </ActionIconButton>
            {/* Separator between the icon-button row (Screen Pop through Ask
                AI) and AgentProfile — `orientation="vertical"` + `h-auto
                self-stretch` is the same sizing lyra-ui's own vertical
                Separator usage uses (see `dashboard-card.tsx`'s metric-row
                divider) so it stretches to match the row's height inside
                AppHeader's `flex items-center` actions container instead of
                a hand-picked fixed height. */}
            <Separator orientation="vertical" className="h-auto self-stretch" />
            <AgentProfile
              name="John Smith"
              initials="JS"
              status={agentStatus}
              onStatusChange={handleStatusChange}
              onDarkModeToggle={handleDarkModeToggle}
              isDarkMode={darkMode}
              timer={formattedTimer}
              // Standalone AppHeader "?" icon removed — this app now uses
              // `AgentProfile`'s own conditional "Help" row instead (renders
              // below "Agent Leg Disconnected" whenever `onHelpClick` is
              // passed; see agent-profile.tsx). Same destination/new-tab
              // behavior as the removed icon button.
              onHelpClick={() => window.open("https://help.nicecxone.com/content/agent/cxoneagent/cxoneagent.htm?cshid=CXoneAgent", "_blank", "noopener,noreferrer")}
              onLogOut={() => onNavigate?.("login")}
              className="ml-1"
            />
          </>
        }
      />

      {/* ── Body: LeftNav + Content ── */}
      {/* overflow-hidden ensures docked panels never push layout past the viewport */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        <LeftNav
          items={buildNavItems(
            Boolean(activeInteraction),
            () => { setActiveInteractionId(null); setShowSettings(false); },
            showSettings,
            () => { setShowSettings(true); setActiveInteractionId(null); }
          )}
          open={navOpen}
          onToggle={() => setNavOpen((v) => !v)}
          overlay={isNavNarrow}
          pinnedHeader={
            <CreateNew
              title="New Outbound"
              outbound={{
                ...outboundConfig,
                onStartCall: handleStartCall,
                onQuickDial: handleQuickDial,
                launchRequest: outboundLaunchRequest,
                onLaunchRequestHandled,
              }}
              expanded={navOpen}
            />
          }
          header={
            <>
              {/* No cards until the agent actually starts one above — each
                  card is one contact (or quick-dialed number), with every
                  channel they're being reached on folded into that same
                  card unless it's a different address on an already-open
                  type, which opens as its own row instead (see
                  handleStartCall's merge-by-type+address logic). */}
              {interactions.map((interaction) => {
                const mostRecentId = interaction.channels[interaction.channels.length - 1]?.id;
                const currentId = interaction.currentChannelId ?? mostRecentId;
                const channels: InteractionChannel[] = interaction.channels.map((c) => ({
                  id: c.id,
                  type: c.type,
                  elapsed: formatElapsedTime(clockTick - c.startTick),
                  preview: c.preview,
                  current: c.id === currentId,
                  // Read straight off the tracked channel (see
                  // TrackedChannel.awaitingResponse's own doc comment) —
                  // not derived from `type` — so a freshly-started outbound
                  // channel never renders red just for being SMS/chat/
                  // email/WhatsApp instead of voice.
                  awaitingResponse: c.awaitingResponse ?? false,
                }));
                const earliestStart = Math.min(...interaction.channels.map((c) => c.startTick));
                return (
                  <InteractionNavItem
                    key={interaction.id}
                    customerName={interaction.customerName}
                    active={activeInteractionId === interaction.id}
                    onClick={() => setActiveInteractionId(interaction.id)}
                    awaitingResponse={channels.some((c) => c.awaitingResponse)}
                    elapsed={formatElapsedTime(clockTick - earliestStart)}
                    expanded={navOpen}
                    channels={channels}
                    onDismiss={() => handleDismissInteraction(interaction.id)}
                    onDismissChannel={(channel) => handleDismissChannel(interaction.id, channel)}
                    headerAction={getHeaderAction(interaction.id)}
                    // Kept in sync with the ChannelTab bar under this
                    // interaction's record-header PageHeader — see
                    // ActiveInteraction.currentChannelId's own doc comment.
                    currentChannelKey={currentId}
                    onCurrentChannelChange={(key) => handleChannelSelect(interaction.id, key)}
                  />
                );
              })}
            </>
          }
        />

        {/* Content area — flex-1 shrinks to give space to docked panels.
            ref used to position float panels. */}
        <div ref={containerRef} className="relative flex flex-1 min-w-0 overflow-hidden pr-3 pb-3">

          {/* Main Container — flex row so pinned SidePanel sits left of PageHeader + content.
              relative so unpinned SidePanel can overlay the full surface. */}
          <Container className="flex flex-1 overflow-hidden relative">

            {/* Customer Information Panel — one instance whose `pinned` prop
                just flips SidePanel's own internal inline-vs-overlay branch, the
                same way SidePanel.stories.tsx's "Side Panel — Left/Right" stories
                toggle `pinned`/`open` on a single element. This used to be two
                separately-gated `<SidePanel>` elements (one per branch, below) —
                flipping `effectivePinned` unmounted one and mounted the
                other, so the very click meant to animate the panel open
                instead made it jump straight to its resting width (a fresh
                mount has no prior width to transition from). One element,
                prop-driven, animates correctly either way — matching the
                story. Gated on `activeInteraction`, not just
                `showPanelToggle` — its only trigger is the record icon on
                the interaction `PageHeader` below, which doesn't exist on
                the Desk dashboard. Without this it stayed mounted (and, if
                pinned, stayed open) after navigating away from the
                interaction that opened it, since nothing else about
                `showPanelToggle` varies by page. The `activeInteraction`-
                clearing effect above already closes/unpins it going into
                that transition, so unmounting here doesn't lose any
                pinned/open state that needed to persist.
                Was a bare `<SidePanel headerTitle="Designer" .../>` with no
                body content — swapped for `CustomerInformationPanel`
                (lyra-ui) which fixes the header to "Customer Information"
                and adds a "{name} · {id}" subhead for whoever this
                interaction is with, composed on top of the same `SidePanel`
                rather than reimplemented. */}
            {showPanelToggle && activeInteraction && (
              <CustomerInformationPanel
                side="left"
                open={sidePanelOpen}
                pinned={effectivePinned}
                person={{ name: activeInteraction.customerName ?? "Customer", id: activeInteraction.recordId }}
                onPinToggle={isNarrowContainer ? undefined : handleSidePanelPinToggle}
                width={sidePanelWidth}
                onWidthChange={setSidePanelWidth}
                onResizeStateChange={setSidePanelResizing}
                onMouseEnter={onSidePanelHoverStart}
                onMouseLeave={sidePanelResizing ? undefined : onSidePanelHoverEnd}
              />
            )}

            {/* Content column: PageHeader + page body */}
            <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
              {showSettings ? (
                // ── Settings — a blank page for now (real settings content
                // isn't built yet), same "just the header, blank body below"
                // placeholder pattern the interaction record view below
                // uses. Takes priority over both Desk and an active
                // interaction — see the `showSettings` state's own doc
                // comment for how the three views stay mutually exclusive.
                <>
                  {showPageHeader && <PageHeader title="Settings" />}
                  <div className="flex-1 overflow-y-auto" />
                </>
              ) : activeInteraction ? (
                // ── Active interaction's detail page — replaces the Desk
                // dashboard the moment a new assignment is started/quick-
                // dialed/redialed (see `activeInteraction` above). Just the
                // record header for now; the blank body below is where a
                // real case/contact detail view will go. Reverts back to
                // the dashboard automatically once the interaction is
                // dismissed (`activeInteractionId` clears).
                <>
                  {showPageHeader && (
                    <PageHeader
                      // Hovering this record icon reveals the Designer side
                      // panel (the unpinned-overlay `SidePanel` below, via the
                      // same `onSidePanelHoverStart`/`onSidePanelHoverEnd`
                      // pair that SidePanel's own onMouseEnter/onMouseLeave
                      // already use to stay open while the cursor moves from
                      // here onto it). Clicking it is a real on/off toggle —
                      // `handleSidePanelIconToggle` — pins it open on the
                      // first click, and unpins *and closes* it on the next
                      // (distinct from the panel's own internal pin button,
                      // `handleSidePanelPinToggle`, which always leaves it
                      // open). Scoped to this interaction PageHeader only —
                      // the Desk dashboard's PageHeader (no `icon` prop) is
                      // untouched, so this doesn't change anything there.
                      //
                      // The button itself is `PanelPinButton` — the exact
                      // same trigger `SidePanel`'s own internal pin button uses
                      // (Tooltip, focus ring, and the icon-rotates-45°-when-
                      // pinned animation), just with its `icon` swapped from
                      // `Pin` to `User` — composed, not re-implemented, per
                      // lyra-ui's "composition over reimplementation" rule.
                      // `iconAriaHidden={false}` because this slot is no
                      // longer decorative — PageHeader's default aria-hidden
                      // wrapper would otherwise hide a real, labeled button
                      // from assistive tech.
                      icon={
                        <span
                          onMouseEnter={onSidePanelHoverStart}
                          onMouseLeave={sidePanelResizing ? undefined : onSidePanelHoverEnd}
                        >
                          <PanelPinButton
                            pinned={sidePanelPinned}
                            onToggle={handleSidePanelIconToggle}
                            icon={<User className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />}
                            pinnedLabel={sidePanelToggleLabel ?? "Toggle Overview"}
                            unpinnedLabel={sidePanelToggleLabel ?? "Toggle Overview"}
                          />
                        </span>
                      }
                      iconAriaHidden={false}
                      title={activeInteraction.customerName ?? "Customer"}
                      subtitle={activeInteraction.recordId}
                    />
                  )}
                  {/* One tab per open channel — kept in sync with the same
                      interaction's InteractionNavItem card via
                      currentChannelId/handleChannelSelect (see that field's
                      own doc comment). Shown even with just one channel open
                      — the tab still surfaces that channel's kebab actions
                      (Unassign & Dismiss/Consult/Transfer/etc.), not just a
                      way to switch between multiple. */}
                  {showPageHeader && activeInteraction.channels.length > 0 && (
                    <TabList className="px-6 bg-lyra-bg-surface-base shrink-0 lyra-channel-tab-list-wrap">
                      {activeInteraction.channels.map((c) => {
                        const key = c.id ?? c.type;
                        return (
                          <ChannelTab
                            key={key}
                            type={c.type}
                            address={c.addressLabel}
                            messageCount={c.messageCount}
                            interactionId={c.interactionId}
                            active={(activeInteraction.currentChannelId ?? activeInteraction.channels[activeInteraction.channels.length - 1]?.id) === key}
                            onClick={() => handleChannelSelect(activeInteraction.id, key)}
                            onDismiss={() => {
                              if (activeInteraction.channels.length > 1) handleDismissChannel(activeInteraction.id, c);
                              else handleDismissInteraction(activeInteraction.id);
                            }}
                          />
                        );
                      })}
                    </TabList>
                  )}
                  <div className="flex-1 overflow-y-auto" />
                </>
              ) : (
                <>
                  {showPageHeader && (
                    <TabList overflowMenu className="px-6 bg-lyra-bg-surface-base shrink-0">
                      <Tab active={activeDeskTab === "home"} onClick={() => setActiveDeskTab("home")}>
                        Dashboard
                      </Tab>
                      <Tab active={activeDeskTab === "customers"} onClick={() => setActiveDeskTab("customers")}>
                        Customers
                      </Tab>
                      <Tab active={activeDeskTab === "accounts"} onClick={() => setActiveDeskTab("accounts")}>
                        Accounts
                      </Tab>
                      <Tab active={activeDeskTab === "tickets"} onClick={() => setActiveDeskTab("tickets")}>
                        Tickets
                      </Tab>
                      <Tab active={activeDeskTab === "interactions"} onClick={() => setActiveDeskTab("interactions")}>
                        Interactions
                      </Tab>
                      <Tab active={activeDeskTab === "wem"} onClick={() => setActiveDeskTab("wem")}>
                        WEM
                      </Tab>
                    </TabList>
                  )}
              {/* Body row: main content + interior panel */}
              <div className="relative flex flex-1 overflow-hidden">
                <div className="flex flex-1 flex-col min-w-0 overflow-y-auto px-6 py-6">
                  <div className="w-full max-w-[1200px] mx-auto lyra-container-grid-wrap">
                    {/* ── Greeting ── */}
                    <h1 className="lyra-heading-2xl text-lyra-fg-default">
                      Good {getGreetingPeriod()}, {CURRENT_AGENT_FIRST_NAME}
                    </h1>
                    <p className="mt-1 lyra-body-md text-lyra-fg-secondary">Below is your team's queue for the day:</p>

                    {/* ── Queue widgets ──
                        `DashboardQueue` ("cards" variant, its default) —
                        the numbers come straight from `latestContacts`
                        (see the "Live queue simulation" state above), so
                        they'd stay in sync with the accordion presentation
                        of the same data if that's ever turned back on (see
                        the note below) — and Contacts/Wait Time visibly
                        tick/fluctuate in real time rather than sitting
                        frozen at the same numbers forever. Clicking a
                        widget opens the interior panel with that queue's
                        sub-queue breakdown; the selected widget gets the
                        "info-strong" (blue) treatment `DashboardQueue`
                        applies on selection, driven by the controlled
                        `selectedId`/`onSelect` pair kept in sync with the
                        panel state. */}
                    <DashboardQueue
                      className="mt-6"
                      items={latestContacts.map((contact) => ({
                        id: contact.id,
                        name: contact.name,
                        icon: contact.icon,
                        wait: contact.wait,
                        skillsCount: contact.skillsCount,
                        contactsCount: contact.contactsCount,
                        agentsCount: contact.agentsCount,
                      }))}
                      selectedId={selectedQueueId}
                      onSelect={setSelectedQueueId}
                    />

                    {/* ── Latest Cases ──
                        Removed for now (was `DashboardQueue`'s "accordion"
                        variant, showing the same data as expandable rows
                        with each queue's `InteractionsTable` as content) —
                        may come back later, so `latestContacts`,
                        `InteractionsTable`, and the rest of the data/markup
                        it depended on are left in place rather than deleted. */}

                    <div className="mt-6">
                      <ContactHistoryCard onRedial={handleRedial} />
                    </div>

                    {/* ── Summary cards ──
                        Was three cards (Activity/Performance/Productivity);
                        Activity's ring chart moved into the bottom of
                        PerformanceBreakdownCard (Productivity) and the
                        standalone Activity card was removed, since the ring
                        visualized the exact same Available/Working/
                        Unavailable data Productivity's own rows already
                        list — one card showing it twice added nothing a
                        single card + ring didn't already cover. */}
                    <div className="mt-6 lyra-container-grid">
                      <PerformanceSummaryCard />
                      <PerformanceBreakdownCard />
                    </div>
                  </div>
                </div>
                {showInteriorPanel && (
                  <InteriorPanel
                    side="right"
                    // Reuses this one docked slot for two different jobs —
                    // the pre-existing "Case Details" form and the new
                    // queue drill-down — rather than stacking a second
                    // right-side panel, since only one detail view is ever
                    // relevant at a time. `selectedQueueId` set takes
                    // priority in both the open condition and the content
                    // switch below.
                    open={interiorPanelOpen || Boolean(selectedQueueId)}
                    headerTitle={
                      selectedQueueId
                        ? latestContacts.find((c) => c.id === selectedQueueId)?.name ?? "Queue"
                        : "Case Details"
                    }
                    // "{n} Skills" — the same count as the queue widget's own
                    // Skills metric (`skillsCount`, derived from this exact
                    // `queueSubItems[selectedQueueId]` list), just surfaced
                    // in the drill-down panel's own header this time.
                    headerSubhead={
                      selectedQueueId
                        ? `${(queueSubItems[selectedQueueId] ?? []).length} Skills`
                        : undefined
                    }
                    onClose={() => {
                      setInteriorPanelOpen(false);
                      setSelectedQueueId(null);
                    }}
                  >
                    {selectedQueueId ? (
                      <div className="flex flex-col">
                        {(queueSubItems[selectedQueueId] ?? []).map((item, i) => (
                          <div
                            key={item.id}
                            className={cn(
                              "flex flex-col gap-2 px-4 py-4",
                              i > 0 && "border-t border-lyra-border-subtle"
                            )}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="inline-flex items-center gap-2 lyra-body-md-emphasis text-lyra-fg-default">
                                <item.icon className="h-4 w-4 text-lyra-fg-secondary" strokeWidth={1.5} />
                                {item.label}
                              </span>
                              <span className="lyra-body-sm text-lyra-fg-secondary whitespace-nowrap">
                                {item.inQueueCount} In Queue
                              </span>
                            </div>
                            <span className="inline-flex items-center gap-1 lyra-body-sm text-lyra-fg-secondary">
                              <Clock className="h-3 w-3" strokeWidth={1.5} />
                              Longest Wait Time: {item.wait}
                            </span>
                            {/* Available / Working / Unavailable agent counts for
                                this sub-queue — same icons, colors, and order as
                                PRODUCTIVITY_STATUS_META (Activity/Productivity
                                cards), just rendered as compact circular Icon
                                badges instead of a donut/bar. Each badge gets a
                                hover tooltip spelling out what the count means,
                                since the color/icon alone doesn't say "agents". */}
                            <div className="flex items-center gap-3">
                              <Tooltip content="Available Agents" placement="top">
                                <span className="inline-flex items-center gap-1.5">
                                  <Icon icon={CheckCircle2} size="sm" background="success" shape="circle" decorative />
                                  <span className="lyra-body-sm-emphasis text-lyra-fg-default">{item.available}</span>
                                </span>
                              </Tooltip>
                              <Tooltip content="Working Agents" placement="top">
                                <span className="inline-flex items-center gap-1.5">
                                  <Icon icon={CircleDot} size="sm" background="warning" shape="circle" decorative />
                                  <span className="lyra-body-sm-emphasis text-lyra-fg-default">{item.working}</span>
                                </span>
                              </Tooltip>
                              <Tooltip content="Unavailable Agents" placement="top">
                                <span className="inline-flex items-center gap-1.5">
                                  <Icon icon={MinusCircle} size="sm" background="critical" shape="circle" decorative />
                                  <span className="lyra-body-sm-emphasis text-lyra-fg-default">{item.unavailable}</span>
                                </span>
                              </Tooltip>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 px-4 py-4">
                        <Input label="Subject" placeholder="Enter subject" />
                        <Input label="Priority" placeholder="Select priority" />
                        <Input label="Assignee" placeholder="Search agents" />
                        <Input label="Tags" placeholder="Add tags" />
                      </div>
                    )}
                  </InteriorPanel>
                )}
              </div>
                </>
              )}
            </div>

          </Container>

          {/* Notifications — float (CSS transitions, not keyframe animations — avoids compositor fill-mode flash) */}
          {notifVariant === "float" && notifMounted && (
            <div
              style={{
                ...getNotifFloatStyle(),
                pointerEvents: "none",
                visibility: notifState === "closed" ? "hidden" : "visible",
                opacity: notifState === "open" ? 1 : 0,
                transform: notifState === "open" ? "translateY(0)" : "translateY(-8px)",
                transition: notifState === "open"
                  ? "opacity 150ms ease, transform 150ms ease"
                  : "opacity 100ms ease, transform 100ms ease",
              }}
            >
              {notifPanel}
            </div>
          )}

          {/* AI Panel — float (same CSS transition pattern as Notifications) */}
          {aiVariant === "float" && aiMounted && (
            <div
              style={{
                ...getAiFloatStyle(),
                pointerEvents: "none",
                visibility: aiState === "closed" ? "hidden" : "visible",
                opacity: aiState === "open" ? 1 : 0,
                transform: aiState === "open" ? "translateY(0)" : "translateY(-8px)",
                transition: aiState === "open"
                  ? "opacity 150ms ease, transform 150ms ease"
                  : "opacity 100ms ease, transform 100ms ease",
              }}
            >
              {aiPanel}
            </div>
          )}

          {/* Conversations — float (same CSS transition pattern as Notifications/AI) */}
          {convVariant === "float" && convMounted && (
            <div
              style={{
                ...getConvFloatStyle(),
                pointerEvents: "none",
                visibility: convState === "closed" ? "hidden" : "visible",
                opacity: convState === "open" ? 1 : 0,
                transform: convState === "open" ? "translateY(0)" : "translateY(-8px)",
                transition: convState === "open"
                  ? "opacity 150ms ease, transform 150ms ease"
                  : "opacity 100ms ease, transform 100ms ease",
              }}
            >
              {conversationsPanel}
            </div>
          )}

          {/* Schedule — float (same CSS transition pattern as Notifications/AI) */}
          {schedVariant === "float" && schedMounted && (
            <div
              style={{
                ...getSchedFloatStyle(),
                pointerEvents: "none",
                visibility: schedState === "closed" ? "hidden" : "visible",
                opacity: schedState === "open" ? 1 : 0,
                transform: schedState === "open" ? "translateY(0)" : "translateY(-8px)",
                transition: schedState === "open"
                  ? "opacity 150ms ease, transform 150ms ease"
                  : "opacity 100ms ease, transform 100ms ease",
              }}
            >
              {schedulePanel}
            </div>
          )}

          {/* Screen Pop — float (same CSS transition pattern as Notifications/AI) */}
          {popVariant === "float" && popMounted && (
            <div
              style={{
                ...getPopFloatStyle(),
                pointerEvents: "none",
                visibility: popState === "closed" ? "hidden" : "visible",
                opacity: popState === "open" ? 1 : 0,
                transform: popState === "open" ? "translateY(0)" : "translateY(-8px)",
                transition: popState === "open"
                  ? "opacity 150ms ease, transform 150ms ease"
                  : "opacity 100ms ease, transform 100ms ease",
              }}
            >
              {screenPopPanel}
            </div>
          )}

        </div>

        {/* Notifications — docked (sibling of containerRef so flex layout keeps it in-bounds) */}
        {notifVariant === "docked" && (
          <div className="pb-3" style={{
            width: notifState === "open" ? notifWidth : 0,
            marginRight: notifState === "open" ? 12 : 0,
            overflow: "hidden",
            flexShrink: 0,
            transition: notifIsResizing ? "none" : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            <div
              className="h-full animate-in fade-in-0 duration-150"
              style={{
                width: notifWidth,
                display: notifState === "open" ? "block" : "none",
              }}
            >
              {notifPanel}
            </div>
          </div>
        )}

        {/* AI Panel — docked (sibling of containerRef so flex layout keeps it in-bounds) */}
        {aiVariant === "docked" && (
          <div className="pb-3" style={{
            width: aiState === "open" ? aiWidth : 0,
            marginRight: aiState === "open" ? 12 : 0,
            overflow: "hidden",
            flexShrink: 0,
            transition: aiIsResizing ? "none" : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            <div
              className="h-full animate-in fade-in-0 duration-150"
              style={{
                width: aiWidth,
                display: aiState === "open" ? "block" : "none",
              }}
            >
              {aiPanel}
            </div>
          </div>
        )}

        {/* Conversations — docked (sibling of containerRef so flex layout keeps it in-bounds) */}
        {convVariant === "docked" && (
          <div className="pb-3" style={{
            width: convState === "open" ? convWidth : 0,
            marginRight: convState === "open" ? 12 : 0,
            overflow: "hidden",
            flexShrink: 0,
            transition: convIsResizing ? "none" : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            <div
              className="h-full animate-in fade-in-0 duration-150"
              style={{
                width: convWidth,
                display: convState === "open" ? "block" : "none",
              }}
            >
              {conversationsPanel}
            </div>
          </div>
        )}

        {/* Schedule — docked (sibling of containerRef so flex layout keeps it in-bounds) */}
        {schedVariant === "docked" && (
          <div className="pb-3" style={{
            width: schedState === "open" ? schedWidth : 0,
            marginRight: schedState === "open" ? 12 : 0,
            overflow: "hidden",
            flexShrink: 0,
            transition: schedIsResizing ? "none" : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            <div
              className="h-full animate-in fade-in-0 duration-150"
              style={{
                width: schedWidth,
                display: schedState === "open" ? "block" : "none",
              }}
            >
              {schedulePanel}
            </div>
          </div>
        )}

        {/* Screen Pop — docked (sibling of containerRef so flex layout keeps it in-bounds) */}
        {popVariant === "docked" && (
          <div className="pb-3" style={{
            width: popState === "open" ? popWidth : 0,
            marginRight: popState === "open" ? 12 : 0,
            overflow: "hidden",
            flexShrink: 0,
            transition: popIsResizing ? "none" : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            <div
              className="h-full animate-in fade-in-0 duration-150"
              style={{
                width: popWidth,
                display: popState === "open" ? "block" : "none",
              }}
            >
              {screenPopPanel}
            </div>
          </div>
        )}

      </div>

      {/* ── Welcome modal — shown once on page load. Uses the real lyra-ui
          `Modal` component (variant="light": frosted blur backdrop,
          portal-rendered via Radix Dialog, focus-trapped) rather than a
          hand-rolled backdrop div, so it actually dims/blurs the dashboard
          behind it like a real overlay instead of just painting over it.
          Not dismissible via backdrop click or Escape — only the two
          buttons close it. Previously composed by hand as `Overlay` +
          `AgentWelcomeMessage` (which itself rendered its own
          `Container variant="modal"` shell) — `Modal` now owns that
          Radix Dialog wiring directly, so `AgentWelcomeMessage` is passed
          `bare` to skip its own card chrome and avoid nesting two.

          `Modal`'s "light" variant is a fixed `bg-white/70` by design (see
          Overlay.stories.tsx — "light" vs. "dark" are two deliberately
          static, theme-independent overlay looks, not meant to react to
          dark mode). This page's backdrop needs to actually match the
          current theme, so we override just the background color via
          `overlayClassName` (twMerge drops the variant's `bg-white/70` for
          this `bg-[color-mix(...)]`, keeping `backdrop-blur-sm`). We use
          color-mix() instead of a plain `bg-lyra-bg-surface-shell/70`
          opacity modifier because Tailwind can't generate opacity-modified
          utilities for our `var(--lyra-color-*)` tokens (same root cause as
          the Tag border-color bug — see lyra-ui's PROJECT_SUMMARY.md).

          The card itself is still the shared `AgentWelcomeMessage` lyra-ui
          component (icon/title/lastLogin block + info-box slot + Separator +
          two-button footer) — `ariaTitle` gives screen readers the real
          dialog name since that title now renders inside `AgentWelcomeMessage`
          itself rather than through `Modal`'s own `headerTitle`. ── */}
      <Modal
        variant="light"
        overlayClassName="bg-[color-mix(in_srgb,var(--lyra-color-bg-surface-shell)_75%,transparent)]"
        open={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        closeOnBackdropClick={false}
        ariaTitle={`Good morning, ${CURRENT_AGENT_FIRST_NAME} ${CURRENT_AGENT_LAST_NAME}`}
      >
        <AgentWelcomeMessage
          bare
          icon={<img src={appIcon} alt="" className="h-8 w-8 shrink-0" />}
          title={`Good morning, ${CURRENT_AGENT_FIRST_NAME} ${CURRENT_AGENT_LAST_NAME}`}
          lastLogin={WELCOME_MODAL_LAST_LOGIN}
          onPrimaryClick={handleGoAvailable}
          onSecondaryClick={handleStartUnavailable}
        >
          <p className="lyra-body-md text-lyra-fg-default">
            You are currently assigned to {AGENT_SKILLS_COUNT} skills. {TEAMMATES_ONLINE_COUNT} teammates are
            online, {TEAMMATES_AVAILABLE_COUNT} are available. Select an option below to begin.
          </p>
        </AgentWelcomeMessage>
      </Modal>
    </div>
  );
}
