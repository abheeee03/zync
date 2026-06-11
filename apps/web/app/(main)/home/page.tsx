"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import WorkflowGrid from "@/components/workflow-grid"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon } from "@hugeicons/core-free-icons"
import Loader from "@/components/loader"
import axios from "axios"

export default function Home() {
  const [workflows, setWorkflows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await axios.get("/api/workflows")
        setWorkflows(response.data)
      } catch (error) {
        console.error("Failed to fetch workflows", error)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkflows()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <div className=''>
      <div className="h-full w-full">
        <div className="flex w-full items-center justify-between">
          <h1>
             Workflows
          </h1>
          <Button
          variant={"accent"}
          asChild>
            <Link 
              className="flex gap-2 items-center justify-center"
              href={'/workflow'}>
                New Workflow 
                <HugeiconsIcon icon={PlusSignIcon} />
            </Link>
          </Button>
        </div>
        <WorkflowGrid workflows={workflows} />
      </div>
    </div>
  )
}
