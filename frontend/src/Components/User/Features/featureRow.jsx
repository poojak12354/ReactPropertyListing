import React, { useState, useEffect } from 'react'
import {Form, FloatingLabel, Button} from 'react-bootstrap';
import FeaturesHtml from "./featureList";
const FeatureRow = (props) =>{
    const [featuresRow, setfeaturesRow] = useState(props.features);
    
    const handleDelFeatures = () => {
        console("clicked delete row");
    };

    const handleAddFeaturesItems = (index, evnt) => {
        const { name } = evnt.target;
        const rowsInput = [...featuresRow];
        let dataRowItem = rowsInput[index][name];
        dataRowItem.push({title: "", description: ""});
        setfeaturesRow(dataRowItem);
    };
    return (
        featuresRow.map((feature, index)=>{
            return(
                <tr key={index}>
                    <td className="align-top">
                        <Form.Group>
                            <FloatingLabel controlId="heading" label="Heading" className="mb-3" >
                                <Form.Control type='text' name="heading" placeholder="Heading" autoComplete="off" autofill="false" value={feature.heading} onChange={(evnt)=>(props.handleChange(index, evnt))}/>
                            </FloatingLabel>
                        </Form.Group>
                    </td>
                    <td>
                        <div id="feature_list">
                            <FeaturesHtml featuresList={feature.feature_list} />
                        </div>
                        <Button type='button' name="feature_list" id="add_more_featues" onClick={(evnt)=>(handleAddFeaturesItems(index, evnt))} className="w-md float-right"  variant="outline-dark" >
                            <i className="fas fa-plus"></i> Add More
                        </Button>
                    </td>
                    <td>
                        {index > 0 &&
                            <Button type='button' id="del_row" onClick={handleDelFeatures} className="d-table-cell align-middle"  variant="outline-dark" ><i className="fas fa-trash"></i></Button>
                        }
                    </td>
                </tr>
            )
        })
    )
  
}
export default FeatureRow;