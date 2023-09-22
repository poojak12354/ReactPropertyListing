import React,{ useState, useRef, useEffect, useCallback } from 'react'
import { Card, Tab, Tabs , Row, Col, Form, FloatingLabel, Button, InputGroup, Spinner, Toast, ToastContainer, Collapse, Table } from 'react-bootstrap';
import {authInitialProps} from '../../../lib/auth';
import { useRouter } from "next/router";
import FeaturesHtml from "./Features/featureList";
import ShowGallery from '../Upload/showGallery';
import FileUpload from '../Upload/uploadFiles';
import MultiSelect from '../FormFields/Select2';
import ShowAttachment from '../Upload/showAttachment';

const AddProperty = (props) => {
    const router = useRouter();

    const [features, setFeatures] = useState([{
        heading: "",
        feature_list: [{title: "", description: ""}]
    }]);
    const [notification, setnotification] = useState({
        status: '',
        message: ''
    });
    const [videos, setVideos] = useState([{
        in_gallery: 0,
        video_url: ""
    }]);
    const [floorPlans, setFloorPlans] = useState([{
        plan_title: "",
        plan_content: "",
        plan_media: "",
        plan_media_meta: [],
    }]);

    const [attachmentInfo, setAttachmentInfo] = useState({
        media_name: "",
        media_meta: [],
    });

    const [images, setImages] = useState([]);
    const [userData, setUserData] = useState({});
    const propertyTitle = useRef();
    const propertyDesc = useRef();
    const propertyPrice = useRef();
    const propertyAddress = useRef();
    const propertyCity = useRef();
    const propertyPincode = useRef();
    const propertyArea = useRef();
    const propertyFor = useRef();
    const propertyStatus = useRef();
    const propertyAge = useRef();
    const propertyFurnishing = useRef();
    const propertyType = useRef();

    const addressAutoComplete = useRef();
    const infoWindowRef = useRef();

    const [locationInfo, setLocationInfo] = useState({
        property_location: "",
        loc_name: "",
        loc_detail: "",
        link: "Himalaya+Marg,+Chandigarh+Sector+22B,+Chandigarh,+160018+Sector+22B,+Sector+18D+Chandigarh+India/@30.733315,76.779419,13z",
        default_lat: 30.733315,
        loc_lat: '',
        loc_long: '',
        default_long: 76.779419,
    });

    const [amenities, setAmenities] = useState([]);
    const [amenitiesID, setamenitiesID] = useState([]);
    const [showloader, setShowloader] = useState(false);
    const [neighbourhood, setNeighbourhood] = useState([]);
    const [amenetiesOptions, setAmenetiesOptions] = useState([]);
    const [neighbourhoodOptions, setNeighbourhoodOptions] = useState([]);
    const [neighbourhoodID, setneighbourhoodID] = useState([]);
    const [typesOptions, setTypesOptions] = useState([]);
    const [cityOptions, setCityOptions] = useState([]);

    const select2Change = (type,selectedOptions) => {
        switch(type){
            case "amenities":
                setAmenities(selectedOptions);
                selectedOptions.forEach((ele) => {
                    setamenitiesID([...amenitiesID, ele.value]);
                });
            break;
            case "neighbourhood":
                setNeighbourhood(selectedOptions);
                selectedOptions.forEach((ele) => {
                    setneighbourhoodID([...neighbourhoodID, ele.value]);
                });
            break;
        }
        
    }
    
    useEffect(() => {
        setUserData(authInitialProps(true));

        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ list: ['city','amenities','neighbourhood','types'] })
        };
        fetch(process.env.NEXT_PUBLIC_SERVER_URL+"/getPreloadData", requestOptions)
        .then((res) => res.json())
        .then((resData) => {
            
            if(resData.status){
                if(resData.data.amenities.length > 0){
                    let opt_ammenites = resData.data.amenities.map(item => {
                        return {
                            value: item.aid,
                            label: item.name,
                            icon: item.icon
                        };
                    });
                    setAmenetiesOptions(opt_ammenites);
                }
                if(resData.data.neighbourhood.length > 0){
                    let opt_neighbourhood = resData.data.neighbourhood.map(row => {
                        return {
                            value: row.neighbour_id,
                            label: row.name,
                            icon: row.icon
                        };
                    });
                    setNeighbourhoodOptions(opt_neighbourhood);
                }
                setTypesOptions(resData.data.types)
                setCityOptions(resData.data.city);

            } else {
                let new_data = {...notification};
                new_data.status = resData.statusCode;
                new_data.message = resData.message;
                setnotification(new_data);
            }
        }).catch(error => {
            console.log('error in request', error);
            let new_data = {...notification};
            new_data.status = 401;
            new_data.message = 'Something went wrong. Please contact site admin.';
            setnotification(new_data);
        });

        const initMap = () => {
            const map = new google.maps.Map(document.getElementById("map"), {
                center: { lat: locationInfo.default_lat, lng: locationInfo.default_long },
                zoom: locationInfo.property_location != "" ? 19 : 13,
                mapTypeControl: true,
            });
            const input = addressAutoComplete.current;
            const options = {
                fields: ["formatted_address", "geometry", "icon", "name"],
                strictBounds: false,
                types: ["establishment"],
            };
        
            const autocomplete = new google.maps.places.Autocomplete(input, options);
        
            autocomplete.bindTo("bounds", map);
        
            const infowindow = new google.maps.InfoWindow();
            const infowindowContent = infoWindowRef.current;
            infowindow.setContent(infowindowContent);
            
            const marker = new google.maps.Marker({
                position: new google.maps.LatLng(locationInfo.default_lat, locationInfo.default_long),
                map,
                draggable: true,
                anchorPoint: new google.maps.Point(0, -29),
            });
        
            google.maps.event.addListener(marker, 'dragend', function(evt) {
                
                geocoder = new google.maps.Geocoder();
                geocoder.geocode
                ({
                    latLng: evt.latLng
                }, 
                    function(results, status) 
                    {
                        if (status == google.maps.GeocoderStatus.OK) 
                        {
                            let locationAdr = results[0].formatted_address;
                            const locInfoData = {...locationInfo};
                            locInfoData.loc_name = place_name;
                            locInfoData.loc_detail = locationAdr;
                            locInfoData.loc_lat = evt.latLng.lat().toFixed(6);
                            locInfoData.loc_long = evt.latLng.lng().toFixed(6);
                            locInfoData.link = locationAdr.replace(/ /g,"+")+'/@'+lat+','+long+',17z';
                            setLocationInfo(locInfoData);
                            console.log('locInfoData',locInfoData);
                            
                            // infowindowContent.children["place-name"].textContent = '';
                            // infowindowContent.children["place-address"].textContent = results[0].formatted_address;
                            infowindow.open(map, marker);
                        } 
                        else 
                        {
                            alert('Cannot determine address at this location.'+status);
                        }
                    }
                );
            });
        
            map.setCenter(marker.position);
            marker.setMap(map);
        
            google.maps.event.addListener(marker, 'click', function () {
                infowindow.open(map, marker);
            });
        
            autocomplete.addListener("place_changed", () => {
                infowindow.close();
                marker.setVisible(false);
        
                const place = autocomplete.getPlace();
                console.log('place', place);
                var place_name = place.name;
                
                if (!place.geometry || !place.geometry.location) {
                    window.alert("No details available for input: '" + place_name + "'");
                    return;
                }
        
                // If the place has a geometry, then present it on a map.
                if (place.geometry.viewport) {
                    map.fitBounds(place.geometry.viewport);
                } else {
                    map.setCenter(place.geometry.location);
                    map.setZoom(17);
                }
                marker.setPosition(place.geometry.location);
                marker.setVisible(true);

                infowindowContent.children["place-name"].textContent = place_name;
                var lat = place.geometry.location.lat().toFixed(6);
                var long = place.geometry.location.lng().toFixed(6);

                const locInfoData = {...locationInfo};
                locInfoData.property_location = addressAutoComplete.current.value;
                locInfoData.loc_name = place_name;
                locInfoData.loc_detail = place.formatted_address;
                locInfoData.loc_lat = lat;
                locInfoData.loc_long = long;
                locInfoData.link = place_name.replace(/ /g,"+")+'/@'+lat+','+long+',17z';
                setLocationInfo(locInfoData);

                // infowindowContent.children["place-name"].textContent = place_name;
                // infowindowContent.children["place-address"].textContent = place.formatted_address;

                infowindow.open(map, marker);
            });
        }
        initMap();
    }, []);

    const onDrop = useCallback((acceptedFiles,key) => {
        acceptedFiles.map((file, index) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                let newname = new Date().getTime() + '_' + file.name;
                setImages((prevState) => [
                    ...prevState,
                    { id: index, src: e.target.result, type: file.type, source: file, name: newname},
                ]);
            };
            reader.readAsDataURL(file);
            return file;
        });
    }, []);
    
    const onPlanSelect = useCallback((acceptedFiles, key) => {
        acceptedFiles.map((file, index) => {
            const reader = new FileReader();
            let files_count = 0;
            reader.onload = function (e) {
                if(files_count == 0){
                    const plansInfoData = [...floorPlans];
                    plansInfoData[key]['plan_media'] = new Date().getTime() + '_' + file.name;
                    plansInfoData[key]['plan_media_meta'] = [{ id: index, src: e.target.result, type: file.type}];
                    setFloorPlans(plansInfoData);
                }
                files_count++;
            };
            reader.readAsDataURL(file);
            return file;
        });
    }, [floorPlans]);

    const onAttachmentSelect = useCallback((acceptedFiles, key) => {
        acceptedFiles.map((file, index) => {
            const reader = new FileReader();
            let files_count = 0;
            reader.onload = function (e) {
                if(files_count == 0){
                    const attachInfoData = {...attachmentInfo};
                    attachInfoData.media_name = new Date().getTime() + '_' + file.name;
                    attachInfoData.media_meta = [{ id: index, src: e.target.result, type: file.type}];
                    setAttachmentInfo(attachInfoData);
                }
                files_count++;
            };
            reader.readAsDataURL(file);
            return file;
        });
    }, [attachmentInfo]);
  
    const removeFile = (index,type) =>{

        switch(type){
            case "plan":
                const planArr = [...floorPlans];
                planArr[index]['plan_media'] = "";
                planArr[index]['plan_media_meta'] = [];
                setFloorPlans(planArr);
            break;
            case "attachment":
                setAttachmentInfo({
                    media_name: "",
                    media_meta: [],
                });
            break;
        }        
    }

    const removeImage = (index) =>{
        const imgArr = [...images];
        imgArr.splice(index, 1);
        setImages(imgArr);      
    }

    const validatInput = (ele) => {
        let inputval = ele.target.value.trim();
        if(!inputval){
            ele.target.classList.add("is-invalid");
        } else {
            ele.target.classList.remove("is-invalid");
        }
    };


    const handleAddNewRow = (type,event) => {
        switch(type){
            case "video":
                const row = {
                    in_gallery: 0,
                    video_url: ""
                };
                setVideos([...videos, row]);
            break;
            case "plans":
                const rowPlan = {
                    plan_title: "",
                    plan_content: "",
                    plan_media: "",
                    plan_media_meta: [],
                };

                console.log('row',floorPlans);
                setFloorPlans([...floorPlans, rowPlan]);
                console.log('allplans',floorPlans);
            break;
            default:
                const item = {
                    heading: "",
                    feature_list: [{title: "", description: ""}]
                };
                setFeatures([...features, item]);
            break;
        }
    };

    const handleChange = (index, evnt)=>{
        const { name, value } = evnt.currentTarget;
        const rowsInput = [...features];
        rowsInput[index][name] = value;
        setFeatures(rowsInput);
    };

    const handleFeatures = (index, evnt)=>{
        const { name, value } = evnt.currentTarget;
        const parentId = evnt.currentTarget.getAttribute("data-parent");
        const rowsInput = [...features];
        rowsInput[parentId]['feature_list'][index][name] = value;
        setFeatures(rowsInput);
    };

    const handleAddFeaturesItems = (index, evnt) => {
        const { name } = evnt.currentTarget;
        const rowsInput = [...features];
        let dataRowItem = rowsInput[index][name];
        rowsInput[index][name][dataRowItem.length] = {title: "", description: ""};
        setFeatures(rowsInput);
    };

    const handleDelRow = (index, evnt, type) => {
        switch(type){
            case "video":
                const allVideos = [...videos];
                allVideos.splice(index, 1);
                setVideos(allVideos);
            break;
            case "feature":
                const rows = [...features];
                rows.splice(index, 1);
                setFeatures(rows);
            break;
            case "plan":
                const plans = [...floorPlans];
                plans.splice(index, 1);
                setFloorPlans(plans);
            break;
        }
        
    };

    const handleDelItem = (index, evnt) =>{
        const parentId = evnt.currentTarget.getAttribute("data-parent");
        const rowsInput = [...features];
        let rows = rowsInput[parentId]['feature_list'];
        rows.splice(index, 1);
        setFeatures(rowsInput);
    };

    const mapValChanged = (event) => {
        const { name, value } = event.currentTarget;
        const locInfoArr = {...locationInfo};
        switch(name){
            case "property_location":
                locInfoArr.property_location = value;
                setLocationInfo(locInfoArr);
            break;
            case "loc_name":
                locInfoArr.loc_name = value;
                setLocationInfo(locInfoArr);
            break;
            case "loc_detail":
                locInfoArr.loc_detail = value;
                setLocationInfo(locInfoArr);
            break;
            case "loc_lat":
                locInfoArr.loc_lat = value;
                setLocationInfo(locInfoArr);
            break;
            case "loc_long":
                locInfoArr.loc_long = value;
                setLocationInfo(locInfoArr);
            break;
        }
    };

    const updateVideoData = (index, evnt) =>{
        const { name, value } = evnt.currentTarget;
        const rowsOptions = [...videos];
        if(name == "in_gallery"){
            value = evnt.currentTarget.checked ? 1 : 0;
        }
        rowsOptions[index][name] = value;
        setVideos(rowsOptions);
    };

    const updatePlanData = (index, evnt) =>{
        const { name, value } = evnt.currentTarget;
        const rowsOptions = [...floorPlans];
        rowsOptions[index][name] = value;
        setFloorPlans(rowsOptions);
    };

    const hideMessage = () => {
        let new_data = {...notification};
        new_data.status = '';
        new_data.message = '';
        setnotification(new_data);
    };

    const submitForm = (event) => {
        let clickedButton = event.target.id;
        let goahead = true;
       
        const form_elements = document.querySelectorAll(".required");
        form_elements.forEach((ele) => {
            if(!ele.value.trim()){
                ele.classList.add("is-invalid");
                goahead = false;
            } else {
                ele.classList.remove("is-invalid");
            }
        });
        
        if(goahead){
            setShowloader(true);

            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: window.btoa(userData.id),
                    title: propertyTitle.current.value.trim(),
                    description: propertyDesc.current.value.trim(),
                    price: propertyPrice.current.value.trim(),
                    addrs: propertyAddress.current.value.trim(),
                    city: propertyCity.current.value,
                    pincode: propertyPincode.current.value.trim(),
                    for: propertyFor.current.value.trim(),
                    area: propertyArea.current.value.trim(),
                    status: propertyStatus.current.value.trim(),
                    age: propertyAge.current.value.trim(),
                    furnishing: propertyFurnishing.current.value.trim(),
                    type: propertyType.current.value,
                    amenities: amenitiesID,
                    neighbourhood: neighbourhoodID,
                    features: features,
                    mapAddress: locationInfo,
                    gallery: images,
                    videos: videos,
                    plans: floorPlans,
                    attachment: attachmentInfo
                })
            };
            fetch(process.env.NEXT_PUBLIC_SERVER_URL+"/add/property", requestOptions)
            .then((res) => res.json())
            .then((resData) => {
                console.log('data',resData);
                
                // if(resData.status){
                //     const requestOptions = {
                //         method: 'POST',
                //         headers: { 'Content-Type': 'application/json' },
                //         body: JSON.stringify({ phone: phoneInput.current.value.trim()})
                //     };
                //     fetch(process.env.NEXT_PUBLIC_SERVER_URL+"/sendCode", requestOptions)
                //     .then((res) => res.json())
                //     .then((resData) => {
                //         console.log('data',resData);
                //         let new_data = {...data};
                //         new_data.token = typeof resData.token != undefined ? resData.token : '';
                //         new_data.message = resData.message;
                //         new_data.msg_status = resData.statusCode;
                //         new_data.sendButton = '';
                //         new_data.resendButton = '';
                //         setData(new_data);
                //     }).catch(error => {
                //         console.log('Form submit error', error);
                //         let new_data = {...data};
                //         new_data.sendButton = '';
                //         new_data.resendButton = '';
                //         new_data.message = 'Something went wrong!';
                //         new_data.msg_status = '203',
                //         setData(new_data);
                //     });
                // } else {
                //     let new_data = {...data};
                //     if(resData.message_email != ""){
                //         new_data.message = resData.message_email;
                //     } else if(resData.message_user != ""){
                //         new_data.message = resData.message_user;
                //     } else if(resData.message_phone != ""){
                //         new_data.message = resData.message_phone;
                //     } else {
                //         new_data.message = resData.message;
                //     }
                //     new_data.msg_status = resData.statusCode;
                //     new_data.sendButton = '';
                //     new_data.resendButton = '';
                //     setData(new_data);
                // }
            }).catch(error => {
                console.log('Form submit error', error);
                // let new_data = {...data};
                // new_data.sendButton = '';
                // new_data.resendButton = '';
                // new_data.message = 'Something went wrong!';
                // new_data.msg_status = '203',
                // setData(new_data);
            });
        } else {
            let new_data = {...notification};
            new_data.status = '402';
            new_data.message = 'Please fill all required fields';
            setnotification(new_data);
        }
    };

    return (
        <>
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
        <Row>
            <Col md={12}>
                <Form className='w-100' noValidate>
                    <Card>
                        <Card.Body>
                            <Row>
                                <Col md={12}>
                                    <Form.Group>
                                        <FloatingLabel controlId="property_name" label="Property Name" className="mb-3" >
                                            <Form.Control className="required" type="text" name="property_name" placeholder="Property Name" autoComplete="off" onBlur={validatInput} autofill="false" ref={propertyTitle}/>
                                        </FloatingLabel>
                                    </Form.Group>
                                </Col>
                                <Col md={12}>
                                    <Form.Group>
                                        <FloatingLabel controlId="form_content" label="Property Description" className="mb-3" >
                                            <Form.Control as="textarea" rows={12} className="required" name="form_content" placeholder="Property Description" autoComplete="off" autofill="false" onBlur={validatInput} ref={propertyDesc}/>
                                        </FloatingLabel>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                    <Card className='mb-3'>
                        <Card.Body>
                            <Tabs defaultActiveKey="general" id="property_tabs" className="mb-3" justify>
                                <Tab eventKey="general" title="General">
                                    <h6 className="mt-3">General Information</h6>
                                    <hr/>
                                    <Row>
                                        <Col md={12}>
                                            <Form.Group>
                                                <InputGroup className="mb-3">
                                                    <InputGroup.Text className='col-md-1'>₹</InputGroup.Text>
                                                    <FloatingLabel controlId="property_price" label="Price" className='col-md-10'>
                                                        <Form.Control type='text' className="required" name="property_price" placeholder="Price" autoComplete="off" autofill="false" onBlur={validatInput} ref={propertyPrice}/>
                                                    </FloatingLabel>
                                                    <InputGroup.Text className='col-md-1'>.00</InputGroup.Text>
                                                </InputGroup>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={4}>
                                            <Form.Group>
                                                <FloatingLabel controlId="property_for" label="Property For" className="mb-3" >
                                                    <Form.Select name="property_for" className='required' onBlur={validatInput} ref={propertyFor}>
                                                        <option>Select Type</option>
                                                        <option value="sale">Sale</option>
                                                        <option value="rent">Rent</option>
                                                    </Form.Select>
                                                </FloatingLabel>
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <FloatingLabel controlId="address" label="Address" className="mb-3" >
                                                    <Form.Control type='text' className="required" name="address" placeholder="Address" autoComplete="off" autofill="false" onBlur={validatInput} ref={propertyAddress}/>
                                                </FloatingLabel>
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <FloatingLabel controlId="city" label="Select City" className="mb-3" >
                                                    <Form.Select name="city" className='required' onBlur={validatInput} ref={propertyCity}>
                                                        <option value="">Select City</option>
                                                        {cityOptions.map((city)=>{
                                                            return(
                                                                <option value={city.city_id} key={city.city_id}>{city.name}</option>
                                                            )
                                                        })}
                                                    </Form.Select>
                                                </FloatingLabel>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={4}>
                                            <Form.Group>
                                                <FloatingLabel controlId="zip" label="Zipcode" className="mb-3" >
                                                    <Form.Control type='text' className="required" name="zip" placeholder="Zipcode" autoComplete="off" autofill="false" onBlur={validatInput} ref={propertyPincode}/>
                                                </FloatingLabel>
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <FloatingLabel controlId="area" label="Property size (ft²)" className="mb-3" >
                                                    <Form.Control type='text' className="required" name="area" placeholder="Property size (ft²)" autoComplete="off" autofill="false" onBlur={validatInput} ref={propertyArea}/>
                                                </FloatingLabel>
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <FloatingLabel controlId="status" label="Status" className="mb-3" >
                                                    <Form.Select name="status" className='required' onBlur={validatInput} ref={propertyStatus}>
                                                        <option>Select Status</option>
                                                        <option value="ready-to-move">Ready To Move</option>
                                                        <option value="under-construction">Under Contruction</option>
                                                    </Form.Select>
                                                </FloatingLabel>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={4}>
                                            <Form.Group>
                                                <FloatingLabel controlId="property_age" label="Property Age" className="mb-3" >
                                                    <Form.Control type='text' name="property_age" placeholder="Property Age" autoComplete="off" autofill="false" ref={propertyAge}/>
                                                </FloatingLabel>
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <FloatingLabel controlId="furnishing" label="Furnishing" className="mb-3" >
                                                    <Form.Select name="furnishing" className='required' ref={propertyFurnishing}>
                                                        <option value="fully-furnished">Fully Furnished</option>
                                                        <option value="semi-furnished">Semi Furnished</option>
                                                        <option value="unfurnished">Unfurnished</option>
                                                    </Form.Select>
                                                </FloatingLabel>
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <FloatingLabel controlId="project_type" label="Property Type" className="mb-3" >
                                                    <Form.Select name="project_type" className='required' onBlur={validatInput} ref={propertyType}>
                                                        <option>Select Type</option>
                                                        {typesOptions.map((type)=>{
                                                            return(
                                                                <option value={type.type_id} key={type.type_id}>{type.name}</option>
                                                            )
                                                        })}
                                                    </Form.Select>
                                                </FloatingLabel>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={4}>
                                            <Form.Group>
                                                <MultiSelect id="neighbourhood" options={neighbourhoodOptions} className="form-select2" val={neighbourhood} changeHandler={(evnt)=>(select2Change('neighbourhood',evnt))} placeholder="Select Neighbourhood" multiple="true"></MultiSelect>
                                            </Form.Group>
                                        </Col>
                                        <Col md={8}>
                                            <Form.Group>
                                                <MultiSelect id="amenities" options={amenetiesOptions} className="form-select2" val={amenities} changeHandler={(evnt)=>(select2Change('amenities',evnt))} placeholder="Select Amenities"  multiple="true"></MultiSelect>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={12}>
                                            <h6>Specifications/Features </h6>
                                            <hr/>
                                        </Col>
                                        <Col md={12}>
                                            <Table striped bordered hover id="tbl_specifications">
                                                <thead>
                                                    <tr>
                                                        <th>Heading</th>
                                                        <th>Features</th>
                                                        <th></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {features.map((feature, index)=>{
                                                        return(
                                                            <tr key={index}>
                                                                <td className="align-top">
                                                                    <Form.Group>
                                                                        <FloatingLabel controlId="heading" label="Heading" className="mb-3" >
                                                                            <Form.Control type='text' name="heading" placeholder="Heading" autoComplete="off" autofill="false" value={feature.heading} onChange={(evnt)=>(handleChange(index, evnt))}/>
                                                                        </FloatingLabel>
                                                                    </Form.Group>
                                                                </td>
                                                                <td>
                                                                    <div id="feature_list">
                                                                        <FeaturesHtml featuresList={feature.feature_list} handleDel={handleDelItem} changeHandler={handleFeatures} parent={index}/>
                                                                    </div>
                                                                    <Button type='button' name="feature_list" id="add_more_featues" onClick={(evnt)=>(handleAddFeaturesItems(index, evnt))} className="w-md float-right"  variant="outline-dark" >
                                                                        <i className="fas fa-plus"></i> Add More
                                                                    </Button>
                                                                </td>
                                                                <td>
                                                                    {index > 0 &&
                                                                        <Button type='button' id="del_row" onClick={(evnt)=>(handleDelRow(index, evnt, 'feature'))} className="d-table-cell align-middle"  variant="outline-dark" ><i className="fas fa-trash"></i></Button>
                                                                    }
                                                                </td>
                                                            </tr>
                                                    )
                                                    })}
                                                </tbody>
                                            </Table>
                                            <Button type='button' id="add_more_featues" onClick={(evt)=>handleAddNewRow('feature',evt)} className="w-md float-right"  variant="outline-dark" >
                                                <i className="fas fa-plus"></i> Add More
                                            </Button>
                                        </Col>
                                    </Row>
                                </Tab>
                                <Tab eventKey="location" title="Location">
                                    <h6 className="mt-3">Location Information</h6>
                                    <hr/>
                                    <Row>
                                        <Col md={12}>
                                            <FloatingLabel controlId="property_location" label="Location" className="mb-3" >
                                                <Form.Control type='text' name="property_location" placeholder="Enter a location" autoComplete="off" autofill="false" defaultValue={locationInfo.property_location} onBlur={(evnt)=>(mapValChanged(evnt))} ref={addressAutoComplete}/>
                                            </FloatingLabel>
                                        </Col>
                                        <Col md={6}>
                                            <FloatingLabel controlId="loc_name" label="Info Popup Title" className="mb-3" >
                                                <Form.Control type='text' name="loc_name" placeholder="Eg. Omega City" autoComplete="off" autofill="false" value={locationInfo.loc_name} onChange={(evnt)=>(mapValChanged(evnt))}/>
                                            </FloatingLabel>
                                        </Col>
                                        <Col md={6}>
                                            <FloatingLabel controlId="loc_detail" label="Info Popup Description" className="mb-3" >
                                                <Form.Control type='text' name="loc_detail" placeholder="Eg. Mohali, Ludhiana - Chandigarh State Highway, Guru Teg Bahadur Nagar, Kharar, Punjab, India" autoComplete="off" autofill="false" value={locationInfo.loc_detail} onChange={(evnt)=>(mapValChanged(evnt))}/>
                                            </FloatingLabel>
                                        </Col>
                                        <Col md={6}>
                                            <FloatingLabel controlId="loc_lat" label="Latitude" className="mb-3" >
                                                <Form.Control type='text' name="loc_lat" placeholder="Eg. 30.733315" autoComplete="off" autofill="false" value={locationInfo.loc_lat} onChange={(evnt)=>(mapValChanged(evnt))}/>
                                            </FloatingLabel>
                                        </Col>
                                        <Col md={6}>
                                            <FloatingLabel controlId="loc_long" label="Longitude" className="mb-3" >
                                                <Form.Control type='text' name="loc_long" placeholder="Eg. 76.779419" autoComplete="off" autofill="false" value={locationInfo.loc_long} onChange={(evnt)=>(mapValChanged(evnt))}/>
                                            </FloatingLabel>
                                        </Col>
                                    </Row>
                                    <div id="map" style={{height : '500px'}}></div>
                                    <div id="infowindow-content" ref={infoWindowRef}>
                                        <span id="place-name" className="title">{locationInfo.loc_name ? locationInfo.loc_name : 'Chandigarh'}</span><br />
                                        <span id="place-address"></span><br />
                                        <a href={'https://www.google.com/maps/place/'+locationInfo.link} id="view_on_map" target="_blank">View on Google Maps</a>
                                    </div>
                                </Tab>
                                <Tab eventKey="gallery" title="Gallery">
                                    <Row>
                                        <Col md={12}>
                                            <FileUpload onDrop={onDrop} showLabel="1" acceptType='{"image/png": [".png"],"image/jpeg": [".jpg",".jpeg"],"video/mp4": [".mp4"],"video/webm": [".webm"],"video/ogg": [".ogg"]}' rowIndex='0'/>
                                            <ShowGallery images={images} clickEvent={removeImage} className="thumb-lg img-thumbnail fill mt-3"/>
                                        </Col>
                                    </Row>
                                </Tab>
                                <Tab eventKey="videos" title="Videos">
                                    <Row>
                                        <Col md={12}>
                                            <h6>Vidoes (Only Youtube Url)</h6>
                                            <hr/>
                                        </Col>
                                        <Col md={12}>
                                            <Table striped bordered hover id="tbl_videos">
                                                <thead>
                                                    <tr>
                                                        <th>List in Gallery</th>
                                                        <th>Video Url</th>
                                                        <th></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {videos.map((video, index)=>{
                                                        return(
                                                            <tr key={index}>
                                                                <td className="align-top">
                                                                    <Form.Group className="mb-3" controlId="featured">
                                                                        <Form.Check type="switch" name="in_gallery" label="Include in gallery?" checked={video.in_gallery} onChange={(evnt)=>(updateVideoData(index,evnt))}/>
                                                                    </Form.Group>
                                                                </td>
                                                                <td>
                                                                    <FloatingLabel controlId="video_url" label="Video Url" className="mb-3" >
                                                                        <Form.Control type='text' name="video_url" placeholder="Video Url" autoComplete="off" autofill="false" value={video.video_url} onChange={(evnt)=>(updateVideoData(index,evnt))}/>
                                                                    </FloatingLabel>
                                                                </td>
                                                                <td>
                                                                    {index > 0 &&
                                                                        <Button type='button' id="del_video" onClick={(evnt)=>(handleDelRow(index, evnt, 'video'))} className="d-table-cell align-middle"  variant="outline-dark" ><i className="fas fa-trash"></i></Button>
                                                                    }
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </Table>
                                            <Button type='button' id="add_more_videos" onClick={(evt)=>handleAddNewRow('video',evt)} className="w-md float-right"  variant="outline-dark" >
                                                <i className="fas fa-plus"></i> Add More
                                            </Button>
                                        </Col>
                                    </Row>
                                </Tab>
                                <Tab eventKey="plans" title="Plans">
                                    <Row>
                                        <Col md={12}>
                                            <h6>Floor Plans</h6>
                                            <hr/>
                                        </Col>
                                        <Col md={12}>
                                            <Table striped bordered hover id="tbl_videos">
                                                <thead>
                                                    <tr>
                                                        <th style={{width:'30%'}}>Title</th>
                                                        <th style={{width:'65%'}}>Details</th>
                                                        <th style={{width:'5%'}}></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {floorPlans.map((plan, index)=>{
                                                        return(
                                                            <tr key={index}>
                                                                <td className="align-top">
                                                                    <FloatingLabel controlId="plan_title" label="Title eg. 2BHK" className="mb-3" >
                                                                        <Form.Control type='text' name="plan_title" placeholder="eg. 2BHK" autoComplete="off" autofill="false" value={plan.plan_title} onChange={(evnt)=>(updatePlanData(index,evnt))}/>
                                                                    </FloatingLabel>
                                                                </td>
                                                                <td>
                                                                    <FloatingLabel controlId="plan_content" label="Plan Details" className="mb-3" >
                                                                        <Form.Control as="textarea" rows={12} name="plan_content" placeholder="Plan Details" autoComplete="off" autofill="false" value={plan.plan_content} onChange={(evnt)=>(updatePlanData(index,evnt))}/>
                                                                    </FloatingLabel>
                                                                    <Row>
                                                                        
                                                                        <Col md={4}><FileUpload onDrop={onPlanSelect} showLabel="0" acceptType='{"image/png": [".png"],"image/jpg": [".jpg",".jpeg"]}' rowIndex={index}/></Col>
                                                                        <Col md={8}><ShowGallery images={plan.plan_media_meta} clickEvent={(evnt)=>(removeFile(index,'plan'))} className="img-thumbnail fill mt-3"/></Col>
                                                                    </Row>
                                                                </td>
                                                                <td>
                                                                    {index > 0 &&
                                                                        <Button type='button' id="del_video" onClick={(evnt)=>(handleDelRow(index, evnt, 'plan'))} className="d-table-cell align-middle"  variant="outline-dark" ><i className="fas fa-trash"></i></Button>
                                                                    }
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </Table>
                                            <Button type='button' id="add_more_plans" onClick={(evt)=>handleAddNewRow('plans',evt)} className="w-md float-right"  variant="outline-dark" >
                                                <i className="fas fa-plus"></i> Add More
                                            </Button>
                                        </Col>
                                    </Row>
                                </Tab>
                                <Tab eventKey="attachments" title="Attachments">
                                    <Row>
                                        <Col md={4}>
                                            <FileUpload onDrop={onAttachmentSelect} showLabel="0" acceptType='{"application/pdf": [".pdf"]}' rowIndex="0"/>
                                        </Col>
                                        <Col md={8}>
                                            <ShowAttachment attachments={attachmentInfo.media_meta} clickEvent={(evnt)=>(removeFile(0,'attachment'))} className="thumb-lg img-thumbnail fill mt-3"/>
                                        </Col>
                                    </Row>
                                </Tab>
                            </Tabs>
                        </Card.Body>
                    </Card>
                    <Row>
                        <Col md={12}>
                            <Button type='button' variant="outline-secondary" onClick={submitForm}>
                                Add Property 
                                { showloader && <Spinner animation="border" size="sm" /> }
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </Col>
        </Row>
        </>
    )
}
//AddProperty.getInitialProps = authInitialProps(true);
export default AddProperty;