"use client";

import React, { type ReactNode } from "react";
import { AlertCircle, RefreshCw, AlertTriangle, ShieldAlert, WifiOff } from "lucide-react";
import styles from "./FinanceErrorBoundary.module.css";

export interface FinanceErrorStateProps {
  error: Error | any;
  title?: string;
  moduleName?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function FinanceErrorState({
  error,
  title,
  moduleName,
  onRetry,
  isRetrying = false,
}: FinanceErrorStateProps) {
  const displayTitle = title || (moduleName ? `Failed to load ${moduleName} records` : "Failed to load financial records");
  const status = error?.status || error?.statusCode || error?.response?.status;
  const is404 = status === 404;
  const is403 = status === 403;
  const isNetwork = error?.message?.includes("network") || error?.message?.includes("fetch");

  let Icon = AlertCircle;
  let defaultMessage = "A system error prevented loading financial data from the server.";
  let badgeText = "Service Error";

  if (is404) {
    Icon = AlertTriangle;
    defaultMessage = "The requested financial endpoint is currently unavailable on the server.";
    badgeText = "HTTP 404 Unavailable";
  } else if (is403) {
    Icon = ShieldAlert;
    defaultMessage = "You do not have permission to access financial records for this scope or entity.";
    badgeText = "HTTP 403 Forbidden";
  } else if (isNetwork) {
    Icon = WifiOff;
    defaultMessage = "Unable to connect to the finance service. Please verify your connection.";
    badgeText = "Connection Offline";
  }

  const message = error?.message || error?.error || defaultMessage;

  return (
    <div className={styles.errorContainer} role="alert" aria-live="assertive">
      <div className={styles.errorHeader}>
        <div className={styles.iconWrap}>
          <Icon size={20} className={styles.errorIcon} aria-hidden />
        </div>
        <div className={styles.titleWrap}>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>{badgeText}</span>
            <span className={styles.disclaimer}>Financial data is withheld to prevent unverified reporting</span>
          </div>
          <h3 className={styles.title}>{displayTitle}</h3>
          <p className={styles.message}>{message}</p>
        </div>
      </div>

      {onRetry && (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.retryBtn}
            onClick={onRetry}
            disabled={isRetrying}
          >
            <RefreshCw size={14} className={isRetrying ? styles.spinning : ""} aria-hidden />
            <span>{isRetrying ? "Retrying..." : "Retry Request"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class FinanceErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Report to logger or observability provider
    console.error("FinanceErrorBoundary caught:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <FinanceErrorState
          error={this.state.error}
          title={this.props.fallbackTitle || "Application error in Finance workspace"}
          onRetry={this.handleReset}
        />
      );
    }
    return this.props.children;
  }
}
