import React,{ useState, useRef,useEffect } from 'react'
import { Container,Table } from 'react-bootstrap';
import {authInitialProps} from '../../../lib/auth';
import { useRouter } from "next/router";
import Link from "next/link";

const PropertiesList = (props) => {
    const router = useRouter();
    console.log('set props', props);
    // const [sessionData, setSessionData] = useState();
    // console.log('sessionData',sessionData)
    useEffect(() => {
        // let isAuthenticated = authInitialProps(true);
        // if(!isAuthenticated){
        //     router.push("/login");
        // }
        // console.log('isAuthenticated',isAuthenticated);
    }, []);
    return (
        <Container>
            <Link href={'/user/add-property'}><a class="btn btn-outline-secondary">Add Property</a></Link>
            <Table striped bordered hover variant="dark">
                <thead>
                    <tr>
                    <th>#</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Username</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                    <td>1</td>
                    <td>Mark</td>
                    <td>Otto</td>
                    <td>@mdo</td>
                    </tr>
                    <tr>
                    <td>2</td>
                    <td>Jacob</td>
                    <td>Thornton</td>
                    <td>@fat</td>
                    </tr>
                    <tr>
                    <td>3</td>
                    <td colSpan={2}>Larry the Bird</td>
                    <td>@twitter</td>
                    </tr>
                </tbody>
            </Table>
        </Container>
    )
}
export default PropertiesList;