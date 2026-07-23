import * as React from "react";
import { cn } from "../lib/utils";
import { Overlay } from "./overlay";
import { Container } from "./container";

/**
 * ⚠️ STOPGAP COMPONENT — added to unblock a build, not a reviewed design.
 *
 * `agent-next-gen-v1` (see the welcome-modal comment block in
 * `AgentNextGenPage.tsx`) was written against a `Modal` component that
 * doesn't exist yet in this lyra-ui snapshot. This composes the real
 * `Overlay` + `Container variant="modal"` primitives to approximate the
 * intended spec (frosted "light" backdrop option, Radix-Dialog-backed
 * open/close, backdrop-click control, `overlayClassName` override) so the
 * app builds and renders for testing. It has NOT been design-reviewed:
 * `ariaTitle` is applied as an `aria-label` on the content card rather than
 * wired into Radix's own Dialog.Title (Overlay hardcodes an sr-only
 * "Overlay" title), so screen-reader announcement isn't fully correct yet.
 * Replace with a proper `Modal` implementation before shipping past a
 * usability-test build.
 */
export interface ModalProps {
  open?: boolean;
  onClose?: () => void;
  closeOnBackdropClick?: boolean;
  variant?: "dark" | "light";
  overlayClassName?: string;
  className?: string;
  ariaTitle?: string;
  children?: React.ReactNode;
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      open = false,
      onClose,
      closeOnBackdropClick = false,
      variant = "dark",
      overlayClassName,
      className,
      ariaTitle,
      children,
    },
    ref
  ) => (
    <Overlay
      variant={variant}
      open={open}
      onClose={onClose}
      closeOnBackdropClick={closeOnBackdropClick}
      className={overlayClassName}
    >
      <Container
        ref={ref}
        variant="modal"
        aria-label={ariaTitle}
        className={cn("max-h-[85vh] overflow-auto", className)}
      >
        {children}
      </Container>
    </Overlay>
  )
);
Modal.displayName = "Modal";

export { Modal };
