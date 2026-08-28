import './App.css';
import React, { useEffect, useState } from 'react';
import {Sim} from './Sim.js';
import {findSimulationExample} from './examples.js';
import {cloneSpecification, defaultSpecification} from './spec.js'

function exampleIdFromWindowLocation() {
    if (typeof window === "undefined") return "";
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const pathCandidate = decodeURIComponent(pathParts.at(-1) || "");
    if (findSimulationExample(pathCandidate)) return pathCandidate;
    if (!window.location.hash) return "";
    try {
        const parsed = JSON.parse(decodeURIComponent(window.location.hash.slice(1)));
        return typeof parsed.example === "string" && findSimulationExample(parsed.example)
            ? parsed.example
            : "";
    }
    catch (error) {
        return "";
    }
}

function App() {
    const initialExampleId = exampleIdFromWindowLocation();
    const [specification, setSpecification] = useState(() => cloneSpecification(
        initialExampleId
            ? findSimulationExample(initialExampleId).specification
            : typeof window !== "undefined" && window.location.hash
                ? defaultSpecification
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
