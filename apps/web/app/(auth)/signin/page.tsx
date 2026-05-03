"use client"
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

function SignUp() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()
  const handleSignup = async () => {
    console.log(password, email);
    await authClient.signIn.email({
      email: email,
      password: password,
      callbackURL: '/home'
    }, {
      onSuccess: () => {
        router.push('/home')
      }
    })
  }
  return (
    <div className='h-screen w-full flex items-center justify-center'>
      <Card>
        <CardContent>
          <Input onChange={(e) => {
            setEmail(e.target.value)
          }} placeholder='email' />
          <Input onChange={(e) => {
            setPassword(e.target.value)
          }} placeholder='password' />
          <Button onClick={handleSignup}>
            Signin
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default SignUp