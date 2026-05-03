import { prisma } from "@repo/prisma/client";
import { headers } from "next/headers";
import { auth } from "../../lib/auth"
import { redirect } from "next/navigation";
export default async function createWorkflow(){
    const session = await auth.api.getSession({
          headers: await headers()
    })
    if(!session){
        redirect('/signin')
    }
    const data = await prisma.workflows.create({
        data: {
            userId: session.user.id
        }, select: {
            id: true
        }
    })
    redirect(`/workflow/${data.id}`)
}