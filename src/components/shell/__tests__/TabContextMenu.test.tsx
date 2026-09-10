// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TabContextMenu, type ContextMenuTarget } from "../TabContextMenu";

describe("TabContextMenu", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders all rich options when right-clicking on a tab", () => {
    const handleCloseTab = vi.fn();
    const handleCloseOtherTabs = vi.fn();
    const handleCloseTabsToRight = vi.fn();
    const handleCloseTabsToLeft = vi.fn();
    const handleCloseAllTabs = vi.fn();
    const handleDuplicateTab = vi.fn();
    const handleTogglePinTab = vi.fn();
    const handleMoveTab = vi.fn();
    const handleReloadTab = vi.fn();
    const handleReopenClosedTab = vi.fn();
    const handleClose = vi.fn();

    const target: ContextMenuTarget = {
      type: "tab",
      tabId: "tab-gl",
      tabTitle: "General ledger",
      tabHref: "/finance/gl",
      pinned: false,
      closable: true,
      index: 1,
      totalTabs: 3,
    };

    render(
      <TabContextMenu
        target={target}
        position={{ x: 150, y: 80 }}
        onClose={handleClose}
        onCloseTab={handleCloseTab}
        onCloseOtherTabs={handleCloseOtherTabs}
        onCloseTabsToRight={handleCloseTabsToRight}
        onCloseTabsToLeft={handleCloseTabsToLeft}
        onCloseAllTabs={handleCloseAllTabs}
        onDuplicateTab={handleDuplicateTab}
        onTogglePinTab={handleTogglePinTab}
        onMoveTab={handleMoveTab}
        onReloadTab={handleReloadTab}
        onReopenClosedTab={handleReopenClosedTab}
      />
    );

    // Verify all expected action items exist
    expect(screen.getByRole("menu", { name: /^Tab options for General ledger$/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /Reload tab/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /^Duplicate tab$/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /^Pin tab$/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /^Move tab left$/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /^Move tab right$/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /Close tab\s+Ctrl\+W/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /^Close other tabs$/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /^Close tabs to the right$/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /^Close tabs to the left$/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /^Close all tabs$/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /Reopen closed tab/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /^Copy tab link$/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /^Open in new window$/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /^Bookmark tab$/i })).toBeDefined();

    // Trigger duplicate tab
    fireEvent.click(screen.getByRole("menuitem", { name: /^Duplicate tab$/i }));
    expect(handleDuplicateTab).toHaveBeenCalledWith("tab-gl");
    expect(handleClose).toHaveBeenCalled();
  });

  it("handles pinned tabs: shows unpin option and disables close tab", () => {
    const handleCloseTab = vi.fn();
    const handleTogglePinTab = vi.fn();
    const handleClose = vi.fn();

    const target: ContextMenuTarget = {
      type: "tab",
      tabId: "tab-home",
      tabTitle: "Overview",
      tabHref: "/finance",
      pinned: true,
      closable: false,
      index: 0,
      totalTabs: 3,
    };

    render(
      <TabContextMenu
        target={target}
        position={{ x: 100, y: 100 }}
        onClose={handleClose}
        onCloseTab={handleCloseTab}
        onTogglePinTab={handleTogglePinTab}
      />
    );

    // Shows Unpin tab
    const unpinBtn = screen.getByRole("menuitem", { name: /^Unpin tab$/i });
    expect(unpinBtn).toBeDefined();
    fireEvent.click(unpinBtn);
    expect(handleTogglePinTab).toHaveBeenCalledWith("tab-home");

    // Close tab should be disabled for pinned tab
    const closeBtn = screen.getByRole("menuitem", { name: /Close tab\s+Ctrl\+W/i });
    expect(closeBtn.hasAttribute("disabled")).toBe(true);
  });

  it("renders tab strip options for blank tab strip right-click", () => {
    const handleNewTab = vi.fn();
    const handleReopenClosedTab = vi.fn();
    const handleCloseAllTabs = vi.fn();
    const handleClose = vi.fn();

    const target: ContextMenuTarget = {
      type: "tabstrip",
      canReopen: true,
      reopenTitle: "Accounts payable",
    };

    render(
      <TabContextMenu
        target={target}
        position={{ x: 500, y: 40 }}
        onClose={handleClose}
        onNewTab={handleNewTab}
        onReopenClosedTab={handleReopenClosedTab}
        onCloseAllTabs={handleCloseAllTabs}
      />
    );

    expect(screen.getByRole("menu", { name: /Tab strip options/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /^New tab$/i })).toBeDefined();

    const reopenBtn = screen.getByRole("menuitem", { name: /Reopen: Accounts payable/i });
    expect(reopenBtn).toBeDefined();
    fireEvent.click(reopenBtn);
    expect(handleReopenClosedTab).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();

    // Close all tabs button
    const closeAllBtn = screen.getByRole("menuitem", { name: /^Close all tabs$/i });
    fireEvent.click(closeAllBtn);
    expect(handleCloseAllTabs).toHaveBeenCalled();
  });

  it("closes on Escape key press", () => {
    const handleClose = vi.fn();
    render(
      <TabContextMenu
        target={{ type: "nav", href: "/finance/gl", label: "General ledger" }}
        position={{ x: 100, y: 100 }}
        onClose={handleClose}
      />
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(handleClose).toHaveBeenCalled();
  });
});
