"use client";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useState } from "react";
import { C } from "@/theme";

/** A trigger button plus a modal confirmation (focus trapping and Esc handled by MUI). */
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
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="text" onClick={() => setOpen(true)}>
        {trigger}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="confirm-title">
        <DialogTitle id="confirm-title" variant="h2" sx={{ fontSize: 24 }}>
          {title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: C.muted }}>{body}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" onClick={() => setOpen(false)} autoFocus>
            Cancel
          </Button>
          <Button
            color="error"
            onClick={() => {
              setOpen(false);
              onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
