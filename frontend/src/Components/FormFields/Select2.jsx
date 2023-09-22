import React, { Component } from 'react'
import Select, { components } from 'react-select'
const Select2 = (props) => {
    const { Option } = components
    // const CustomSelectOption = props => (
    //     <Option {...props}>
    //         {console.log('iconvval', props.data.icon)}
    //         {props.data.icon}
    //         {props.data.label}
    //     </Option>
    // )

    // const CustomSelectValue = props => (
    //     <div>
    //         {props.data.icon}
    //         {props.data.label}
    //     </div>
    // )
    return(
        <>
            {/* <Select instanceId={props.id} options={props.options} className={props.className} value={props.val} onChange={props.changeHandler} placeholder={props.placeholder} isMulti={props.multiple} components={{ Option: CustomSelectOption, SingleValue: CustomSelectValue }}/> */}
            <Select instanceId={props.id} options={props.options} className={props.className} value={props.val} onChange={props.changeHandler} placeholder={props.placeholder} isMulti={props.multiple} getOptionLabel={e => (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span dangerouslySetInnerHTML={{ __html: e.icon }}></span>
                    <span style={{ marginLeft: 5 }}>{e.label}</span>
                </div>
                )}/>
            
        </>
    )
};
export default Select2;