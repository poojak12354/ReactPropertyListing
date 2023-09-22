import React from 'react'

const Video = ( Props ) =>{

  return (
    <img src={Props.src} id={Props.id} className={Props.classname} style={Props.inlineStyle} title={Props.title} alt={Props.alt}/>
  )
}

export default Video