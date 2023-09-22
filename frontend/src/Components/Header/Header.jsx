import React from 'react';
import Link from "next/link";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar,Container,Nav } from 'react-bootstrap';
//import NavDropdown from 'react-bootstrap/NavDropdown';
import { useRouter } from "next/router";
const Header =(props) =>{
  const router = useRouter();
    return (
      <>
        <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
          <Container>
          <Navbar.Brand href={'/home'}>The Land Cart</Navbar.Brand>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="me-auto">
              <Link href={'/home'}><a className={router.pathname == "/home" ? "nav-link active" : "nav-link"}>Home</a></Link>
              <Link href="#"><a className="nav-link">Pricing</a></Link>
              {/* <NavDropdown title="Dropdown" id="collasible-nav-dropdown">
                <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
                <NavDropdown.Item href="#action/3.2">Another action</NavDropdown.Item>
                <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item href="#action/3.4">Separated link</NavDropdown.Item>
              </NavDropdown> */}
            </Nav>
            <Nav>
              <Link href={'/login'}><a className={router.pathname == "/login" ? "nav-link active" : "nav-link"}>SignIn</a></Link>
              <Link href={'/register'}><a className={router.pathname == "/register" ? "nav-link active" : "nav-link"}>SignUp</a></Link>
            </Nav>
          </Navbar.Collapse>
          </Container>
        </Navbar>
      </>
    )
  
}
export default Header;