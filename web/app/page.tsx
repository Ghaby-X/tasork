import { Button } from "@/components/ui/button"
import { IoMdArrowForward } from "react-icons/io";
import Link from "next/link"

// get login url from backend
const getLoginURL = async () => {
  const base_url = process.env.API_URL
  const login_url = base_url + "/auth/login"

  const response = await fetch(login_url);
  if (!response.ok) {
    throw new Error(`failed to load login page`)
  }

  const res = await response.json()
  return res

}



const Page = async () => {
  // gets login url from server
  try {
    var { login_url } = await getLoginURL()
  }
  catch (error) {
    console.error(error)
  }


  return <>
    <div className="flex items-center justify-center h-screen w-screen flex-col gap-2">
      <h1 className="text-7xl text-center">Welcome to <span className="text-primary">tasork</span></h1>
      <p className="text-xl text-muted-foreground mt-2 text-center max-w-2xl mb-4">
        A task management system to help your team organize, and prioritize your tasks
      </p>
      <Link href={login_url}>
        <Button className="mt-6 rounded-full text-xl h-12">
          <div className="flex gap-3 items-center px-6">
            <p className="">Get Started</p>
            <IoMdArrowForward />
          </div>
        </Button>
      </Link>
    </div>
  </>
}

export default Page