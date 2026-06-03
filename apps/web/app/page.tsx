import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function page() {
  return <>
  <div className="fixed w-full px-30 py-5 flex items-center justify-between">
    <h1 className="text-xl">
    zync
    </h1>
    <Button>
      <Link href={'/home'}>
      Get Started
      </Link>
    </Button>
  </div>
  <div className="min-h-screen w-full">
    <div className="h-screen w-full flex items-center justify-center">
       <h1 className="text-5xl"> 
         Automate Everything
        </h1>
    </div>
  </div>
  </> 
}
