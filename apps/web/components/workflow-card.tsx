"use client"
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import axios from 'axios'
import { HugeiconsIcon } from "@hugeicons/react"
import { 
    PencilEdit01Icon, 
    ArrowRight01Icon, 
    Delete01Icon, 
    ArrowUpRight
} from "@hugeicons/core-free-icons"
import { cn } from '@/lib/utils'

function WorkFlowCard({id, name, createdAt}: {id: string, name: string, createdAt: Date}) {
    const router = useRouter()
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
    const [newName, setNewName] = useState(name)
    const [isLoading, setIsLoading] = useState(false)

    const handleRename = async (e?: React.FormEvent | React.MouseEvent) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }
        if (!newName.trim() || newName === name) {
            setIsRenameDialogOpen(false)
            return
        }
        
        setIsLoading(true)
        try {
            await axios.patch(`/api/workflow/${id}`, { name: newName })
            router.refresh()
            setIsRenameDialogOpen(false)
        } catch (error) {
            console.error("Failed to rename workflow:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        if (!confirm("Are you sure you want to delete this workflow?")) return

        setIsLoading(true)
        try {
            await axios.delete(`/api/workflow/${id}`)
            router.refresh()
        } catch (error) {
            console.error("Failed to delete workflow:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className='relative group mb-10'>
            <div
                onClick={() => {
                    router.push(`/workflow/${id}`)
                }} 
                className='h-25 w-50 cursor-pointer flex flex-col items-start justify-between border-accent shadow-2xl border-t shadow-white rounded-xl bg-background px-5 py-5 text-left transition-all duration-200 hover:bg-accent/10 hover:shadow-md active:scale-[0.98]'
            >
                <h1 className='text-md font-medium truncate w-full'>
                    {name}
                </h1>
                <p className='text-xs text-muted-foreground'>{new Date(createdAt).toLocaleDateString()}</p>
            </div>

            {/* Animated Palette */}
            <div className={cn(
                "absolute -bottom-12 left-1/2 -translate-x-1/2 translate-y-full",
                "flex items-center gap-1 p-1 bg-background/80 backdrop-blur-md border border-accent rounded-full shadow-lg z-10",
                "opacity-0 scale-90 -translate-y-2 pointer-events-none",
                "group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 group-hover:pointer-events-auto",
                "transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] delay-150"
            )}>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full hover:bg-accent/20 active:scale-90 transition-transform" 
                    onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/workflow/${id}`)
                    }}
                    title="Go to workflow"
                >
                    <HugeiconsIcon icon={ArrowUpRight} size={16} strokeWidth={2} />
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full hover:bg-accent/20 active:scale-90 transition-transform" 
                    onClick={(e) => {
                        e.stopPropagation()
                        setIsRenameDialogOpen(true)
                    }}
                    title="Rename"
                >
                    <HugeiconsIcon icon={PencilEdit01Icon} size={16} strokeWidth={2} />
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive active:scale-90 transition-transform" 
                    onClick={handleDelete}
                    disabled={isLoading}
                    title="Delete"
                >
                    <HugeiconsIcon icon={Delete01Icon} size={16} strokeWidth={2} />
                </Button>
            </div>

            <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                <DialogContent onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle>Rename Workflow</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Workflow name"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleRename()
                                }
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)} disabled={isLoading}>Cancel</Button>
                        <Button onClick={() => handleRename()} disabled={isLoading || !newName.trim()}>
                            {isLoading ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default WorkFlowCard
