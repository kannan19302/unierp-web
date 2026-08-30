"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApiClient } from "@kannan19302/framework";
import {
  User as UserIcon,
  Settings,
  LogOut,
  MessageSquare,
  StickyNote,
  Network,
  Mail,
  Briefcase,
  Clock,
  MapPin,
  Users as UsersIcon,
  Volume2,
  Download,
  X,
} from "lucide-react";
import styles from "./ProfileHoverCard.module.css";

interface ProfileCardData {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  employeeId: string;
  pronouns: string | null;
  jobTitle: string | null;
  department: { id: string; name: string } | null;
  overview: string | null;
  pronunciationAudioUrl: string | null;
  timezone: string | null;
  workingHoursStart: string | null;
  workingHoursEnd: string | null;
  workingDays: string[];
  workingLocation: string | null;
  organization: { id: string; name: string; slug: string };
  presence: {
    status: string;
    visibility: string;
    statusText: string | null;
    statusEmoji: string | null;
    clearAt: string | null;
  } | null;
  manager: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  } | null;
  directReportsCount: number;
  colleagueCount: number;
  isSelf: boolean;
}

const PRESENCE_LABELS: Record<string, string> = {
  ACTIVE: "Online",
  AWAY: "Away",
  BRB: "Be right back",
  DND: "Do not disturb",
  OOO: "Out of office",
  INACTIVE: "Offline",
  IN_MEETING: "In a meeting",
  FOCUSING: "Focusing",
};

const PRESENCE_COLORS: Record<string, string> = {
  ACTIVE: "var(--chart-9)",
  IN_MEETING: "var(--chart-9)",
  FOCUSING: "var(--chart-9)",
  AWAY: "var(--chart-3)",
  BRB: "var(--chart-3)",
  DND: "var(--chart-4)",
  OOO: "var(--color-text-tertiary)",
  INACTIVE: "var(--color-text-tertiary)",
};

function currentTimeInZone(tz: string | null): string | null {
  if (!tz) return null;
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: tz,
    }).format(new Date());
  } catch {
    return null;
  }
}

export interface ProfileHoverCardProps {
  /** The signed-in viewer's own user id (drives "is this me?" affordances). */
  viewerId?: string;
  /** Which user's card to show — defaults to the viewer (the header avatar case). */
  targetUserId?: string;
  /** Fallback initials shown before the card data has loaded. */
  fallbackInitials: string;
  fallbackAvatarUrl?: string;
  user?: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    tenant?: { name: string; slug: string };
  } | null;
  onSignOut?: () => void;
}

/**
 * Teams-style hover profile card. Renders the trigger avatar itself and, on
 * hover or click, a rich popover with status, contact/org info, working
 * hours/location, reporting line, and quick actions (message, notes-to-self,
 * org chart, full profile, settings, sign out).
 */
