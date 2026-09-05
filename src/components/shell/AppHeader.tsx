"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Search,
  Menu,
  Building2,
  ChevronLeft,
  Globe,
  ShoppingBag,
  ShieldCheck,
  Code2,
} from "lucide-react";
import { BrandMark } from "@kannan19302/ui/primitives";
import { ThemeQuickToggle } from "@kannan19302/ui/theme";
import { AppSwitcher } from "./AppSwitcher";
import { NotificationCenter } from "./NotificationCenter";
import { ProfileHoverCard } from "./ProfileHoverCard";
import { HeaderOnboardingHUD } from "./HeaderOnboardingHUD";
import styles from "./AppHeader.module.css";

export interface TenantOption {
  id?: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
}

interface AppHeaderProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  theme: "light" | "dark";
  currentTenant: TenantOption;
  tenants: TenantOption[];
  handleTenantSwitch: (t: TenantOption) => void;
  user: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    roles?: string[];
  } | null;
  handleLogout: () => void;
  /** CSS color for the presence dot on the avatar; defaults to online-green. */
  presenceColor?: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  appsDropdownOpen: boolean;
  setAppsDropdownOpen: (open: boolean) => void;
  tenantDropdownOpen: boolean;
  setTenantDropdownOpen: (open: boolean) => void;
  userDropdownOpen: boolean;
  setUserDropdownOpen: (open: boolean) => void;
  cmdPaletteOpen: boolean;
  setCmdPaletteOpen: (open: boolean) => void;
  isAppsLanding: boolean;
  switcherItems: any[];
  expandedFolders: Record<string, boolean>;
  setExpandedFolders: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  appsDropdownRef: React.RefObject<HTMLDivElement | null>;
  tenantDropdownRef: React.RefObject<HTMLDivElement | null>;
  userDropdownRef: React.RefObject<HTMLDivElement | null>;
  searchDropdownRef: React.RefObject<HTMLDivElement | null>;
  GLOBAL_SEARCH_ITEMS: any[];
}

function ThemeMenu({ iconBtnStyle }: { iconBtnStyle: string }) {
  return <ThemeQuickToggle className={iconBtnStyle} />;
}

