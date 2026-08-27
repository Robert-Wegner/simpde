import React, {useEffect, useRef, useState} from "react";
import {cellularAutomatonSettings} from "./cellularAutomaton";
import {findSimulationExample, simulationExamples} from "./examples";
import {launch} from "./launch";
import {SettingsBox} from "./SettingsBox";
import {
    admitSetting,
    cloneSpecification,
    coerceSetting,
    fillDefaultSettings,
    standardDisplayedQuantities,
    standardEquation,
    validateSpecification,
    zeroInitialData
} from "./spec";

function settingsFromWindowHash(specification) {
    if (!window.location.hash) return fillDefaultSettings(specification)({});
    try {
        const parsed = JSON.parse(decodeURIComponent(window.location.hash.slice(1)));
        return fillDefaultSettings(specification)(parsed.settings || parsed);
    }
    catch (error) {
        console.warn("Ignoring invalid settings in the URL:", error.message);
        return fillDefaultSettings(specification)({});
    }
}

function exampleIdFromWindowHash() {
    if (!window.location.hash) return "";
    try {
        const parsed = JSON.parse(decodeURIComponent(window.location.hash.slice(1)));
        return typeof parsed.example === "string" ? parsed.example : "";
    }
    catch (error) {
        return "";
    }
}

function resizeFieldSettings(settings, valueDimensions) {
    const oldDimensions = settings.valueDimensions;
    const patch = {valueDimensions};
    if (settings.equation === standardEquation(oldDimensions)) patch.equation = standardEquation(valueDimensions);
    if (settings.displayedQuantity === standardDisplayedQuantities(oldDimensions)) {
        patch.displayedQuantity = standardDisplayedQuantities(valueDimensions);
    }
    if (settings.initialDataFunction === zeroInitialData(oldDimensions)) {
        patch.initialDataFunction = zeroInitialData(valueDimensions);
    }
    return patch;
}

function prepareSettingsInput(specification, input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new Error("Settings JSON must be an object.");
    }
    const normalized = {...input};
    for (const property of specification.vars) {
        if (!Object.prototype.hasOwnProperty.call(normalized, property.name)) continue;
        let value = coerceSetting(property, normalized[property.name]);
        if (property.effect === "cellularAutomaton" && typeof value === "string") {
            value = value.trim().toUpperCase();
        }
        if (value === undefined || !admitSetting(property, value)) {
            throw new Error(`'${property.displayName}' has an invalid value.`);
        }
        normalized[property.name] = value;
    }

    const automatonProperty = specification.vars.find(property => property.effect === "cellularAutomaton");
    const automatonRule = automatonProperty && normalized[automatonProperty.name];
    if (typeof automatonRule === "string" && automatonRule !== "") {
        Object.assign(normalized, cellularAutomatonSettings(automatonRule));
    }
    return fillDefaultSettings(specification)(normalized);
}

function standardDimensionsForViewport() {
    const isMobile = typeof window.matchMedia === "function"
        ? window.matchMedia("(max-width: 760px)").matches
        : window.innerWidth <= 760;
    // Keep roughly half the pixel workload of the original defaults while
    // preserving the desktop (3:2) and mobile (3:5) viewport proportions.
    return isMobile ? {width: 424, height: 707} : {width: 850, height: 567};
}

function prepareExampleSettings(example) {
    return prepareSettingsInput(example.specification, {
        ...example.settings,
        ...standardDimensionsForViewport()
    });
}

