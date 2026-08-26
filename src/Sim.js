import React, {useEffect, useRef, useState} from "react";
import {cellularAutomatonSettings} from "./cellularAutomaton";
import {colors} from "./colors";
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

function Sim({specification, setSpecification}) {
    const initialSettings = useRef(null);
    if (initialSettings.current === null) initialSettings.current = settingsFromWindowHash(specification);
    const [settings, setSettings] = useState(initialSettings.current);
    const [runtimeSettings, setRuntimeSettings] = useState(initialSettings.current);
    const [runtimeError, setRuntimeError] = useState("");
    const [selectedExampleId, setSelectedExampleId] = useState(() => window.location.hash ? "" : "sdnlw");
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
            const nextSettings = prepareSettingsInput(nextSpecification, example.settings);
            setSpecification(nextSpecification);
            setRuntimeError("");
            setSelectedExampleId(id);
            commitSettings(nextSettings, true);
        }
        catch (error) {
            setRuntimeError(error instanceof Error ? error.message : String(error));
        }
    }

    return <div id="Sim" style={{
        backgroundColor: colors.gray,
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-evenly"
    }}>
        <canvas
            id="canvas"
            aria-label="Simulation canvas"
            style={{touchAction: "none", width: "70vw"}}
            width={settings.width}
            height={settings.height}
            ref={canvasRef}
        />
        <SettingsBox
            specification={specification}
            settings={settings}
            handleSettingChange={handleSettingChange}
            handleReset={() => setRuntimeSettings({...settings})}
            onApplySettings={applySettings}
            onApplySpecification={applySpecification}
            examples={simulationExamples}
            selectedExampleId={selectedExampleId}
            onSelectExample={applyExample}
            runtimeError={runtimeError}
        />
    </div>;
}

export {
    Sim,
    prepareSettingsInput,
    resizeFieldSettings,
    settingsFromWindowHash
};
