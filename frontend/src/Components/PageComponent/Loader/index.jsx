import Styles from './Loader.module.scss'
import Spinner from 'react-bootstrap/Spinner';
const Loader = ( Props ) =>{

    return (
        <div className={Styles.loading}>
            <Spinner animation={Props.animation} variant={Props.color}/>
        </div>    
    )
  }
  
  export default Loader