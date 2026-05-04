import { NextResponse } from "next/server";

export function POST(){
    console.log("req come to health webhook");
    return NextResponse.json({
        message: "OK"
    })
}