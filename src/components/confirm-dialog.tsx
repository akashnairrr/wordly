"use client"

import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogContentText from "@mui/material/DialogContentText"
import DialogTitle from "@mui/material/DialogTitle"
import { useState } from "react"
import { C } from "@/theme"

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  title: string
  body: React.ReactNode
  confirmLabel: string
  onConfirm: () => void
  /** Red confirm button, for actions that delete something. */
  destructive?: boolean
}

/** Modal confirmation, opened by the caller (focus trapping and Esc handled by MUI). */
export function ConfirmModal({ open, onClose, title, body, confirmLabel, onConfirm, destructive }: ConfirmModalProps) {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="confirm-title">
      <DialogTitle id="confirm-title" variant="h2" sx={{ fontSize: 24 }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText component="div" sx={{ color: C.muted }}>
          {body}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="outlined" onClick={onClose} autoFocus>
          Cancel
        </Button>
        <Button
          color={destructive ? "error" : "primary"}
          onClick={() => {
            onClose()
            onConfirm()
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

interface ConfirmDialogProps {
  trigger: string
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
}

/** A trigger button plus a destructive confirmation. */
export function ConfirmDialog({ trigger, title, body, confirmLabel, onConfirm }: ConfirmDialogProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="text" onClick={() => setOpen(true)}>
        {trigger}
      </Button>
      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        body={body}
        confirmLabel={confirmLabel}
        onConfirm={onConfirm}
        destructive
      />
    </>
  )
}
