import React from 'react'
import WelcomBanner from '../../src/Components/PageComponent/HomeBanner'
import Styles from './index.module.scss'

const index = () => {
  return (
    <div className={Styles.homeOuter}>
        <WelcomBanner/>
        <div className='communContainer'>
            <div className={Styles.homeWrapper}>
                <div className='row'>
                    
                </div>
            </div>
        </div>
    </div>
  )
}

export default index