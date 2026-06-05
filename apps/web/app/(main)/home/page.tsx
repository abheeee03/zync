import { prisma } from "@repo/prisma/client"
import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import WorkFlowCard from "@/components/workflow-card";


export default async function Home() {
  
  const session = await auth.api.getSession({
      headers: await headers()
  })
  const data = await prisma.workflows.findMany({
    where: {
      userId: session?.user.id
    }
  })
  console.log(data);
  
  return (
    <div className=''>
      <div className="h-full w-full">
        <div className="flex w-full items-center justify-between">
          <h1>
             Workflows
          </h1>
          <Button>
          <Link href={'/workflow'}>
            New Workflow
          </Link>
          </Button>
        </div>
        <div className="flex flex-wrap mt-5 gap-5">
            {
              data.length != 0 ? data.map(workflow => (
                    <WorkFlowCard
                    key={workflow.id}
                    id={workflow.id}
                    name={workflow.name || "Untitled"}
                    createdAt={workflow.createdAt}
                    />
              )) : <p className="text-xl mt-30">No workflows found..</p>
            }
        </div>
      </div>
    </div>
  )
}