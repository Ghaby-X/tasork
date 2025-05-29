import { IoMdArrowForward } from "react-icons/io";
import Link from "next/link"

// get login url from backend
const getLoginURL = async () => {
  const base_url = process.env.NEXT_PUBLIC_API_URL
  const login_url = base_url + "/auth/login"

  try {
    const response = await fetch(login_url);
    if (!response.ok) {
      throw new Error(`failed to load login page`)
    }

    console.log(response)

    const res = await response.json()
    console.log(res)
    return res
  } catch (error) {
    console.error("Error fetching login URL:", error)
    return
  }
}

const Page = async () => {
  // gets login url from server
  const { login_url } = await getLoginURL()

  console.log(login_url)

  return (
    <div className="flex items-center justify-center h-screen w-screen flex-col gap-2">
      <h1 className="text-7xl text-center">Welcome to <span className="text-blue-600">tasork</span></h1>
      <p className="text-xl text-gray-500 mt-2 text-center max-w-2xl mb-4">
        A task management system to help your team organize, and prioritize your tasks
      </p>
      <div className="flex gap-4 mt-6">
        <Link href={login_url}>
          <button className="rounded-full text-xl h-12 bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            <div className="flex gap-3 items-center px-6 py-2">
              <p>Get Started</p>
              <IoMdArrowForward />
            </div>
          </button>
        </Link>
      </div>
    </div>
  )
}

export default Page