function Sim({specification, setSpecification, theme, setTheme}) {
    const initialSettings = useRef(null);
    if (initialSettings.current === null) {
        const defaultExample = findSimulationExample("sdnlw");
        initialSettings.current = window.location.hash
            ? settingsFromWindowHash(specification)
            : prepareExampleSettings(defaultExample);
    }
    const [settings, setSettings] = useState(initialSettings.current);
    const [runtimeSettings, setRuntimeSettings] = useState(initialSettings.current);
    const [runtimeError, setRuntimeError] = useState("");
    const [selectedExampleId, setSelectedExampleId] = useState(() => exampleIdFromWindowHash() || (window.location.hash ? "" : "sdnlw"));
    const [controlsOpen, setControlsOpen] = useState(false);
    const canvasRef = useRef(null);
    const runtimeRef = useRef(null);

    useEffect(() => {
        setRuntimeError("");
        try {
            runtimeRef.current = launch(canvasRef.current, specification, runtimeSettings);
        }
        catch (error) {
            runtimeRef.current = null;
            setRuntimeError(error instanceof Error ? error.message : String(error));
        }
        return () => {
            runtimeRef.current?.dispose();
            runtimeRef.current = null;
        };
    }, [runtimeSettings, specification]);

    useEffect(() => {
        if (typeof window.matchMedia !== "function") return undefined;
        const mediaQuery = window.matchMedia("(max-width: 760px)");
        const updateBuiltInDimensions = () => {
            if (!selectedExampleId) return;
            const dimensions = standardDimensionsForViewport();
            setSettings(current => {
                if (current.width === dimensions.width && current.height === dimensions.height) return current;
                const nextSettings = {...current, ...dimensions};
                setRuntimeSettings(nextSettings);
                return nextSettings;
            });
        };
        mediaQuery.addEventListener?.("change", updateBuiltInDimensions);
        return () => mediaQuery.removeEventListener?.("change", updateBuiltInDimensions);
    }, [selectedExampleId]);

    function commitSettings(nextSettings, restart) {
        setSettings(nextSettings);
        if (restart) setRuntimeSettings({...nextSettings});
    }

    function handleSettingChange(name, rawValue) {
        const property = specification.vars.find(item => item.name === name);
        if (!property) return;
        let value = coerceSetting(property, rawValue);
        if (property.effect === "cellularAutomaton" && typeof value === "string") {
            value = value.trim().toUpperCase();
        }
        if (value === undefined || !admitSetting(property, value)) {
            setRuntimeError(`'${property.displayName}' has an invalid value.`);
            return;
        }
        if (value === settings[name]) return;

        let patch = {[name]: value};
        try {
            if (property.effect === "cellularAutomaton" && value.trim() !== "") {
                patch = cellularAutomatonSettings(value);
            }
            else if (property.effect === "resizeFields") {
                patch = resizeFieldSettings(settings, value);
            }
        }
        catch (error) {
            setRuntimeError(error.message);
            return;
        }

        const nextSettings = fillDefaultSettings(specification)({...settings, ...patch});
        const restart = property.restartOnChange || Object.keys(patch).some(changedName =>
            specification.vars.find(item => item.name === changedName)?.restartOnChange
        );
        setRuntimeError("");
        setSelectedExampleId("");
        commitSettings(nextSettings, restart);
        if (!restart) {
            for (const [changedName, changedValue] of Object.entries(patch)) {
                runtimeRef.current?.updateSetting(changedName, changedValue);
            }
        }
    }

    function applySettings(input) {
        const nextSettings = prepareSettingsInput(specification, input);
        setRuntimeError("");
        setSelectedExampleId("");
        commitSettings(nextSettings, true);
    }

    function applySpecification(input) {
        const errors = validateSpecification(input);
        if (errors.length > 0) throw new Error(errors.join("\n"));
        const nextSpecification = cloneSpecification(input);
        const nextSettings = fillDefaultSettings(nextSpecification)(settings);
        setSpecification(nextSpecification);
        setRuntimeError("");
        setSelectedExampleId("");
        commitSettings(nextSettings, true);
    }

    function applyExample(id) {
        if (!id) {
            setSelectedExampleId("");
            return;
        }
        const example = findSimulationExample(id);
        if (!example) {
            setRuntimeError(`Unknown example '${id}'.`);
            return;
        }
        try {
            const nextSpecification = cloneSpecification(example.specification);
            const errors = validateSpecification(nextSpecification);
            if (errors.length > 0) throw new Error(errors.join("\n"));
            const nextSettings = prepareExampleSettings(example);
            setSpecification(nextSpecification);
            setRuntimeError("");
            setSelectedExampleId(id);
            commitSettings(nextSettings, true);
            window.history.replaceState(null, "", `#${encodeURIComponent(JSON.stringify({example: id, settings: nextSettings}))}`);
        }
        catch (error) {
            setRuntimeError(error instanceof Error ? error.message : String(error));
        }
    }

    return <div id="Sim" className="simulation-viewport">
        <canvas
            id="canvas"
            className="simulation-canvas"
            aria-label="Simulation canvas"
            style={{touchAction: "none"}}
            width={settings.width}
            height={settings.height}
            ref={canvasRef}
        />
        <aside className={`control-drawer${controlsOpen ? " control-drawer--open" : ""}`}>
            <div className="control-drawer__bar">
                <button
                    type="button"
                    className="control-drawer__toggle"
                    aria-expanded={controlsOpen}
                    aria-controls="control-panel"
                    onClick={() => setControlsOpen(current => !current)}
                >
                    <span className="control-drawer__chevron">▷</span>
                    Controls
                </button>
                <button
                    type="button"
                    className="ui-button control-drawer__restart"
                    onClick={() => setRuntimeSettings({...settings})}
                >Restart</button>
            </div>
            <div id="control-panel" className="control-drawer__panel" aria-hidden={!controlsOpen}>
                <SettingsBox
                    specification={specification}
                    settings={settings}
                    handleSettingChange={handleSettingChange}
                    onApplySettings={applySettings}
                    onApplySpecification={applySpecification}
                    examples={simulationExamples}
                    selectedExampleId={selectedExampleId}
                    onSelectExample={applyExample}
                    runtimeError={runtimeError}
                    theme={theme}
                    onToggleTheme={() => setTheme(current => current === "dark" ? "light" : "dark")}
                />
            </div>
        </aside>
    </div>;
}

export {
    Sim,
    prepareSettingsInput,
    prepareExampleSettings,
    resizeFieldSettings,
    standardDimensionsForViewport,
    settingsFromWindowHash
};
