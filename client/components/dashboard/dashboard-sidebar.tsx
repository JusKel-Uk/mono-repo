import { AppSidebar } from '@/components/app-sidebar';

/** Dashboard sidebar: unlocked, route-aware app nav + company context. */
export function DashboardSidebar() {
  return (
    <AppSidebar
      context={{
        title: 'JusKel Technology Ltd',
        badge: 'OWNER',
        subtitle: 'Owner / Founder / Director',
      }}
    />
  );
}
