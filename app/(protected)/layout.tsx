
import { getCurrentUserAction } from "@/lib/actions/auth.action";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import React from "react";

export default async function layout({
    children,
}: {
    children: React.ReactNode;
}) {

      const user = await getCurrentUser();

      if (!user) {
        // If no user, redirect to login page
        redirect('/login');
      }

    //  const userdata = await getCurrentUserAction()

    //  console.log(userdata)


    return (<>
    {children}
    </>)
}