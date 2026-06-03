import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ResetConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ResetConfirmDialog({ open, onOpenChange, onConfirm }: ResetConfirmDialogProps) {
  const [confirming, setConfirming] = useState(false)

  function handleConfirm() {
    setConfirming(true)
    onConfirm()
    setConfirming(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset &amp; Re-Allocate</DialogTitle>
          <DialogDescription>
            คุณแน่ใจไหม? การแก้ไข manual ทั้งหมดจะหายไป และระบบจะรัน auto-allocation ใหม่ทั้งหมด
          </DialogDescription>
        </DialogHeader>
        <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mt-1">
          Credit limit ที่คุณปรับไว้จะยังคงอยู่ — เฉพาะผลการจัดสรรเท่านั้นที่จะถูก reset
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={confirming}
            onClick={handleConfirm}
          >
            Reset &amp; Re-Allocate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
