"use client";

import { useRef } from "react";

/** A trigger button plus a native modal <dialog> (focus trapping and Esc handled by the browser). */
export function ConfirmDialog({
  trigger,
  title,
  body,
  confirmLabel,
  onConfirm,
}: {
  trigger: string;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="btn btn-quiet" onClick={() => ref.current?.showModal()}>
        {trigger}
      </button>
      <dialog ref={ref} aria-labelledby="confirm-title">
        <h2 id="confirm-title" style={{ fontSize: 24 }}>
          {title}
        </h2>
        <p className="muted">{body}</p>
        <form method="dialog" className="row" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-outline" value="cancel" autoFocus>
            Cancel
          </button>
          <button
            className="btn"
            value="confirm"
            style={{ background: "var(--danger)", color: "var(--surface)" }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </form>
      </dialog>
    </>
  );
}
