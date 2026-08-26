import './App.css';
import React, { useState } from 'react';
import {Sim} from './Sim.js';
import {colors} from './colors.js';
import {cloneSpecification, defaultSpecification} from './spec.js'

function App() {
  
    const [specification, setSpecification] = useState(() => cloneSpecification(defaultSpecification));

    return (
        <div style = {{backgroundColor: colors.gray,
                       color: colors.textWhite,
                       width: "100vw",
                       height: "100vh"}}>
            {specification.title || "SimPDE!"}
            <Sim specification = {specification}
                setSpecification = {setSpecification}
            />
        </div>
		
  );
}

export default App;
