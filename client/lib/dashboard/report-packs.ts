import type { LucideIcon } from 'lucide-react';
import {
  ClipboardCheck,
  Droplets,
  FileText,
  Landmark,
  Share2,
  ShieldCheck,
  Users,
} from 'lucide-react';

/** The four report/disclosure packs, shared by the Reports hub and pack pages. */
export type ReportPack = {
  slug: string;
  icon: LucideIcon;
  name: string;
  /** One-line description on the Reports hub card. */
  cardDesc: string;
  /** Page subtitle on the pack's own screen. */
  pageSubtitle: string;
  /** Locked empty-state body on the pack's own screen. */
  lockedBody: string;
};

export const REPORT_PACKS: ReportPack[] = [
  {
    slug: 'esg-intelligence',
    icon: FileText,
    name: 'ESG Intelligence report',
    cardDesc: 'A one-click ESG summary reusing existing sustainability data.',
    pageSubtitle:
      'Generate a structured report of your sustainability performance, data and supporting evidence, providing a clear view of your ESG profile and key assessment outcomes.',
    lockedBody:
      'Reports unlock once a Sustainability Expert has reviewed your evidence.',
  },
  {
    slug: 'disclosure',
    icon: Share2,
    name: 'Disclosure pack',
    cardDesc: 'Structured pack for customers, lenders and procurement teams.',
    pageSubtitle:
      'Generate a structured pack of your sustainability data and supporting evidence, organised to support disclosure and information-sharing requirements with relevant stakeholders.',
    lockedBody:
      'Disclosure pack unlocks once a Sustainability Expert has reviewed your evidence.',
  },
  {
    slug: 'audit-assurance',
    icon: ClipboardCheck,
    name: 'Audit & Assurance pack',
    cardDesc: "Evidence checklist showing what's ready and what's missing.",
    pageSubtitle:
      'Generate a structured pack of your sustainability data and supporting evidence, organised to support audit, assurance and external review activities.',
    lockedBody:
      'Audit readiness unlocks once a Sustainability Expert has reviewed your evidence.',
  },
  {
    slug: 'compliance-regulatory',
    icon: ShieldCheck,
    name: 'Compliance & Regulatory pack',
    cardDesc: 'SECR, PPN 06/21 and other UK framework snapshots.',
    pageSubtitle:
      'Generate a structured pack of your sustainability data and supporting evidence, mapped against relevant frameworks and regulatory requirements to support compliance and regulatory activities.',
    lockedBody:
      'Compliance readiness unlocks once an ESG Specialist has reviewed your evidence.',
  },
];

export const reportPackHref = (slug: string) => `/sme/reports/${slug}`;

/* --------------------------------------------------------------------------
 * Populated report content (post-review). Each metric row is labelled by how
 * its response is evidenced so recipients can weigh confidence.
 * ------------------------------------------------------------------------ */

export type EvidenceStatus =
  | 'self-declared'
  | 'evidence-backed'
  | 'verified'
  | 'missing';

export type ReportRow = {
  metric: string;
  response: string;
  /** Where the response came from (a filename, contract, or "Self-declared"). */
  source: string;
  status: EvidenceStatus;
};

export type ReportSection = {
  title: string;
  icon: LucideIcon;
  rows: ReportRow[];
};

/** Status-pill tone → resolved to bg/text classes in report-primitives.tsx. */
export type PillTone = 'success' | 'warning' | 'teal' | 'error' | 'errorSoft';
export type Pill = { label: string; tone: PillTone };

/**
 * Report body per pack slug. Only packs whose report has been built appear
 * here; the rest fall back to the locked/awaiting state.
 */
export const REPORT_CONTENT: Record<string, ReportSection[]> = {
  'esg-intelligence': [
    {
      title: 'Environmental',
      icon: Droplets,
      rows: [
        {
          metric: 'Do you track Scope 1 & 2 emissions?',
          response: 'Partially',
          source: 'Self-declared',
          status: 'self-declared',
        },
        {
          metric: 'Do you track energy usage?',
          response: 'Yes',
          source: 'Energy Usage Report.pdf',
          status: 'evidence-backed',
        },
        {
          metric: 'Renewable energy share',
          response: 'Yes',
          source: 'Supplier contract',
          status: 'verified',
        },
        {
          metric: 'Waste management policy?',
          response: 'In progress',
          source: 'Self-declared',
          status: 'self-declared',
        },
      ],
    },
    {
      title: 'Social',
      icon: Users,
      rows: [
        {
          metric: 'Employee training programme?',
          response: 'Yes',
          source: 'Self-declared',
          status: 'self-declared',
        },
        {
          metric: 'Health & Safety policy documented?',
          response: 'Yes',
          source: 'H&S Policy.pdf',
          status: 'evidence-backed',
        },
        {
          metric: 'Diversity policy?',
          response: 'Not provided',
          source: '—',
          status: 'missing',
        },
      ],
    },
    {
      title: 'Governance',
      icon: Landmark,
      rows: [
        {
          metric: 'Anti-bribery policy?',
          response: 'Yes',
          source: 'Self-declared',
          status: 'self-declared',
        },
        {
          metric: 'Data protection policy?',
          response: 'Yes',
          source: 'DP Policy v3.pdf',
          status: 'evidence-backed',
        },
        {
          metric: 'Risk register maintained?',
          response: 'Not provided',
          source: '—',
          status: 'missing',
        },
        {
          metric: 'ESG governance responsibility?',
          response: 'Assigned to Operations Director',
          source: 'Self-declared',
          status: 'self-declared',
        },
      ],
    },
  ],
};