export function AppHeader({
  collapsed,
  setCollapsed,
  theme,
  currentTenant,
  tenants,
  handleTenantSwitch,
  user,
  handleLogout,
  searchQuery,
  setSearchQuery,
  searchOpen,
  setSearchOpen,
  appsDropdownOpen,
  setAppsDropdownOpen,
  tenantDropdownOpen,
  setTenantDropdownOpen,
  userDropdownOpen,
  setUserDropdownOpen,
  presenceColor,
  cmdPaletteOpen,
  setCmdPaletteOpen,
  isAppsLanding,
  switcherItems,
  expandedFolders,
  setExpandedFolders,
  appsDropdownRef,
  tenantDropdownRef,
  userDropdownRef,
  searchDropdownRef,
  GLOBAL_SEARCH_ITEMS,
}: AppHeaderProps) {
  const router = useRouter();
  const { pathname } =
    typeof window !== "undefined" ? window.location : { pathname: "/" };

  const headerClass = `${styles.header} ${theme === "light" ? styles.headerLight : styles.headerDark}`;
  const btnStyle = `${styles.actionBtn} ${theme === "light" ? styles.actionBtnLight : styles.actionBtnDark}`;
  const iconBtnStyle = `${styles.iconBtn} ${theme === "light" ? styles.iconBtnLight : styles.iconBtnDark}`;
  const userBtnStyle = `${styles.userBtn} ${theme === "light" ? styles.userBtnLight : styles.userBtnDark}`;
  const searchInputStyle = `${styles.searchInput} ${theme === "light" ? styles.searchInputLight : styles.searchInputDark}`;
  const searchKbdStyle = `${styles.searchKbd} ${theme === "light" ? styles.searchKbdLight : styles.searchKbdDark}`;
  const statusDotStyle = `${styles.statusDot} ${theme === "light" ? styles.statusDotLight : styles.statusDotDark}`;

  const userRoles = Array.isArray(user?.roles)
    ? user.roles.map((r: any) => String(r).toUpperCase())
    : [];
  const isAdmin =
    userRoles.length === 0 ||
    userRoles.some((r: string) =>
      ["ADMIN", "TENANT_ADMIN", "SUPER_ADMIN", "OWNER", "WORKSPACE_ADMIN"].includes(r),
    );
  const isDeveloper =
    userRoles.length === 0 ||
    userRoles.some((r: string) =>
      ["DEVELOPER", "DEV", "SUPER_ADMIN", "ADMIN", "ENGINEER"].includes(r),
    );

  const tenantSiteUrl =
    process.env.NEXT_PUBLIC_TENANT_SITE_URL ||
    (currentTenant.slug ? `http://${currentTenant.slug}.localhost:3000` : "http://localhost:3000");
  const marketplaceUrl =
    process.env.NEXT_PUBLIC_MARKETPLACE_URL || "http://localhost:4007";
  const occUrl =
    process.env.NEXT_PUBLIC_TENANT_ADMIN_URL || "http://localhost:4002";
  const devPlatformUrl =
    process.env.NEXT_PUBLIC_DEV_PLATFORM_URL || "http://localhost:4004";

  return (
    <header className={headerClass}>
      {/* Top Left: Apps Switcher & Tenant Selector / Breadcrumbs */}
      <div className={styles.leftSection}>
        <div className={styles.hstack}>
          {/* Mobile hamburger menu toggle button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={styles.menuMobileBtn}
            aria-label="Toggle navigation menu"
          >
            <Menu size={18} />
          </button>
          <a href="http://localhost:4000" aria-label="Open Workspace Atlas">
            <BrandMark compact size="sm" />
          </a>

          {isAppsLanding ? (
            <nav aria-label="Breadcrumb" className={styles.breadcrumbContainer}>
              <a href="http://localhost:4000" className={styles.breadcrumbMuted}>
                Workspace Atlas
              </a>
              <span className={styles.breadcrumbSeparator}>›</span>
              <span className={styles.breadcrumbCurrent}>Apps</span>
            </nav>
          ) : (
            <>
              <AppSwitcher
                appsDropdownOpen={appsDropdownOpen}
                setAppsDropdownOpen={setAppsDropdownOpen}
                switcherItems={switcherItems}
                expandedFolders={expandedFolders}
                setExpandedFolders={setExpandedFolders}
                appsDropdownRef={appsDropdownRef}
                theme={theme}
              />

              {/* Tenant Selector — real memberships from /auth/tenants */}
              <div className="relative" ref={tenantDropdownRef}>
                <button
                  onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
                  className={btnStyle}
                  title={
                    tenants.length > 1
                      ? "Organization — switch between the organizations your account belongs to"
                      : "Organization — the tenant you are currently signed in to"
                  }
                >
                  {currentTenant.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentTenant.logoUrl}
                      alt=""
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        objectFit: "contain",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <Building2 size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
                  )}
                  <span>{currentTenant.name}</span>
                  {tenants.length > 1 && (
                    <ChevronDown
                      size={13}
                      className={`${styles.chevronIcon} ${tenantDropdownOpen ? styles.chevronRotated : ""}`}
                    />
                  )}
                </button>
                {tenantDropdownOpen && tenants.length > 1 && (
                  <div className="ui-dropdown ui-dropdown-left ui-dropdown-tenant">
                    <p className="ui-dropdown-header">Switch organization</p>
                    {tenants.map((t) => {
                      const isTenantActive = currentTenant.slug === t.slug;
                      return (
                        <button
                          key={t.slug}
                          onClick={() => handleTenantSwitch(t)}
                          className={`ui-dropdown-item ${isTenantActive ? "active" : ""}`}
                          title={
                            isTenantActive
                              ? "Currently active organization"
                              : `Sign in to ${t.name} with this account`
                          }
                        >
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Breadcrumbs */}
              {pathname && (
                <div className="hidden md:flex items-center space-x-2 text-sm ml-4 text-[var(--color-text-secondary)] border-l border-[var(--color-border)] pl-4">
                  {pathname
                    .split("/")
                    .filter(Boolean)
                    .map((part, i, arr) => (
                      <React.Fragment key={i}>
                        {i > 0 && <span>/</span>}
                        <span
                          className={
                            i === arr.length - 1
                              ? "font-medium text-[var(--color-text)]"
                              : "opacity-80 capitalize"
                          }
                        >
                          {part.replace(/-/g, " ")}
                        </span>
                      </React.Fragment>
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Top Right: Search, Portals & Ecosystem shortcuts, Dark mode, Notification, Profiler */}
      <div className={styles.rightSection}>
        {isAppsLanding ? (
          <>
            {/* Back Navigation */}
            <button
              type="button"
              onClick={() => router.back()}
              className={iconBtnStyle}
              title="Go back"
              aria-label="Go back"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Tenant Website Shortcut (Browser) */}
            <a
              href={tenantSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={iconBtnStyle}
              title={`Visit ${currentTenant.name || "Tenant"} Public Site / Storefront`}
              aria-label="Visit Tenant Website"
            >
              <Globe size={16} />
            </a>

            {/* Developer Platform Shortcut (Placed near Browser icon) */}
            {isDeveloper && (
              <a
                href={devPlatformUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={iconBtnStyle}
                title="Developer Platform (:4004)"
                aria-label="Open Developer Platform"
              >
                <Code2 size={16} />
              </a>
            )}

            {/* Marketplace Shortcut */}
            <a
              href={marketplaceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={iconBtnStyle}
              title="UniERP Marketplace (:4007)"
              aria-label="Open Marketplace"
            >
              <ShoppingBag size={16} />
            </a>

            {/* RBAC: Tenant Admin OS (OCC) Shortcut */}
            {isAdmin && (
              <a
                href={occUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={iconBtnStyle}
                title="Tenant Admin OS (OCC :4002)"
                aria-label="Open Tenant Admin OS"
              >
                <ShieldCheck size={16} />
              </a>
            )}
          </>
        ) : (
          <div ref={searchDropdownRef} className={styles.searchContainer}>
            <div className={styles.searchWrapper}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search or type Cmd+K..."
                value={searchQuery}
                onClick={() => setCmdPaletteOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(e.target.value.length > 0);
                }}
                className={searchInputStyle}
                onFocus={() => {
                  if (searchQuery.length > 0) setSearchOpen(true);
                }}
              />
              <kbd className={searchKbdStyle}>⌘K</kbd>
            </div>

            {/* Dynamic Search Dropdown Results */}
            {searchOpen && searchQuery.length > 0 && (
              <div className="ui-dropdown ui-dropdown-right ui-dropdown-search">
                <p className="ui-dropdown-header">Search Results</p>
                {GLOBAL_SEARCH_ITEMS.filter((item) =>
                  item.name.toLowerCase().includes(searchQuery.toLowerCase()),
                )
                  .slice(0, 10)
                  .map((result) => (
                    <button
                      key={result.name}
                      onClick={() => {
                        router.push(result.href);
                        setSearchOpen(false);
                        setSearchQuery("");
                      }}
                      className="ui-dropdown-item"
                    >
                      <result.icon
                        size={14}
                        style={{
                          color:
                            result.type === "App"
                              ? "var(--color-primary)"
                              : "var(--color-text-secondary)",
                          opacity: 0.8,
                        }}
                      />
                      <div className="ui-flex-col">
                        <span className="font-medium">{result.name}</span>
                        <span className="ui-text-micro">{result.type}</span>
                      </div>
                    </button>
                  ))}
                {GLOBAL_SEARCH_ITEMS.filter((item) =>
                  item.name.toLowerCase().includes(searchQuery.toLowerCase()),
                ).length === 0 && (
                  <div
                    style={{
                      padding: "var(--space-3) var(--space-2)",
                      textAlign: "center",
                      color: "var(--color-text-secondary)",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Onboarding Progress HUD */}
        <HeaderOnboardingHUD />

        {/* Header intentionally offers light/dark only. Advanced themes and
            density live in the avatar Account Center. */}
        <ThemeMenu iconBtnStyle={iconBtnStyle} />

        {/* Realtime Notification Center */}
        <NotificationCenter iconBtnStyle={iconBtnStyle} />

        {/* Separator */}
        <div className={styles.divider} />

        {/* User Profile — Teams-style hover/click card (status, org, contact,
            reporting line, quick actions) replaces the old plain dropdown. */}
        <div ref={userDropdownRef}>
          <ProfileHoverCard
            viewerId={user?.id}
            user={user}
            fallbackInitials={
              user ? `${user.firstName[0]}${user.lastName[0]}` : "SU"
            }
            fallbackAvatarUrl={user?.avatar}
            onSignOut={handleLogout}
          />
        </div>
      </div>
    </header>
  );
}
