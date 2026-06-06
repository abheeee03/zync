import { prisma } from "@repo/prisma/client"
import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import WorkflowGrid from "@/components/workflow-grid";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";


export default async function Home() {
  
  const session = await auth.api.getSession({
      headers: await headers()
  })
  const data = await prisma.workflows.findMany({
    where: {
      userId: session?.user.id
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  
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
        <WorkflowGrid workflows={data} />
      </div>
    </div>
  )
}