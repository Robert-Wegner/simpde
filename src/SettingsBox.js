import React, {useEffect, useState} from "react";
import {Scrollbars} from "react-custom-scrollbars-2";
import {CollapsibleList} from "./CollapsibleList";
import {SIMPDE_EXPLANATION_PROMPT} from "./explanationPrompt";
import {InputBox} from "./InputBox";
import {colors} from "./colors";

function stringifySettings(specification, settings) {
    const result = {};
    for (const property of specification.vars) {
        const value = settings[property.name];
        if (property.type === "float" && Number.isFinite(value)) result[property.name] = String(value);
        else result[property.name] = String(value ?? "");
    }
    return result;
}

function JsonEditor({name, title, description, value, onApply, parentUpdateDiv}) {
    const [textValue, setTextValue] = useState(value);
    const [message, setMessage] = useState("");
    useEffect(() => setTextValue(value), [value]);

    const apply = rawValue => {
        try {
            const parsed = JSON.parse(rawValue);
            onApply(parsed);
            setMessage("Applied.");
        }
        catch (error) {
            setMessage(error.message);
        }
        if (parentUpdateDiv) window.setTimeout(parentUpdateDiv, 0);
    };

    return <div style={{width: "100%"}}>
        <InputBox
            spec={{name, displayName: title, description, type: "string"}}
            stringValue={textValue}
            handleChange={event => {
                setTextValue(event.target.value);
                setMessage("");
            }}
            handleBlur={event => apply(event.target.value)}
            parentUpdateDiv={parentUpdateDiv}
        />
        {message && <div
            role={message === "Applied." ? "status" : "alert"}
            style={{color: message === "Applied." ? colors.cyan : colors.red, margin: "4px 0 0 6px"}}
        >{message}</div>}
    </div>;
}

async function writeClipboard(text) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) throw new Error("The browser did not allow clipboard access.");
}

function combinedClipboardText(parts) {
    return parts.map(({heading, content}) => `${heading}\n\n${content}`).join("\n\n---\n\n");
}

function CopyButton({children, text, onResult}) {
    const copy = async () => {
        try {
            await writeClipboard(text);
            onResult({text: `Copied ${children.replace(/^Copy /, "").toLowerCase()}.`, error: false});
        }
        catch (error) {
            onResult({text: error.message, error: true});
        }
    };

    return <button
        type="button"
        onClick={copy}
        onMouseEnter={event => {
            event.currentTarget.style.textShadow = `0px 0px 3px ${colors.yellow}`;
            event.currentTarget.style.boxShadow = `0px 0px 5px ${colors.yellow}`;
        }}
        onMouseLeave={event => {
            event.currentTarget.style.textShadow = "";
            event.currentTarget.style.boxShadow = "";
        }}
        style={{
            width: "100%",
            padding: "4px 6px",
            backgroundColor: colors.gray,
            color: colors.textWhite,
            border: `1px solid ${colors.yellow}`,
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "left"
        }}
    >{children}</button>;
}

