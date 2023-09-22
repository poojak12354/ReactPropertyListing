import Image from '../PageComponent/Image';
import Delete from '../PageComponent/Delete'
import { Row, Col } from 'react-bootstrap';
const ShowAttachment = ({ attachments, clickEvent, className }) => {
  
    return (
      <Row>
        <Col md={12}>
          { attachments.map((attachment, itemIndex) => {
            return(
              <div className='d-inline-flex' key={itemIndex}>
                <Image src={ process.env.NEXT_PUBLIC_BASE_URL+'/images/pdf.png'} classname={className} />
                <Delete index={itemIndex} clickHandler={clickEvent} className="icon-del"/>
                <span className='attachment-name'>{attachment.source.name}</span>
              </div>
            )
          })}
        </Col>
      </Row>
    );
};
export default ShowAttachment;