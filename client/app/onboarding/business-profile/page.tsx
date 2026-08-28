import type { Metadata } from 'next';
import { BusinessProfileForm } from './business-profile-form';

export const metadata: Metadata = { title: 'Business profile' };

export default function BusinessProfilePage() {
  return <BusinessProfileForm />;
}
