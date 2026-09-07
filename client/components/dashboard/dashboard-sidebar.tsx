import { AppSidebar } from '@/components/app-sidebar';
import { OrgSwitcher } from '@/components/dashboard/org-switcher';

/** Dashboard sidebar: unlocked, route-aware app nav + org switcher context. */
export function DashboardSidebar() {
  return <AppSidebar orgSwitcher={<OrgSwitcher />} />;
}
