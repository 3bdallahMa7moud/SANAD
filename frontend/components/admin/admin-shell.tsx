'use client';
import { useCopy } from '@/lib/i18n/use-copy';

import {
  Activity,
  BadgePercent,
  Boxes,
  ClipboardList,
  CreditCard,
  FileText,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Star,
  Tags,
  Users,
  Shield,
  ShieldX,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { BrandLogo } from '@/components/shared/brand-logo';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils/cn';
import {
  hasAdminPermission,
  type AdminPermission,
} from '@/lib/admin/permissions';
import type { User } from '@/types/domain';
import { LanguageSwitcher } from '@/components/layouts/language-switcher';
import { ThemeSwitcher } from '@/components/layouts/theme-switcher';

const navigation = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    permission: 'dashboard.view',
  },
  {
    href: '/admin/orders',
    label: 'Orders',
    icon: ClipboardList,
    permission: 'orders.view',
  },
  {
    href: '/admin/packages',
    label: 'Packages',
    icon: Boxes,
    permission: 'packages.view',
  },
  {
    href: '/admin/offers',
    label: 'Offers',
    icon: BadgePercent,
    permission: 'offers.view',
  },
  {
    href: '/admin/coupons',
    label: 'Coupons',
    icon: Tags,
    permission: 'coupons.view',
  },
  {
    href: '/admin/customers',
    label: 'Customers',
    icon: Users,
    permission: 'customers.view',
  },
  {
    href: '/admin/payments',
    label: 'Payments',
    icon: CreditCard,
    permission: 'payments.view',
  },
  {
    href: '/admin/reviews',
    label: 'Reviews',
    icon: Star,
    permission: 'reviews.view',
  },
  {
    href: '/admin/pages',
    label: 'Pages',
    icon: FileText,
    permission: 'pages.view',
  },
  {
    href: '/admin/media',
    label: 'Media',
    icon: ImageIcon,
    permission: 'media.view',
  },
  {
    href: '/admin/settings',
    label: 'Settings',
    icon: Settings,
    permission: 'settings.view',
  },
  {
    href: '/admin/activity-logs',
    label: 'Activity Logs',
    icon: Activity,
    permission: 'activity_logs.view',
  },
  {
    href: '/admin/administrators',
    label: 'Administrators',
    icon: Shield,
    superOnly: true,
  },
] as const;

function Navigation({
  pathname,
  user,
  compact = false,
  onNavigate,
}: {
  pathname: string;
  user: User | null;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const _copy = useCopy();

  return (
    <nav aria-label={_copy('Admin navigation')} className="mt-7 grid gap-1">
      {navigation
        .filter((item) =>
          'superOnly' in item && item.superOnly
            ? user?.role === 'super_admin'
            : 'permission' in item && item.permission
              ? hasAdminPermission(user, item.permission as AdminPermission)
              : true,
        )
        .map(({ href, label, icon: Icon }) => {
          const active =
            href === '/admin' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors',
                compact && 'justify-center px-2',
                active
                  ? 'bg-accent text-accent-foreground'
                  : 'text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground',
              )}
              href={href}
              key={href}
              onClick={onNavigate}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span
                className={cn(
                  'overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-out',
                  compact ? 'max-w-0 opacity-0' : 'max-w-40 opacity-100',
                )}
              >
                {_copy(label)}
              </span>
            </Link>
          );
        })}
    </nav>
  );
}

