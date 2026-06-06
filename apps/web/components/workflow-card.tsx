"use client"
import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'
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
import { sileo } from "sileo"
import { HugeiconsIcon } from "@hugeicons/react"
import { 
    PencilEdit01Icon, 
    Delete01Icon, 
    ArrowUpRight
} from "@hugeicons/core-free-icons"
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

function WorkFlowCard({id, name, createdAt}: {id: string, name: string, createdAt: Date}) {
    const router = useRouter()
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
    const [newName, setNewName] = useState(name)
    const [isLoading, setIsLoading] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const handleMouseEnter = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
            hoverTimeoutRef.current = null
        }
        setIsHovered(true)
    }

    const handleMouseLeave = () => {
        // Keep active for slightly longer (300ms) after user stops hovering
        hoverTimeoutRef.current = setTimeout(() => {
            setIsHovered(false)
        }, 300)
    }

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
        const deletePromise = axios.delete(`/api/workflow/${id}`).then(() => {
            router.refresh()
        }).finally(() => {
            setIsLoading(false)
        })

        sileo.promise(deletePromise, {
            loading: { title: "Deleting Workflow..." },
            success: { title: "Workflow Deleted" },
            error: { title: "Failed, try again after some time!" },
        })
    }

    return (
        <div 
            className='relative mb-10'
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <motion.div
                onClick={() => {
                    router.push(`/workflow/${id}`)
                }} 
                whileTap={{ scale: 0.98 }}
                className='h-25 w-50 cursor-pointer flex flex-col items-start justify-between border-accent shadow-2xl border-t shadow-white rounded-xl bg-background px-5 py-5 text-left transition-all duration-200 hover:bg-accent/10 hover:shadow-md'
            >
                <h1 className='text-md font-medium truncate w-full'>
                    {name}
                </h1>
                <p className='text-xs text-muted-foreground'>{new Date(createdAt).toLocaleDateString()}</p>
            </motion.div>

            {/* Bridge to fill the gap and keep hover active */}
            {isHovered && (
                <div className="absolute top-full left-0 right-0 h-6 z-0" />
            )}

            {/* Animated Palette */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10, x: "-50%" }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, scale: 0.9, y: 10, x: "-50%" }}
                        transition={{ 
                            duration: 0.2, 
                            ease: [0.23, 1, 0.32, 1] 
                        }}
                        className={cn(
                            "absolute top-[calc(100%+0.5rem)] left-1/2",
                            "flex items-center gap-1 p-1 bg-background/80 backdrop-blur-md border border-accent rounded-full shadow-lg z-10"
                        )}
                    >
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full hover:bg-accent/20 active:scale-95 transition-transform" 
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
                            className="h-8 w-8 rounded-full hover:bg-accent/20 active:scale-95 transition-transform" 
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
                            className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive active:scale-95 transition-transform" 
                            onClick={handleDelete}
                            disabled={isLoading}
                            title="Delete"
                        >
                            <HugeiconsIcon icon={Delete01Icon} size={16} strokeWidth={2} />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

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
