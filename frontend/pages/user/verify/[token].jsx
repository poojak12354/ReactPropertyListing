import { useRouter } from "next/router";

const Verify = () => {
    const router = useRouter();
    console.log('useremail',router.query);
    return (
        <div className="list-container">
            User Profile page
        </div>
    )
}

export default Verify;