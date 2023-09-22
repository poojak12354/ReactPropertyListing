import React from 'react'
import Image from '../Image'
import Styles from './HomeBanner.module.scss'


const HomeBanner = ( Props ) =>{

  return (
      <div className={Styles.welcomeBanner}>
          <Image id="myVideo" layout='fill' src={'images/banner.jpg'}/>
      </div>    
  )
}

export default HomeBanner