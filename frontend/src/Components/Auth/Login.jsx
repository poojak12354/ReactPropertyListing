import React,{ useState } from 'react'
import { Container, Row, Col, Form, FloatingLabel, Button, Spinner, ButtonGroup, ToggleButton, Toast, ToastContainer, Collapse } from 'react-bootstrap';
import { useRouter } from "next/router";
import Link from "next/link";

const Login = () => {
    const router = useRouter();
    const [toggleValue, setToggleValue] = useState('password');
    const [notification, setnotification] = useState({
        status: '',
        message: '',
        sentVerification: 0
    });

    const [buttonState, setButtonState] = useState({
        login: '',
        resend: ''
    });

    const [uemail, setUemail] = useState('');
    const [upass, setUpass] = useState('');

    function verifyLogin(type){
        if(type == "resend"){
            let new_data = {...buttonState};
            new_data.resend = 'disabled';
            setButtonState(new_data);
        }
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: uemail,
            })
        };
        fetch(process.env.NEXT_PUBLIC_SERVER_URL+"/verify/phone", requestOptions)
        .then((res) => res.json())
        .then((resData) => {
            console.log('data',resData);
            
            if(resData.status){
                const requestOptions = {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: uemail.trim()})
                };
                fetch(process.env.NEXT_PUBLIC_SERVER_URL+"/sendCode", requestOptions)
                .then((res) => res.json())
                .then((resData) => {
                    if(type == "resend"){
                        let new_data = {...buttonState};
                        new_data.resend = '';
                        setButtonState(new_data);
                    }
                    console.log('data',resData);
                    let new_data = {...notification};
                    new_data.status = resData.statusCode;
                    new_data.message = resData.message;
                    new_data.sentVerification = typeof resData.token != undefined ? 1 : 0;
                    setnotification(new_data);
                }).catch(error => {
                    console.log('Form submit error', error);
                    let new_data = {...notification};
                    new_data.status = '203';
                    new_data.message = 'Something went wrong!';
                    setnotification(new_data);
                    if(type == "resend"){
                        let new_data = {...buttonState};
                        new_data.resend = '';
                        setButtonState(new_data);
                    }
                });
            } else {
                let new_data = {...notification};
                new_data.status = resData.statusCode;
                new_data.message = resData.msg;
                setnotification(new_data);
                if(type == "resend"){
                    let new_data = {...buttonState};
                    new_data.resend = '';
                    setButtonState(new_data);
                }
            }
        }).catch(error => {
            console.log('Form submit error', error);
            let new_data = {...notification};
            new_data.status = '203';
            new_data.message = 'Something went wrong!';
            setnotification(new_data);
            if(type == "resend"){
                let new_data = {...buttonState};
                new_data.resend = '';
                setButtonState(new_data);
            }
        });
    }

    const handleLoginType = (ele) => {
        let uname = document.getElementById('userUname');
        const ph_format = /^(?:(?:\+|0{0,2})91(\s*|[\-])?|[0]?)?([6789]\d{2}([ -]?)\d{3}([ -]?)\d{4})$/;

        if(!uemail.trim()){
            uname.classList.add("is-invalid");
            return false;
        } else if(ele.target.value == "otp" && !uemail.match(ph_format)){
            uname.classList.add("is-invalid");
            return false;
        } else {
            uname.classList.remove("is-invalid");
        }
        
        setToggleValue(ele.target.value);

        console.log('togle val',ele.target.value);
        if(ele.target.value == "otp" && notification.sentVerification == 0){
            verifyLogin('otp');
        }
    }

    const resendOTP = (event) => {
        let uname = document.getElementById('userUname');
        const ph_format = /^(?:(?:\+|0{0,2})91(\s*|[\-])?|[0]?)?([6789]\d{2}([ -]?)\d{3}([ -]?)\d{4})$/;

        if(!uemail.trim() || !uemail.match(ph_format)){
            uname.classList.add("is-invalid");
            return false;
        } else {
            uname.classList.remove("is-invalid");
        }

        verifyLogin('resend');
    };

    const authenticate = (event) => {
        let goahead = true;
        const form_elements = document.querySelectorAll(".required");
        const ph_format = /^(?:(?:\+|0{0,2})91(\s*|[\-])?|[0]?)?([6789]\d{2}([ -]?)\d{3}([ -]?)\d{4})$/;
        form_elements.forEach((ele) => {
            if(!ele.value.trim()){
                ele.classList.add("is-invalid");
                goahead = false;
            } else if(ele.getAttribute("id") == "userUname" && toggleValue == "otp" && !ele.value.trim().match(ph_format)){
                ele.classList.add("is-invalid");
                goahead = false;
            } else {
                ele.classList.remove("is-invalid");
            }
        });
        
        if(goahead){
            let new_data = {...buttonState};
            new_data.login = 'disabled';
            setButtonState(new_data);

            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: uemail,
                    code: upass,
                })
            };
            let apiUrl = toggleValue == "otp" ? "/verifyCode/login" : "/verify/login";
            
            fetch(process.env.NEXT_PUBLIC_SERVER_URL+apiUrl, requestOptions)
            .then((res) => res.json())
            .then((resData) => {
                console.log('data',resData);
                let btn_state = {...buttonState};
                btn_state.login = '';
                setButtonState(btn_state);
                
                let new_data = {...notification};
                new_data.status = resData.statusCode;
                new_data.message = resData.message;
                setnotification(new_data);

                if(resData.status){
                    let uData = resData.userData;
                    sessionStorage.setItem("ud_key", JSON.stringify(uData));
                    router.push('/user/profile');
                }
            }).catch(error => {
                console.log('Form submit error', error);
                let btn_state = {...buttonState};
                btn_state.login = '';
                setButtonState(btn_state);
                
                let new_data = {...notification};
                new_data.status = '203';
                new_data.message = 'Something went wrong!';
                setnotification(new_data);
            });
        }
    };

    const validatInput = (ele) => {
        let inputval = ele.target.value.trim();
        if(!inputval){
            ele.target.classList.add("is-invalid");
        } else {
            ele.target.classList.remove("is-invalid");
        }
    };

    const hideMessage = () => {
        let new_data = {...notification};
        new_data.status = '';
        new_data.message = '';
        setnotification(new_data);
    };

    return (
        <Container>
            <ToastContainer position="top-end" containerPosition="fixed">
                <Toast className="d-inline-block m-1" bg={notification.status == 200 ? 'success' : 'danger'} onClose={hideMessage} show={notification.message ? true : false} delay={5000} autohide animation="true" transition={Collapse}>
                    <Toast.Header>
                        <strong className="me-auto">{notification.status == 200 ? 'Success!' : 'Error!'}</strong>
                    </Toast.Header>
                    <Toast.Body className="text-white">
                        {notification.message}
                    </Toast.Body>
                </Toast>
            </ToastContainer>
            <div className='d-flex align-items-centerd-flex flex-column min-vh-100 justify-content-center align-items-center'>
                <Row>
                    <Col md={8}>
                        <div className='text-center mb-3'>
                            <h3>Welcome to The Land Cart</h3>
                            <h5>Sign In to add your property!</h5>
                        </div>
                        <Form className='w-100' noValidate>
                            <Row>
                                <Col md={12}>
                                    <FloatingLabel controlId="userUname" label="Username/Phone/Email" className="mb-3" >
                                        <Form.Control className="required" type="text" name="userUname" placeholder="Username/Phone/Email" autoComplete="off" onBlur={validatInput} autofill="false" onChange={e => { setUemail(e.currentTarget.value); }}/>
                                    </FloatingLabel>
                                </Col>
                                <Col md={12}>
                                    <FloatingLabel controlId="userPassword" label={toggleValue == 'password' ? 'Password' : 'OTP'} className="mb-3" >
                                        <Form.Control type={toggleValue == 'password' ? 'password' : 'text'} className="required" name="userPassword" placeholder={toggleValue == 'password' ? 'Password' : 'OTP'} autoComplete="off" autofill="false" onBlur={validatInput} onChange={e => { setUpass(e.currentTarget.value); }}/>
                                    </FloatingLabel>
                                </Col>
                                <Col md={12} className="mb-3">
                                    <Link href="#!"><a className={toggleValue == 'password' ? 'd-none' : 'mr-3'} onClick={resendOTP}>Resend Code { buttonState.resend && <Spinner animation="border" size="sm" /> }</a></Link>
                                    
                                    <Link href={'/forgot'}><a className={toggleValue == 'otp' ? 'd-none' : 'mr-3'}>Forgot Password?</a></Link>

                                    <ButtonGroup>
                                        <ToggleButton key="pass" id="login_pass" type="radio" variant="outline-success" name="radio" value="password" checked={toggleValue === 'password'} onChange={handleLoginType}>
                                            Password
                                        </ToggleButton>
                                        <ToggleButton key="otp" id="login_otp" type="radio" variant="outline-success" name="radio" value="otp" checked={toggleValue === 'otp'} onChange={handleLoginType}>
                                            OTP
                                        </ToggleButton>
                                    </ButtonGroup>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={12}>
                                    <Button type='button' variant="outline-secondary" id="sign_in" onClick={authenticate} >
                                        Sign In { buttonState.login && <Spinner animation="border" size="sm" /> }
                                    </Button>
                                </Col>
                            </Row>
                        </Form>
                    </Col>
                </Row>
            </div>
        </Container>
    )
}

export default Login;