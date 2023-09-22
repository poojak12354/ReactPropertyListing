import React from 'react'
import {Row, Col, Form, FloatingLabel, Button} from 'react-bootstrap';
const FeatureList = (props) =>{
    return (
        props.featuresList.map((featureItem, itemIndex) => {
            return(
                <Row key={itemIndex}>
                    <Col md={5}>
                        <Form.Group>
                            <FloatingLabel controlId="title" label="Title" className="mb-3" >
                                <Form.Control type='text' name="title" placeholder="Title" autoComplete="off" autofill="false" value={featureItem.title} data-parent={props.parent} onChange={(evnt)=>(props.changeHandler(itemIndex, evnt))}/>
                            </FloatingLabel>
                        </Form.Group>
                    </Col>
                    <Col md={5}>
                        <Form.Group>
                            <FloatingLabel controlId="description" label="Description" className="mb-3" >
                                <Form.Control type='text' name="description" placeholder="Description" autoComplete="off" autofill="false" value={featureItem.description} data-parent={props.parent} onChange={(evnt)=>(props.changeHandler(itemIndex, evnt))}/>
                            </FloatingLabel>
                        </Form.Group>
                    </Col>
                    <Col md={2}>
                        {itemIndex > 0 &&
                            <Button type='button' id="del_row" onClick={(evnt)=>(props.handleDel(itemIndex, evnt))} data-parent={props.parent} className="d-table-cell align-middle"  variant="outline-dark" ><i className="fas fa-trash"></i></Button>
                        }
                    </Col>
                </Row>
            )
        })
    )
  
}
export default FeatureList;