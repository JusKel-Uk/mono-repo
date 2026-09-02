import type { LucideIcon } from 'lucide-react';
import { ClipboardCheck, FileText, Share2, ShieldCheck } from 'lucide-react';

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
