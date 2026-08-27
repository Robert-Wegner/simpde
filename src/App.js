import './App.css';
import React, { useEffect, useState } from 'react';
import {Sim} from './Sim.js';
import {findSimulationExample} from './examples.js';
import {cloneSpecification, defaultSpecification} from './spec.js'

function exampleIdFromWindowHash() {
    if (typeof window === "undefined" || !window.location.hash) return "";
    try {
        const parsed = JSON.parse(decodeURIComponent(window.location.hash.slice(1)));
        return typeof parsed.example === "string" ? parsed.example : "";
    }
    catch (error) {
        return "";
    }
}

function App() {
    const [specification, setSpecification] = useState(() => cloneSpecification(
        typeof window !== "undefined" && window.location.hash
            ? findSimulationExample(exampleIdFromWindowHash())?.specification || defaultSpecification
            : findSimulationExample("sdnlw")?.specification || defaultSpecification
    ));
    const [theme, setTheme] = useState(() => {
        const savedTheme = window.localStorage?.getItem("simpde-theme");
        return savedTheme === "light" ? "light" : "dark";
    });

    useEffect(() => {
        window.localStorage?.setItem("simpde-theme", theme);
    }, [theme]);

    return (
        <main className="app" data-theme={theme}>
            <Sim specification = {specification}
                setSpecification = {setSpecification}
                theme={theme}
                setTheme={setTheme}
            />
        </main>
    );
}

export default App;