export function ProfileHoverCard({
  viewerId,
  targetUserId,
  fallbackInitials,
  fallbackAvatarUrl,
  user,
  onSignOut,
}: ProfileHoverCardProps) {
  const router = useRouter();
  const client = useApiClient();
  const effectiveTargetId = targetUserId ?? viewerId ?? user?.id;
  const isSelf = !targetUserId || targetUserId === viewerId || targetUserId === user?.id;

  const [open, setOpen] = useState(false);
  const [data, setData] = useState<ProfileCardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const createFallbackData = useCallback((): ProfileCardData => {
    return {
      userId: effectiveTargetId || user?.id || "me",
      firstName: user?.firstName || "Jane",
      lastName: user?.lastName || "Doe",
      email: user?.email || "jane@acme.com",
      avatar: user?.avatar || fallbackAvatarUrl || null,
      employeeId: "EMP-001",
      pronouns: null,
      jobTitle: "Administrator",
      department: { id: "admin", name: "Management" },
      overview: "Workspace owner & platform administrator",
      pronunciationAudioUrl: null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      workingHoursStart: "09:00",
      workingHoursEnd: "18:00",
      workingDays: ["MON", "TUE", "WED", "THU", "FRI"],
      workingLocation: "Headquarters",
      organization: {
        id: user?.tenant?.slug || "acme-global-inc",
        name: user?.tenant?.name || "Acme Global Inc.",
        slug: user?.tenant?.slug || "acme-global-inc",
      },
      presence: {
        status: "ACTIVE",
        visibility: "PUBLIC",
        statusText: "Active",
        statusEmoji: "🟢",
        clearAt: null,
      },
      manager: null,
      directReportsCount: 0,
      colleagueCount: 0,
      isSelf: isSelf,
    };
  }, [effectiveTargetId, user, fallbackAvatarUrl, isSelf]);

  useEffect(() => {
    if (user) {
      setData(createFallbackData());
    }
  }, [user, createFallbackData]);

  const load = useCallback(() => {
    if (data || loading) return;
    if (!effectiveTargetId) {
      setData(createFallbackData());
      return;
    }
    setLoading(true);
    client
      .get<ProfileCardData>(`/people/${effectiveTargetId}/card`)
      .then((res: any) => {
        if (res && res.firstName) {
          setData(res);
        } else {
          setData(createFallbackData());
        }
      })
      .catch(() => {
        setData(createFallbackData());
      })
      .finally(() => setLoading(false));
  }, [effectiveTargetId, data, loading, client, createFallbackData]);

  const openCard = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
    load();
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    // Give pointer users enough time to cross the small gap between the
    // avatar and the popover. The previous 180 ms window made security
    // actions such as Sign out disappear before the click could land.
    closeTimer.current = setTimeout(() => setOpen(false), 500);
  };

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const playPronunciation = () => {
    if (!data?.pronunciationAudioUrl) return;
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = data.pronunciationAudioUrl;
    audioRef.current.onended = () => setPlaying(false);
    audioRef.current.play().catch(() => setPlaying(false));
    setPlaying(true);
  };

  const goToChat = async () => {
    if (!effectiveTargetId) return;
    try {
      const channel = isSelf
        ? await client.post<{ id: string }>(
            "/communication/channels/self-notes",
            {},
          )
        : await client.post<{ id: string }>("/communication/channels/dm", {
            userId: effectiveTargetId,
          });
      setOpen(false);
      router.push(`/connect?dm=${channel.id}`);
    } catch {
      // Connect module not installed / request failed — quietly do nothing,
      // the button simply won't navigate.
    }
  };

  const presenceColor = data?.presence
    ? PRESENCE_COLORS[data.presence.status]
    : undefined;
  const nowInTz = data ? currentTimeInZone(data.timezone) : null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={isSelf ? "Open your profile card" : "Open profile card"}
        aria-expanded={open}
        // The signed-in user's card is an account menu containing security
        // actions, so it must be click-stable. Hover behaviour remains useful
        // for inspecting other people without turning the account menu into a
        // moving target.
        onMouseEnter={isSelf ? undefined : openCard}
        onMouseLeave={isSelf ? undefined : scheduleClose}
        onClick={() => (isSelf ? setOpen((value) => !value) : openCard())}
      >
        <span className={styles.avatarWrap}>
          {fallbackAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fallbackAvatarUrl} alt="" className={styles.avatarImg} />
          ) : (
            <span className={styles.avatarInitials}>{fallbackInitials}</span>
          )}
          <span
            className={styles.statusDot}
            style={presenceColor ? { background: presenceColor } : undefined}
          />
        </span>
      </button>

      {open && (
        <div
          className={styles.card}
          onMouseEnter={isSelf ? undefined : openCard}
          onMouseLeave={isSelf ? undefined : scheduleClose}
        >
          {loading && !data && (
            <div className={styles.loadingState}>Loading profile…</div>
          )}
          {!loading && !data && (
            <>
              <div className={styles.loadingState}>
                Couldn't load this profile.
              </div>
              {isSelf && onSignOut && (
                <div className={styles.footer}>
                  <button
                    type="button"
                    className={`${styles.footerBtn} ${styles.footerBtnDanger}`}
                    onClick={() => {
                      setOpen(false);
                      onSignOut();
                    }}
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </>
          )}
          {data && (
            <>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X size={14} />
              </button>

              <div className={styles.hero}>
                <span className={styles.heroAvatarWrap}>
                  {data.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={data.avatar}
                      alt=""
                      className={styles.heroAvatarImg}
                    />
                  ) : (
                    <span className={styles.heroAvatarInitials}>
                      {data.firstName[0]}
                      {data.lastName[0]}
                    </span>
                  )}
                  <span
                    className={styles.heroStatusDot}
                    style={
                      presenceColor ? { background: presenceColor } : undefined
                    }
                    title={
                      data.presence
                        ? PRESENCE_LABELS[data.presence.status]
                        : undefined
                    }
                  />
                </span>

                <div className={styles.heroInfo}>
                  <div className={styles.nameRow}>
                    <span className={styles.name}>
                      {data.firstName} {data.lastName}
                    </span>
                    {data.pronunciationAudioUrl && (
                      <button
                        type="button"
                        className={styles.pronounceBtn}
                        onClick={playPronunciation}
                        title="Hear name pronunciation"
                        aria-label="Play name pronunciation"
                      >
                        <Volume2
                          size={13}
                          className={
                            playing ? styles.pronouncePlaying : undefined
                          }
                        />
                      </button>
                    )}
                    {data.pronouns && (
                      <span className={styles.pronouns}>({data.pronouns})</span>
                    )}
                  </div>
                  {(data.jobTitle || data.department) && (
                    <div className={styles.roleRow}>
                      {data.jobTitle && <span>{data.jobTitle}</span>}
                      {data.jobTitle && data.department && (
                        <span className={styles.dot}>·</span>
                      )}
                      {data.department && <span>{data.department.name}</span>}
                    </div>
                  )}
                  <div className={styles.presenceRow}>
                    <span
                      className={styles.presenceLabel}
                      style={{ color: presenceColor }}
                    >
                      {data.presence
                        ? PRESENCE_LABELS[data.presence.status]
                        : "Status unknown"}
                    </span>
                    {data.presence?.statusText && (
                      <span className={styles.statusText}>
                        {data.presence.statusEmoji
                          ? `${data.presence.statusEmoji} `
                          : ""}
                        {data.presence.statusText}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {data.overview && (
                <p className={styles.overview}>{data.overview}</p>
              )}

              <div className={styles.section}>
                <div className={styles.row}>
                  <Mail size={13} className={styles.rowIcon} />
                  <a href={`mailto:${data.email}`} className={styles.rowLink}>
                    {data.email}
                  </a>
                </div>
                <div className={styles.row}>
                  <Briefcase size={13} className={styles.rowIcon} />
                  <span>
                    {data.organization.name} · ID {data.employeeId}
                  </span>
                </div>
                {(data.workingLocation || data.timezone) && (
                  <div className={styles.row}>
                    <MapPin size={13} className={styles.rowIcon} />
                    <span>
                      {data.workingLocation}
                      {data.workingLocation && data.timezone ? " · " : ""}
                      {data.timezone}
                      {nowInTz ? ` (${nowInTz} local)` : ""}
                    </span>
                  </div>
                )}
                {(data.workingHoursStart || data.workingHoursEnd) && (
                  <div className={styles.row}>
                    <Clock size={13} className={styles.rowIcon} />
                    <span>
                      {data.workingHoursStart ?? "?"}–
                      {data.workingHoursEnd ?? "?"}
                      {data.workingDays.length > 0
                        ? ` · ${data.workingDays.join(", ")}`
                        : ""}
                    </span>
                  </div>
                )}
                {data.manager && (
                  <div className={styles.row}>
                    <UsersIcon size={13} className={styles.rowIcon} />
                    <span>
                      Reports to {data.manager.firstName}{" "}
                      {data.manager.lastName}
                    </span>
                  </div>
                )}
                {(data.directReportsCount > 0 || data.colleagueCount > 0) && (
                  <div className={styles.row}>
                    <Network size={13} className={styles.rowIcon} />
                    <span>
                      {data.directReportsCount > 0
                        ? `${data.directReportsCount} direct report${data.directReportsCount === 1 ? "" : "s"}`
                        : ""}
                      {data.directReportsCount > 0 && data.colleagueCount > 0
                        ? " · "
                        : ""}
                      {data.colleagueCount > 0
                        ? `${data.colleagueCount} colleague${data.colleagueCount === 1 ? "" : "s"}`
                        : ""}
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.actions}>
                {!isSelf && (
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={goToChat}
                  >
                    <MessageSquare size={14} /> Message
                  </button>
                )}
                {isSelf && (
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={goToChat}
                  >
                    <StickyNote size={14} /> Notes to Self
                  </button>
                )}
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => {
                    setOpen(false);
                    router.push(
                      isSelf
                        ? "/profile#org-chart"
                        : `/profile?userId=${data.userId}#org-chart`,
                    );
                  }}
                >
                  <Network size={14} /> Org chart
                </button>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => {
                    setOpen(false);
                    router.push(
                      isSelf ? "/profile" : `/profile?userId=${data.userId}`,
                    );
                  }}
                >
                  <UserIcon size={14} />{" "}
                  {isSelf ? "View profile" : "Full profile"}
                </button>
              </div>

              {isSelf && (
                <div className={styles.footer}>
                  <button
                    type="button"
                    className={styles.footerBtn}
                    onClick={() => {
                      setOpen(false);
                      window.location.assign("http://localhost:3005/oidc/account");
                    }}
                  >
                    <Settings size={14} /> Account Center
                  </button>
                  <button
                    type="button"
                    className={styles.footerBtn}
                    onClick={() => {
                      setOpen(false);
                      client.get(`/people/me/export`).then((exported: any) => {
                        const blob = new Blob(
                          [JSON.stringify(exported, null, 2)],
                          {
                            type: "application/json",
                          },
                        );
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "my-profile-data.json";
                        a.click();
                        URL.revokeObjectURL(url);
                      });
                    }}
                  >
                    <Download size={14} /> Export my data
                  </button>
                  {onSignOut && (
                    <button
                      type="button"
                      className={`${styles.footerBtn} ${styles.footerBtnDanger}`}
                      onClick={() => {
                        setOpen(false);
                        onSignOut();
                      }}
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
