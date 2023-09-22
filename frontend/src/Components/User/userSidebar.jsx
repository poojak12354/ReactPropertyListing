import React,{ useState, useRef } from 'react'
import Link from "next/link";
import { useRouter } from "next/router";

const Sidebar = () => {
    const router = useRouter();
    return (
        <>
            <ul>
                <li><Link href={'/user/profile'}><a className={router.pathname == "/user/profile" ? "nav-link active" : "nav-link"}>My Profile</a></Link></li>
                <li><Link href={'/user/properties'}><a className={router.pathname == "/user/properties" ? "nav-link active" : "nav-link"}>Properties</a></Link></li>
            </ul>
        </>
    )
}

export default Sidebar;