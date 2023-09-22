import React,{ useState, useRef } from 'react'
//import Image from '../PageComponent/Image'
import { Container, Row, Col, Form, Button, Image, InputGroup, Spinner, Toast, ToastContainer, Collapse } from 'react-bootstrap';
import {BsCheckCircleFill} from 'react-icons/bs';
import { useRouter } from "next/router";

const Register = () => {
    
    const [data, setData] = useState({
        token: '',
        message: '',
        msg_status: '',
        sendButton: '',
        resendButton: '',
        verifyButton: '',
        is_verified: 0,
        frm_validated: false,
        phone_empty: '',
        code_empty: '',
    });

    const router = useRouter();

    const [utype, setUtype] = useState();
    const [uemail, setUemail] = useState();
    const [ufname, setUfname] = useState();
    const [ulname, setUlname] = useState();
    const [uname, setUname] = useState();
    const [upass, setUpass] = useState();
    const [uphone, setUphone] = useState();

    const [passwordError, setPasswordError] = useState(false);

    const phoneInput = useRef();
    const verifyInput = useRef();


    const sendOTP = (event) => {
        let clickedButton = event.target.id;
        let goahead = true;
        setPasswordError(false);
        const passformat  = "^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$";
        const ph_format = /^(?:(?:\+|0{0,2})91(\s*|[\-])?|[0]?)?([6789]\d{2}([ -]?)\d{3}([ -]?)\d{4})$/;
        const form_elements = document.querySelectorAll(".required");
        form_elements.forEach((ele) => {
            if(!ele.value.trim()){
                ele.classList.add("is-invalid");
                goahead = false;
            } else {
                ele.classList.remove("is-invalid");
            }
        });
        
        if(!document.getElementById('agreeTerms').checked){
            document.getElementById('agreeTerms').classList.add('is-invalid');
            goahead = false;
        } else {
            document.getElementById('agreeTerms').classList.remove('is-invalid');
        }

        if(document.getElementById("userPassword").value.length > 0 && !document.getElementById("userPassword").value.match(passformat))
        {
            goahead = false;
            setPasswordError(true);
        }
        
        if(document.getElementById("userPhone").value.length == 0 || (document.getElementById("userPhone").value.length > 0 && !document.getElementById("userPhone").value.match(ph_format))){
            goahead = false;
            document.getElementById("userPhone").classList.add("is-invalid");
        } else {
            document.getElementById("userPhone").classList.remove('is-invalid');
        }
        
        if(goahead){
            let new_data = {...data};
            new_data.sendButton = clickedButton == "send" ? 'disabled' : '';
            new_data.resendButton = clickedButton == "resend" ? 'disabled' : '';
            setData(new_data);

            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: uemail,
                    username: uname,
                    phone: uphone,
                })
            };
            fetch(process.env.NEXT_PUBLIC_SERVER_URL+"/verify/user", requestOptions)
            .then((res) => res.json())
            .then((resData) => {
                console.log('data',resData);
                
                if(resData.status){
                    const requestOptions = {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone: phoneInput.current.value.trim()})
                    };
                    fetch(process.env.NEXT_PUBLIC_SERVER_URL+"/sendCode", requestOptions)
                    .then((res) => res.json())
                    .then((resData) => {
                        console.log('data',resData);
                        let new_data = {...data};
                        new_data.token = typeof resData.token != undefined ? resData.token : '';
                        new_data.message = resData.message;
                        new_data.msg_status = resData.statusCode;
                        new_data.sendButton = '';
                        new_data.resendButton = '';
                        setData(new_data);
                    }).catch(error => {
                        console.log('Form submit error', error);
                        let new_data = {...data};
                        new_data.sendButton = '';
                        new_data.resendButton = '';
                        new_data.message = 'Something went wrong!';
                        new_data.msg_status = '203',
                        setData(new_data);
                    });
                } else {
                    let new_data = {...data};
                    if(resData.message_email != ""){
                        new_data.message = resData.message_email;
                    } else if(resData.message_user != ""){
                        new_data.message = resData.message_user;
                    } else if(resData.message_phone != ""){
                        new_data.message = resData.message_phone;
                    } else {
                        new_data.message = resData.message;
                    }
                    new_data.msg_status = resData.statusCode;
                    new_data.sendButton = '';
                    new_data.resendButton = '';
                    setData(new_data);
                }
            }).catch(error => {
                console.log('Form submit error', error);
                let new_data = {...data};
                new_data.sendButton = '';
                new_data.resendButton = '';
                new_data.message = 'Something went wrong!';
                new_data.msg_status = '203',
                setData(new_data);
            });
        }
    };

    const verifyOTP = () => {
        let phone_num = phoneInput.current.value.trim();
        let code_num = verifyInput.current.value.trim();
        if(phone_num != "" && code_num != ""){
            let new_data = {...data};
            new_data.verifyButton = 'disabled';
            new_data.code_empty = '';
            setData(new_data);
            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone_num, code: code_num, token:data.token })
            };
            fetch(process.env.NEXT_PUBLIC_SERVER_URL+"/verifyCode/otp", requestOptions)
            .then((res) => res.json())
            .then((resData) => {
                if(resData.status){
                    let new_data = {...data};
                    new_data.message = '';
                    new_data.msg_status = resData.statusCode;
                    new_data.is_verified = typeof resData.vstatus != undefined && resData.vstatus == "approved" ? 1 : 0;
                    new_data.verifyButton = '';
                    setData(new_data);
                    const requestOptions = {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            role: utype,
                            email: uemail,
                            fname: ufname,
                            lname: ulname,
                            username: uname,
                            pass: upass,
                            phone: uphone,
                            is_verified: data.is_verified
                        })
                    };
                    fetch(process.env.NEXT_PUBLIC_SERVER_URL+"/add/user", requestOptions)
                    .then((res) => res.json())
                    .then((responseData) => {
                        let new_data = {...data};
                        new_data.message = resData.message;
                        new_data.msg_status = resData.statusCode;
                        new_data.is_verified = typeof resData.vstatus != undefined && resData.vstatus == "approved" ? 1 : 0;
                        new_data.verifyButton = '';
                        setData(new_data);
                        if(resData.status){
                            let uData = responseData.userData;
                            console.log('data',uData);
                            console.log('data',uData.id);

                            sessionStorage.setItem("userData", JSON.stringify(uData));
                            console.log(sessionStorage.getItem("userData"));
                            
                            router.push('/user/profile');
                        }
                    }).catch(error => {
                        console.log('Form submit error', error)
                        let new_data = {...data};
                        new_data.verifyButton = '';
                        new_data.message = 'Something went wrong!';
                        new_data.msg_status = '203',
                        setData(new_data);
                    });
                } else {
                    let new_data = {...data};
                    new_data.message = resData.message;
                    new_data.msg_status = resData.statusCode;
                    new_data.is_verified = typeof resData.vstatus != undefined && resData.vstatus == "approved" ? 1 : 0;
                    new_data.verifyButton = '';
                    setData(new_data);
                }
            })
            .catch(error => {
                console.log('Form submit error', error)
                let new_data = {...data};
                new_data.verifyButton = '';
                new_data.message = 'Something went wrong!';
                new_data.msg_status = '203',
                setData(new_data);
            });
        } else {
            let new_data = {...data};
            new_data.code_empty = code_num == "" ? 'is-invalid' : '';
            setData(new_data);
        }
    };

    const hideMessage = () => {
        let new_data = {...data};
        new_data.message = '';
        setData(new_data);
    };

    const validatInput = (ele) => {
        switch(ele.target.id){
            case "userPassword":
                const passformat  = "^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$";
                if(ele.target.value.length > 0 && !ele.target.value.match(passformat)) {
                    ele.target.classList.add("is-invalid");
                    setPasswordError(true);
                } else if(ele.target.value.trim().length == 0){
                    ele.target.classList.add("is-invalid");
                } else {
                    setPasswordError(false);
                    ele.target.classList.remove("is-invalid");
                }
            break;
            case "agreeTerms":
                if(!ele.target.checked){
                    ele.target.classList.add('is-invalid');
                } else {
                    ele.target.classList.remove('is-invalid');
                }
            break;
            case "userPhone":
                const ph_format = /^(?:(?:\+|0{0,2})91(\s*|[\-])?|[0]?)?([6789]\d{2}([ -]?)\d{3}([ -]?)\d{4})$/;
                if(!ele.target.value.match(ph_format) || ele.target.value.trim().length == 0){
                    ele.target.classList.add("is-invalid");
                } else {
                    ele.target.classList.remove('is-invalid');
                }
            break;
            default:
                if(ele.target.value.trim()){
                    ele.target.classList.remove("is-invalid");
                } else {
                    ele.target.classList.add("is-invalid");
                }
            break;
        }
    };

    return (
        <Container>
            <ToastContainer position="top-end" containerPosition="fixed">
                <Toast className="d-inline-block m-1" bg={data.msg_status == 200 ? 'success' : 'danger'} onClose={hideMessage} show={data.message ? true : false} delay={5000} autohide animation="true" transition={Collapse}>
                    <Toast.Header>
                        <strong className="me-auto">{data.msg_status == 200 ? 'Success!' : 'Error!'}</strong>
                    </Toast.Header>
                    <Toast.Body className="text-white">
                        {data.message}
                    </Toast.Body>
                </Toast>
            </ToastContainer>
            <Row>
                <Col md={4}>
                    <div className='d-flex align-items-centerd-flex flex-column min-vh-100 justify-content-center align-items-center'>
                        <Image id="registerUser" src={'images/banner-man.png'} className="w-100"/>
                    </div>
                </Col>
                <Col md={8}>
                    <div className='d-flex align-items-centerd-flex flex-column min-vh-100 justify-content-center align-items-center'>
                        <div className='text-center mb-3'>
                            <h3>Welcome to The Land Cart</h3>
                            <h5>Sign Up to add your property!</h5>
                        </div>
                        <Form className='w-100' noValidate validated={data.frm_validated}>
                            <Form.Control type="hidden" name="is_verified" value={data.is_verified}/>
                            <div className={data.token ? 'd-none' : ''}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Label>Registering For: </Form.Label>
                                        <Form.Check type="radio" label="Sale Property" name="userType" value="sale" className='form-check-inline' onClick={e => { setUtype(e.currentTarget.value); }}/>
                                        <Form.Check type="radio" label="Buy Property" name="userType" value="buy" className='form-check-inline' defaultChecked onClick={e => { setUtype(e.currentTarget.value); }}/>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3" controlId="userEmail">
                                            <Form.Control className="required" type="email" name="userEmail" placeholder="Enter email" autoComplete="off" autofill="false" onBlur={validatInput} onChange={e => { setUemail(e.currentTarget.value); }}/>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3" controlId="userFname">
                                            <Form.Control className="required" type="text" name="userFname" placeholder="First Name" autoComplete="off" autofill="false" onBlur={validatInput} onChange={e => { setUfname(e.currentTarget.value); }}/>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3" controlId="userLname">
                                            <Form.Control className="required" type="text" name="userLname" placeholder="Last Name" autoComplete="off" autofill="false" onBlur={validatInput} onChange={e => { setUlname(e.currentTarget.value); }}/>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3" controlId="userUname">
                                            <Form.Control className="required" type="text" name="userUname" placeholder="Username" autoComplete="off" autofill="false" onBlur={validatInput} onChange={e => { setUname(e.currentTarget.value); }}/>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3" controlId="userPassword">
                                            <Form.Control type="password" name="userPassword" placeholder="Password" autoComplete="off" autofill="false" onBlur={validatInput} onChange={e => { setUpass(e.currentTarget.value); }}  className={passwordError ? 'required is-invalid' : 'required'}/>
                                            <p className="errorText">{passwordError ? 'Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number and one special character is required.':'' }</p>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </div>
                            <Row className={data.token ? 'd-none' : ''}>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="userPhone">
                                        <InputGroup>
                                            <InputGroup.Text>+91</InputGroup.Text>
                                            <Form.Control name="userPhone" type="text" placeholder="Phone Number" autoComplete="off" autofill="false" maxLength="10" minLength="10" onBlur={validatInput} ref={phoneInput} className="required" onChange={e => { setUphone(e.currentTarget.value); }}/>
                                        </InputGroup>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    
                                </Col>
                            </Row>
                            <Row className={data.token ? '' : 'd-none'}>
                                <p className={!data.token ? 'd-none' : 'muted-text'}>Please verify your number with the code sent on your phone number.</p>
                                <Col md={8}>
                                    <Form.Group className="mb-3" controlId="userVerified">
                                        <Form.Control type="text" name="userVerified" placeholder="Verification Code" autoComplete="off" autofill="false" ref={verifyInput} className={data.code_empty}/>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Button type='button' variant={data.is_verified == 1 ? "success" : "outline-secondary"} disabled={`${data.is_verified == 1 ? 'disabled' : ''}`} onClick={verifyOTP}> 
                                        { data.is_verified == 1 ? <BsCheckCircleFill className="success ml-4" /> : 'Verify'}
                                        { data.verifyButton && <Spinner animation="border" size="sm" /> }
                                    </Button>
                                    <Button type='button' variant="outline-secondary" id="resend" onClick={sendOTP}>
                                        Resend Code 
                                        { data.resendButton && <Spinner animation="border" size="sm" /> }
                                    </Button>
                                </Col>
                            </Row>
                            <Row className={data.token ? 'd-none' : ''}>
                                <Col md={12}>
                                    <Form.Group className="mb-3" controlId="agreeTerms">
                                        <Form.Check type="checkbox" onClick={validatInput} label={<span>I agree to the <a href={'/privacy'} target="_blank" rel="noopener noreferrer"> terms and conditions.</a></span>}/>
                                    </Form.Group>
                                </Col>
                                <Col md={12}>
                                    <Button type='button' variant="outline-secondary" id="send" onClick={sendOTP}>
                                        Sign Up 
                                        { data.sendButton && <Spinner animation="border" size="sm" /> }
                                    </Button>
                                </Col>
                            </Row>
                        </Form>
                    </div>
                </Col>
            </Row>
        </Container>
    )
}

export default Register;