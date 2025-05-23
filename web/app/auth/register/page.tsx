'use client'

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useState } from "react"

const page = () => {
  const [tenantName, setTenantName] = useState<string>("")
  const [error, setError] = useState<string>("")
  const router = useRouter()

  // Handle input change and update state
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTenantName(e.target.value)
  }

  // Handle button click
  const handleClick = () => {
    if (!tenantName || (tenantName && tenantName.length < 3)) {
      setError("team name should be greater than 3")
    } else {
      console.log(`Team Name: ${tenantName}`)
      router.push('/dashboard')
    }
  }

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to Tasork</CardTitle>
          <CardDescription>Register the name of your team</CardDescription>
        </CardHeader>
        <CardContent>
          <Input 
            type="text" 
            placeholder="Team name" 
            value={tenantName}
            onChange={handleChange}  
          />
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>} 
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleClick}>Continue</Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default page
