import { prisma } from "@repo/prisma/client";
import { NextResponse } from "next/server";

export async function GET(){
    const availableActions = await prisma.availableActions.findMany();
    const availableTriggers = await prisma.availableTriggers.findMany();
    
    return NextResponse.json({
        actions: availableActions,
        triggers: availableTriggers
    })
}