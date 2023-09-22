const Input =(props) =>{
    return (
        <input type={props.type} name={props.name} placeholder={props.placeholder} autoComplete="off" autofill="false"/>
    )
}
export default Input;