import '../src/styles/globals.scss'
import Layout from '../src/Components/Layout';
import 'bootstrap/dist/css/bootstrap.min.css';
//import React, { useEffect, useState } from 'react';

const MyApp = ({ Component, pageProps }) => {
  // const [showChild, setShowChild] = useState(false);
  // useEffect(() => {
  //   setShowChild(true);
  // }, []);

  // if (!showChild) {
  //   return null;
  // }

  // if (typeof window === 'undefined') {
  //   return <></>;
  // } else {
    return (
      <Layout>
        <script src={'https://maps.googleapis.com/maps/api/js?key='+process.env.NEXT_PUBLIC_GOOGLE_KEY+'&libraries=places&v=weekly'} defer ></script>
          <Component {...pageProps} />
      </Layout>
    );
 // }
}

export default MyApp;