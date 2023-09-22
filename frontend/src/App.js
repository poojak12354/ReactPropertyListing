import React from "react";
import Header from './Components/Header/Header';
import Login from './Components/Login/Login';
import Footer from './Components/Footer/';
import './App.css';

const App  =(props) =>{  
  return (
    <div className="App">
      <Header />
      <Login/>
      <Footer />
    </div>
  );
}

export default App;