function SettingsBox({
    specification,
    settings,
    handleSettingChange,
    onApplySettings,
    onApplySpecification,
    examples = [],
    selectedExampleId = "",
    onSelectExample,
    runtimeError,
    theme = "dark",
    onToggleTheme
}) {
    const [stringSettings, setStringSettings] = useState(() => stringifySettings(specification, settings));
    const [copyMessage, setCopyMessage] = useState(null);
    useEffect(() => setStringSettings(stringifySettings(specification, settings)), [specification, settings]);

    const settingsJson = JSON.stringify(settings, null, 2);
    const specificationJson = JSON.stringify(specification, null, 2);
    const settingsAndPrompt = combinedClipboardText([
        {heading: "CURRENT SETTINGS JSON", content: settingsJson},
        {heading: "SIMPDE EXPLANATION PROMPT", content: SIMPDE_EXPLANATION_PROMPT}
    ]);
    const specificationAndPrompt = combinedClipboardText([
        {heading: "APPLICATION CONFIGURATION JSON", content: specificationJson},
        {heading: "SIMPDE EXPLANATION PROMPT", content: SIMPDE_EXPLANATION_PROMPT}
    ]);
    const everything = combinedClipboardText([
        {heading: "APPLICATION CONFIGURATION JSON", content: specificationJson},
        {heading: "CURRENT SETTINGS JSON", content: settingsJson},
        {heading: "SIMPDE EXPLANATION PROMPT", content: SIMPDE_EXPLANATION_PROMPT}
    ]);

    const groupPaths = (group, path) => {
        const currentPath = `${path}/${group.name}`;
        return [currentPath, ...group.subgroups.flatMap(subgroup => groupPaths(subgroup, currentPath))];
    };

    const renderGroup = (group, path, depth) => {
        const currentPath = `${path}/${group.name}`;
        const borderColor = depth % 2 === 0 ? colors.cyan : colors.magenta;
        const paths = new Set(groupPaths(group, path));
        return <CollapsibleList title={group.displayName} key={currentPath} borderColor={borderColor}>
            {specification.vars
                .filter(property => paths.has(property.group) && property.hidden !== true)
                .map(property => <InputBox
                    key={`${currentPath}/${property.name}`}
                    spec={property}
                    stringValue={stringSettings[property.name]}
                    value={settings[property.name]}
                    handleChange={event => setStringSettings(current => ({
                        ...current,
                        [property.name]: event.target.value
                    }))}
                    handleBlur={event => handleSettingChange(property.name, event.target.value)}
                />)}
        </CollapsibleList>;
    };

    const rootPath = `/${specification.group.name}`;
    const configurationNames = new Set(["input", "model", "visual"]);
    const configurationGroups = specification.group.subgroups.filter(group => configurationNames.has(group.name));
    const operationGroups = specification.group.subgroups.filter(group => !configurationNames.has(group.name));

    return <div className="settings-box" style={{display: "flex", flexDirection: "column"}}>
        <div className="settings-box__header">
            <span className="settings-box__heading">Controls</span>
            <button
                type="button"
                className="ui-button"
                onClick={onToggleTheme}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
                {theme === "dark" ? "☀ Light" : "◐ Dark"}
            </button>
        </div>
        <Scrollbars
            style={{
                width: "100%",
                flex: "1 1 auto",
                borderTop: `1px solid ${colors.textWhite}`,
                borderBottom: `1px solid ${colors.textWhite}`,
                fontFamily: "Consolas,Monaco,Lucida Console,Liberation Mono,DejaVu Sans Mono,Bitstream Vera Sans Mono,Courier New"
            }}
            renderThumbVertical={() => <div style={{display: "none"}} />}
            renderTrackHorizontal={props => <div {...props} style={{display: "none"}} className="track-horizontal" />}
        >
            <div style={{overflowX: "hidden", paddingRight: "10px"}}>
                <CollapsibleList title="Configuration" borderColor={colors.cyan} defaultOpen>
                    {configurationGroups.map(group => renderGroup(group, rootPath, 1))}
                    <CollapsibleList title="Examples" borderColor={colors.magenta}>
                        <InputBox
                            spec={{
                                name: "simulationExample",
                                displayName: "Load example",
                                description: "Load a preset simulation.",
                                type: "string",
                                options: [
                                    {value: "", displayName: "Custom / modified"},
                                    ...examples.map(example => ({value: example.id, displayName: example.name}))
                                ]
                            }}
                            stringValue={selectedExampleId}
                            handleChange={event => onSelectExample?.(event.target.value)}
                            handleBlur={() => {}}
                        />
                        {selectedExampleId && <div style={{color: colors.cyan, margin: "6px"}}>
                            {examples.find(example => example.id === selectedExampleId)?.description}
                        </div>}
                    </CollapsibleList>
                </CollapsibleList>

                <div className="settings-separator" aria-hidden="true" />

                <CollapsibleList title="Simulation & data" borderColor={colors.magenta}>
                    {operationGroups.map(group => renderGroup(group, rootPath, 1))}
                    <CollapsibleList title="JSON interfaces" borderColor={colors.cyan}>
                        <div style={{width: "80%", display: "grid", gap: "5px", marginTop: "4px"}}>
                            <CopyButton text={settingsJson} onResult={setCopyMessage}>Copy settings</CopyButton>
                            <CopyButton text={SIMPDE_EXPLANATION_PROMPT} onResult={setCopyMessage}>Copy prompt</CopyButton>
                            <CopyButton text={settingsAndPrompt} onResult={setCopyMessage}>Copy settings + prompt</CopyButton>
                            <CopyButton text={specificationJson} onResult={setCopyMessage}>Copy configuration</CopyButton>
                            <CopyButton text={specificationAndPrompt} onResult={setCopyMessage}>Copy configuration + prompt</CopyButton>
                            <CopyButton text={everything} onResult={setCopyMessage}>Copy configuration + settings + prompt</CopyButton>
                            {copyMessage && <div
                                role={copyMessage.error ? "alert" : "status"}
                                style={{color: copyMessage.error ? colors.red : colors.cyan, marginLeft: "6px"}}
                            >
                                {copyMessage.text}
                            </div>}
                        </div>
                        <JsonEditor
                            name="currentSettingsJson"
                            title="Settings"
                            description="Paste a settings JSON object. It is validated and applied when this field loses focus."
                            value={settingsJson}
                            onApply={onApplySettings}
                        />
                        <JsonEditor
                            name="applicationConfigurationJson"
                            title="Configuration"
                            description="Paste an application specification JSON object. It is validated and applied when this field loses focus."
                            value={specificationJson}
                            onApply={onApplySpecification}
                        />
                    </CollapsibleList>
                </CollapsibleList>
                {runtimeError && <div role="alert" style={{color: colors.red, whiteSpace: "pre-wrap", margin: "8px"}}>
                    {runtimeError}
                </div>}
            </div>
        </Scrollbars>
    </div>;
}

export {combinedClipboardText, JsonEditor, SettingsBox, stringifySettings, writeClipboard};
