import Image from '../PageComponent/Image';
import Delete from '../PageComponent/Delete'
import { Row, Col } from 'react-bootstrap';
const ShowGallery = ({ images, clickEvent, className }) => {
  
    return (
      <Row>
        <Col md={12}>
          { images.map((image, itemIndex) => {
            let istype = (image.type != "video/mp4" && image.type != "video/mov" && image.type != "video/avi") ? 'image' : 'video';
            return(
              <div className='d-inline-flex' key={itemIndex}>
                <Image src={ istype == 'image' ? image.src : process.env.NEXT_PUBLIC_BASE_URL+'/images/video.jpg'} classname={className} />
                <Delete index={itemIndex} clickHandler={clickEvent} className="icon-del"/>
              </div>
            )
          })}
        </Col>
      </Row>
    );
};
export default ShowGallery;