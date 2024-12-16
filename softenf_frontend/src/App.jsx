import Header from "./Header"
import React from "react"
//import TollMap from "./TollMap"
import Crossings from "./Crossings"


function App() {

  return(
    <><div>
      <TollMap />
    </div>
    <div>
      <Crossings />
    </div>
    <Header></Header>
    </>
    
  )
}

export default App
