import React from 'react'

const Delete = ( Props ) =>{
  console.log('event',Props);
  return (
    <span className={Props.className} id={Props.id} onClick={(evnt)=>(Props.clickHandler(Props.index))}><i className="fas fa-times-circle"></i></span>
  )
}

export default Delete