"use client"

import { useParams, usePathname } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import axios from "axios"
import { Input } from "./ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function HeaderTitle() {
  const pathname = usePathname()
  const params = useParams()
  const [name, setName] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (pathname.includes("/workflow/") && params.id) {
      const fetchWorkflowName = async (id: string) => {
        try {
          const response = await axios.get(`/api/workflow/${id}`)
          const workflowName = response.data.name || "Untitled"
          setName(workflowName)
          setEditValue(workflowName)
        } catch (error) {
          console.error("Failed to fetch workflow name", error)
          setName("Workflow")
          setEditValue("Workflow")
        }
      }
      fetchWorkflowName(params.id as string)
    } else {
      setName(null)
      setIsEditing(false)
    }
  }, [pathname, params.id])

  const handleSaveRequest = () => {
    // Timeout prevents multiple fires if Enter key and onBlur happen together
    setTimeout(() => {
      if (!editValue.trim() || editValue === name) {
        setIsEditing(false)
        setEditValue(name || "")
        return
      }
      setIsConfirmOpen(true)
    }, 10)
  }

  const confirmSave = async () => {
    setIsSaving(true)
    try {
      await axios.patch(`/api/workflow/${params.id}`, { name: editValue })
      setName(editValue)
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update workflow name", error)
      setEditValue(name || "")
    } finally {
      setIsSaving(false)
      setIsConfirmOpen(false)
    }
  }

  const cancelSave = () => {
    setEditValue(name || "")
    setIsEditing(false)
    setIsConfirmOpen(false)
  }

  const isWorkflowPage = pathname.includes("/workflow/") && params.id

  if (pathname === "/home") return "Home"
  if (pathname === "/templates") return "Templates"
  if (pathname === "/how-to-use") return "How to Use"
  if (pathname === "/help") return "Help"
  if (pathname === "/credentials") return "Credentials"
  
  if (isWorkflowPage) {
    if (!name) return "Loading..."
    
    return (
      <>
        {isEditing ? (
          <Input
            ref={inputRef}
            className="h-7 w-auto min-w-[150px] px-2 text-sm inline-block"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSaveRequest}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveRequest()
              if (e.key === 'Escape') {
                setEditValue(name || "")
                setIsEditing(false)
              }
            }}
            autoFocus
          />
        ) : (
          <span 
            className="cursor-text hover:text-foreground transition-colors"
            onClick={() => setIsEditing(true)}
          >
            {name}
          </span>
        )}

        <Dialog open={isConfirmOpen} onOpenChange={(open) => {
          if (!open) cancelSave()
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save changes?</DialogTitle>
              <DialogDescription>
                Are you sure you want to rename this workflow to "{editValue}"?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={cancelSave} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={confirmSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return "Home"
}
