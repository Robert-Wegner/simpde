"use client";

import {useEffect, useState} from "react";

export default function HomePage() {
    const [Simulator, setSimulator] = useState(null);

    useEffect(() => {
        let active = true;
        import("../src/App").then(({default: App}) => {
            if (active) setSimulator(() => App);
        });
        return () => {
            active = false;
        };
    }, []);

    return Simulator ? <Simulator /> : null;
}
