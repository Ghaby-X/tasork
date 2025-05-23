'use client'

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const page = () => {
    const searchParams = useSearchParams();
    const authCode = searchParams.get('code');
    const router = useRouter()
    const [data, setData] = useState<any>()

    const tokenUrl = process.env.NEXT_PUBLIC_API_URL + `/auth/token?code=${authCode}`

    useEffect(() => {
        fetch(tokenUrl, {credentials: 'include'})
            .then((res) => {
                if (!res.ok) {
                        // If the response status is not OK, attempt to extract error details
                        return res.json().then((errorData) => {
                            // Create a custom error object with status and message from API response
                            console.log(errorData)
                            const error = new Error(`HTTP Error ${res.status}: ${errorData.error || 'Unknown error'}`);
                            (error as any).status = res.status;
                            (error as any).details = errorData; // Include the response body error details
                            throw error;
                        });
                    }
                    return res.json();})
            .then((res) => setData(res))
            .catch(error => {
                router.push("/")
                console.log(error)
            })
    }, [authCode])
    console.log(data)


    // parse the id_token to get email, username, tenantName, tenantID, userID
    if (data?.error) {
        console.log(data.error)
    }

    return (
        <div>Welcome to this page</div>
    )
}

export default page