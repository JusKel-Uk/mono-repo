import type { Metadata } from 'next';
import { CompanySetupForm } from './company-setup-form';

export const metadata: Metadata = { title: 'Set up your company' };

export default function CompanySetupPage() {
  return <CompanySetupForm />;
}
