import { prisma } from "@repo/prisma/client"
import { headers } from "next/headers";
import { auth } from "../../lib/auth"
import Link from "next/link";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


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
    <div className='h-screen w-full flex items-start justify-start px-10 py-20'>
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
        <div className="flex flex-wrap mt-5">
            {
              data.length != 0 ? data.map(workflow => (
                <Card key={workflow.id}>
                  <Link href={`/workflow/${workflow.id}`}>
                  <CardContent>
                    <CardTitle>
                      {workflow.name}
                    </CardTitle>
                  </CardContent>
                  </Link>
                </Card>
              )) : <p className="text-xl mt-30">No workflows found..</p>
            }
        </div>
      </div>
    </div>
  )
}