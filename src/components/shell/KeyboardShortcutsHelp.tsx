"use client";

import type { FC } from "react";
import { FINANCE_SHORTCUTS } from "@/hooks/useFinanceKeyboard";
import {
  KeyboardShortcutsHelp as KeyboardShortcutsHelpUI,
} from "@kannan19302/ui/platforms/business-suite";

export interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsHelp: FC<KeyboardShortcutsHelpProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <KeyboardShortcutsHelpUI
      isOpen={isOpen}
      onClose={onClose}
      shortcuts={FINANCE_SHORTCUTS}
      title="Finance Workspace Keyboard Shortcuts"
    />
  );
};

export default KeyboardShortcutsHelp;