/* ---- Disclosure pack: stat cards + warning banner + flat item table ---- */
export type DisclosureReport = {
  stats: { label: string; value: string }[];
  banner: { title: string; body: string };
  items: { item: string; status: Pill; source: string }[];
};

export const DISCLOSURE_REPORT: DisclosureReport = {
  stats: [
    { label: 'READY', value: '4' },
    { label: 'SELF-DECLARED', value: '2' },
    { label: 'MISSING', value: '2' },
  ],
  banner: {
    title: '2 items missing',
    body: 'You can still share this pack. Missing items are clearly labelled, so the recipients can request them from you directly.',
  },
  items: [
    {
      item: 'Registered company details',
      status: { label: 'Available', tone: 'success' },
      source: 'Companies House',
    },
    {
      item: 'Latest annual accounts',
      status: { label: 'Available', tone: 'success' },
      source: 'Annual Accounts FY25.pdf',
    },
    {
      item: 'Energy & emissions summary',
      status: { label: 'Self-declared', tone: 'warning' },
      source: 'Onboarding assessment',
    },
    {
      item: 'Sustainability policy',
      status: { label: 'Missing', tone: 'errorSoft' },
      source: '—',
    },
    {
      item: 'Health & safety policy',
      status: { label: 'Available', tone: 'success' },
      source: 'H&S Policy.pdf',
    },
    {
      item: 'Diversity & inclusion statement',
      status: { label: 'Missing', tone: 'errorSoft' },
      source: '—',
    },
    {
      item: 'Anti-bribery policy',
      status: { label: 'Self-declared', tone: 'warning' },
      source: 'Onboarding assessment',
    },
    {
      item: 'Data protection policy',
      status: { label: 'Available', tone: 'success' },
      source: 'DP Policy v3.pdf',
    },
  ],
};

/* ---- Audit & Assurance pack: banner + grouped reliability checklist ---- */
/** Row icon-chip: evidence on file / self-declared / no evidence. */
export type AuditChip = 'evidence' | 'partial' | 'none';

export type AuditRow = {
  chip: AuditChip;
  item: string;
  desc: string;
  reliability: string;
};

export type AuditReport = {
  banner: { title: string; body: string };
  sections: { title: string; rows: AuditRow[] }[];
};

export const AUDIT_REPORT: AuditReport = {
  banner: {
    title: '3 of 6 items have evidence · 3 missing',
    body: 'Kindly note that this pack is a positioning aid and not an independent audit assurance.',
  },
  sections: [
    {
      title: 'Sustainability',
      rows: [
        {
          chip: 'partial',
          item: 'Energy usage evidence',
          desc: 'Self-declared; upload evidence to strengthen.',
          reliability: 'Medium reliability',
        },
        {
          chip: 'none',
          item: 'Sustainability policy',
          desc: 'No evidence; upload to close this gap.',
          reliability: 'Low reliability',
        },
      ],
    },
    {
      title: 'Banking',
      rows: [
        {
          chip: 'evidence',
          item: 'Signed audited accounts',
          desc: 'Evidence on file.',
          reliability: 'High reliability',
        },
        {
          chip: 'evidence',
          item: '6 months bank statements',
          desc: 'Evidence on file.',
          reliability: 'High reliability',
        },
      ],
    },
    {
      title: 'Financial',
      rows: [
        {
          chip: 'evidence',
          item: 'Balance sheets',
          desc: 'Evidence on file',
          reliability: 'High reliability',
        },
        {
          chip: 'partial',
          item: 'P&L reports',
          desc: 'Self-declared; upload evidence to strengthen.',
          reliability: 'Medium reliability',
        },
      ],
    },
  ],
};

/* ---- Compliance & Regulatory pack: framework status cards ---- */
export type FrameworkTone = 'warning' | 'error' | 'success';

export type FrameworkCard = {
  tone: FrameworkTone;
  heading: string;
  badge: string;
  lines: { label: string; text: string }[];
};

export const COMPLIANCE_REPORT: FrameworkCard[] = [
  {
    tone: 'warning',
    heading: 'SECR (Streamlined Energy & Carbon Reporting)',
    badge: 'Environmental',
    lines: [
      { label: 'Gap identified:', text: ' Scope 3 emissions not yet declared.' },
      {
        label: 'Recommended action:',
        text: ' Consider providing gas and fleet fuel invoices to help complete your emissions assessment.',
      },
    ],
  },
  {
    tone: 'error',
    heading: 'PPN 06/21 (Carbon Reduction Plan)',
    badge: 'Environmental',
    lines: [
      { label: 'Missing:', text: ' No carbon reduction plan uploaded.' },
      {
        label: 'Recommended action:',
        text: ' Consider developing a plan that outlines your emissions reduction goals, including any net-zero target.',
      },
    ],
  },
  {
    tone: 'success',
    heading: 'Modern Slavery Statement',
    badge: 'Social',
    lines: [
      { label: 'Status:', text: ' Evidence available.' },
      {
        label: 'Recommended action:',
        text: ' Consider reviewing your sustainability information annually to keep it up to date.',
      },
    ],
  },
  {
    tone: 'success',
    heading: 'GDPR data protection policy',
    badge: 'Governance',
    lines: [
      { label: 'Status:', text: ' Evidence available.' },
      {
        label: 'Recommended action:',
        text: ' Consider reviewing your policy following changes to your company’s data processing activities.',
      },
    ],
  },
];

/** Pack slugs whose populated report has been built. */
export const BUILT_REPORTS = new Set([
  'esg-intelligence',
  'disclosure',
  'audit-assurance',
  'compliance-regulatory',
]);
