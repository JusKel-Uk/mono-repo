import type { LucideIcon } from 'lucide-react';
import { Landmark, Banknote } from 'lucide-react';

import type { FinancialProfileInput } from '@/lib/validations/onboarding';

/**
 * Financial data-source connectors (Open Banking / Xero / QuickBooks).
 * The integrations are stubbed — the connect flow is simulated client-side —
 * but the copy and consent content mirror the Figma designs.
 */

export type ConnectorId = 'openBanking' | 'xero' | 'quickbooks';

export type ConnectorConfig = {
  id: ConnectorId;
  name: string;
  tag: string;
  cardDescription: string;
  icon: LucideIcon;
  connectCta: string;
  reconnectCta: string;
  continueCta: string;
  errorMessage: string;
  consent: {
    title: string;
    intro: string;
    /** Highlighted reassurance paragraph (Open Banking only). */
    note?: string;
    /** Trust pills (Open Banking only). */
    badges?: string[];
    permissions: string[];
  };
};

export const CONNECTORS: Record<ConnectorId, ConnectorConfig> = {
  openBanking: {
    id: 'openBanking',
    name: 'Open Banking',
    tag: 'TrueLayer · FCA-regulated',
    cardDescription: 'Verifies cash, runway, monthly inflow / outflow.',
    icon: Landmark,
    connectCta: 'Connect Bank',
    reconnectCta: 'Reconnect Bank',
    continueCta: 'Continue to Open Banking',
    errorMessage: 'Open Banking rejected the consent (SCA timeout). Try again.',
    consent: {
      title: 'Authorise Open Banking',
      intro:
        'Connect your business bank account to securely provide verified financial data.',
      note: 'This helps JusKel calculate your Financial Intelligence Score and identify funding opportunities more accurately. JusKel cannot move money or make payments.',
      badges: [
        'Read-only access',
        'PSD2/Open Banking compliant',
        'Bank-grade encryption',
      ],
      permissions: [
        'Read your business account balances',
        'Read the last 12 months of transactions',
        'Refresh data every 24 hours (revocable)',
      ],
    },
  },
  xero: {
    id: 'xero',
    name: 'Xero',
    tag: 'Xero Accounting',
    cardDescription:
      'Pulls P&L, balance sheet, invoices; evidences revenue and profitability.',
    icon: Banknote,
    connectCta: 'Connect Xero',
    reconnectCta: 'Reconnect Xero',
    continueCta: 'Continue to Xero',
    errorMessage: 'Xero authorisation was cancelled. Try again.',
    consent: {
      title: 'Authorise Xero',
      intro:
        'JusKel will only request the minimum financial information required to calculate your Financial Intelligence Score.',
      permissions: [
        'Read P&L and balance sheet',
        'Read outstanding invoices and bills',
        'No write access, ever',
      ],
    },
  },
  quickbooks: {
    id: 'quickbooks',
    name: 'QuickBooks',
    tag: 'Intuit QuickBooks Online',
    cardDescription:
      'Does the same as Xero, you can choose either of them to use.',
    icon: Banknote,
    connectCta: 'Connect QuickBooks',
    reconnectCta: 'Reconnect QuickBooks',
    continueCta: 'Continue to QuickBooks',
    errorMessage: 'QuickBooks authorisation was cancelled. Try again.',
    consent: {
      title: 'Authorise QuickBooks',
      intro:
        'JusKel will only request the minimum financial information required to calculate your Financial Intelligence Score.',
      permissions: [
        'Read financial reports',
        'Read accounts receivables and payables',
        'No write access, ever',
      ],
    },
  },
};

/** Band values a connected source reports (stub). Applied on a successful connect. */
export const VERIFIED_BANDS: Record<keyof FinancialProfileInput, string> = {
  annualRevenueBand: '£250k-£1m',
  ebitdaBand: '5-15% margin',
  existingDebtBand: 'Under £50k',
  cashReserves: '3-6 months',
  avgMonthlyRevenue: '£80k-£400k',
};

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';
