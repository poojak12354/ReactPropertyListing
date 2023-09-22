// import React,{ useState} from 'react'
// import {Toast, ToastContainer, Collapse } from 'react-bootstrap';

export const createToast = (params) => {
  console.log("here in create tost",params);
//   const [showToast, setShowToast] = useState(true);
//   const hidePopup = () => setShowToast(false);
//     return (
//         <ToastContainer position="top-end">
//             <Toast className="d-inline-block m-1" bg={params.status == 200 ? 'success' : 'danger'} onClose={hidePopup} show={showToast} delay={5000} autohide animation="true" transition={Collapse}>
//                 <Toast.Header>
//                     <strong className="me-auto">{params.status == 200 ? 'Success!' : 'Error!'}</strong>
//                 </Toast.Header>
//                 <Toast.Body className="text-white">
//                     {params.message}
//                 </Toast.Body>
//             </Toast>
//         </ToastContainer>
//     );
}