function currentTitle(pathname: string) {
  return (
    navigation.find((item) =>
      item.href === '/admin'
        ? pathname === item.href
        : pathname.startsWith(item.href),
    )?.label ?? 'Administration'
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const _copy = useCopy();

  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [desktopNavigationOpen, setDesktopNavigationOpen] = useState(true);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const currentNavigationItem = navigation.find((item) =>
    item.href === '/admin'
      ? pathname === item.href
      : pathname.startsWith(item.href),
  );
  const canOpenCurrentPage = currentNavigationItem
    ? 'superOnly' in currentNavigationItem && currentNavigationItem.superOnly
      ? user?.role === 'super_admin'
      : 'permission' in currentNavigationItem &&
          currentNavigationItem.permission
        ? hasAdminPermission(
            user,
            currentNavigationItem.permission as AdminPermission,
          )
        : true
    : true;
  const doLogout = () =>
    void logout().finally(() => router.replace('/admin/sign-in'));
  return (
    <div
      className={cn(
        'min-h-svh bg-surface-muted/45 lg:grid lg:transition-[grid-template-columns] lg:duration-300 lg:ease-in-out',
        desktopNavigationOpen
          ? 'lg:grid-cols-[16rem_minmax(0,1fr)]'
          : 'lg:grid-cols-[4.5rem_minmax(0,1fr)]',
      )}
    >
      <aside
        className={cn(
          'hidden min-h-svh bg-primary py-5 text-primary-foreground transition-[padding] duration-200 lg:block',
          desktopNavigationOpen ? 'px-4' : 'px-2',
        )}
      >
        <div
          className={cn(
            'mb-5 flex items-center',
            desktopNavigationOpen ? 'justify-between gap-2' : 'justify-center',
          )}
        >
          <Link
            aria-label={_copy('SANAD home')}
            className={cn(
              'h-14 overflow-hidden rounded-md bg-[#f8f0e0] transition-[max-width,opacity] duration-200 ease-out',
              desktopNavigationOpen
                ? 'max-w-48 flex-1 opacity-100'
                : 'pointer-events-none max-w-0 opacity-0',
            )}
            href="/"
          >
            <BrandLogo className="size-full object-cover" loading="eager" />
          </Link>
          <Button
            aria-label={_copy(
              desktopNavigationOpen ? 'Close navigation' : 'Open navigation',
            )}
            className="shrink-0 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            onClick={() => setDesktopNavigationOpen((open) => !open)}
            size="icon"
            variant="ghost"
          >
            {desktopNavigationOpen ? (
              <PanelLeftClose aria-hidden="true" className="size-5" />
            ) : (
              <PanelLeftOpen aria-hidden="true" className="size-5" />
            )}
          </Button>
        </div>
        <Navigation
          compact={!desktopNavigationOpen}
          pathname={pathname}
          user={user}
        />
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex min-h-16 items-center gap-4 border-b border-border bg-surface px-4 sm:px-6">
          <Sheet
            onOpenChange={setMobileNavigationOpen}
            open={mobileNavigationOpen}
          >
            <SheetTrigger asChild>
              <Button
                aria-label={_copy(
                  mobileNavigationOpen ? 'Close navigation' : 'Open navigation',
                )}
                className="lg:hidden"
                size="icon"
                variant="outline"
              >
                {mobileNavigationOpen ? (
                  <PanelLeftClose aria-hidden="true" className="size-5" />
                ) : (
                  <Menu aria-hidden="true" className="size-5" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              className="bg-primary text-primary-foreground"
              side="left"
            >
              <SheetTitle className="text-primary-foreground">
                {_copy('SANAD Admin')}
              </SheetTitle>
              <Navigation
                onNavigate={() => setMobileNavigationOpen(false)}
                pathname={pathname}
                user={user}
              />
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">
              {_copy('SANAD Administration')}
            </p>
            <h1 className="truncate font-semibold text-primary">
              {_copy(currentTitle(pathname))}
            </h1>
          </div>
          <div className="hidden text-end sm:block">
            <p className="text-sm font-semibold text-primary">{user?.name}</p>
            <p className="text-xs text-muted-foreground">
              {_copy(user?.role.replace('_', ' '))}
            </p>
          </div>
          <LanguageSwitcher variant="text" />
          <ThemeSwitcher />
          <Button
            aria-label={_copy('Sign out')}
            onClick={doLogout}
            size="icon"
            variant="ghost"
          >
            <LogOut className="size-4" />
          </Button>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          {canOpenCurrentPage ? (
            _copy(children)
          ) : (
            <section className="mx-auto max-w-xl border border-border bg-surface p-8 text-center shadow-sm">
              <ShieldX
                className="mx-auto size-10 text-error"
                aria-hidden="true"
              />
              <h2 className="type-h3 mt-5 text-primary">
                {_copy('Access denied', 'غير مسموح بالوصول')}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {_copy(
                  'Your administrator account does not have permission to open this section.',
                  'حساب الإدارة الخاص بك لا يمتلك صلاحية فتح هذا القسم.',
                )}
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
