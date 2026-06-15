"use client"
import { TwitterIcon } from '@/components/icons'
import Logo from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Mail01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'

function NotFound() {
    const router = useRouter();
    return (
        <>
            <button
                onClick={() => {
                    router.push('/')
                }}
                className="w-full text-2xl fixed py-5 flex items-center justify-center gap-2">
                <Logo /> zync
            </button>
            <div className='h-screen w-full flex flex-col items-center justify-center gap-4'>
                <h1 className='text-5xl'>Page not Found.</h1>
                <p className='text-xl max-w-sm text-accent text-center'>Looks like you've lost, The page you're looking for doesn't exist.</p>
                <Button
                    onClick={() => {
                        router.push('/home')
                    }}
                    variant={"accent"}
                >
                    Back to Home
                </Button>
            </div>
            <div className="fixed bottom-5 flex flex-col items-center justify-center w-full gap-2">
                <h3 className='text-md'>
                    Need Help? Reach out to us at
                </h3>
                <div className="">
                    <Link
                        href={'https://x.com/_AbhayHere'}
                    >
                        <Button variant={"ghost"}>
                            <TwitterIcon />
                        </Button>
                    </Link>
                    {/* todo - replace with email  */}
                    <Link
                        href={'/home'}
                    >
                        <Button variant={"ghost"}>
                            <HugeiconsIcon icon={Mail01Icon} />
                        </Button>
                    </Link>
                </div>

            </div>
        </>
    )
}

export default NotFound