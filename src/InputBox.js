
import React, { useState, useEffect, useRef} from 'react';
import {colors} from './colors.js'
import {admitSetting, coerceSetting} from './spec.js';

function InputBox(props) {

    var updateParent = (props.parentUpdateDiv ? props.parentUpdateDiv : () => null);
    var tripleUpdateParent = () => {
        setTimeout(updateParent, waitTime * 0.1 * 1000);
        setTimeout(updateParent, waitTime * 0.5 * 1000);
        setTimeout(updateParent, waitTime * 1.1 * 1000);
    }
    const [mode, setMode] = useState("value");
    const waitTime = 0.1;
    var toggleMode = (e) => {   e.preventDefault(); setMode(mode === "value" ? "description" : "value");
                                tripleUpdateParent();
    };
    

    var spec = props.spec;
    var handleChange = props.handleChange;
    var handleBlur = props.handleBlur;
    var stringValue = props.stringValue;
    var candidateValue = coerceSetting(spec, stringValue);
    var errorFlag = candidateValue === undefined || !admitSetting(spec, candidateValue);

    var borderColor = errorFlag ? colors.red : colors.yellow;
    var res = {};

    var inputRef = useRef(null);

    useEffect(() => {var event = new Event('input', {
                        bubbles: true,
                        cancelable: true,
                    });
    if (inputRef.current) inputRef.current.dispatchEvent(event);}, []);

    var inputStyle = {
        fontSize:"1em",
        maxWidth: "100%",
        backgroundColor: colors.gray,
        color: colors.textWhite,
        borderRightStyle: "hidden",
        borderTopStyle: "hidden",
        borderBottomStyle: "hidden",
        borderLeft: "2px solid " + borderColor,
        paddingLeft: "6px",
        overflow: "hidden"
    } 

    var textareaStyle = {
        position: "relative",
        fontSize:"1em",
        maxHeight: "3.5em",
        maxWidth: "100%",
        backgroundColor: colors.gray,
        color: colors.textWhite,
        borderRightStyle: "hidden",
        borderTopStyle: "hidden",
        borderBottomStyle: "hidden",
        borderLeft: "2px solid " + borderColor,
        paddingLeft: "6px",
        overflow: "hidden"
    }

    var handleFocus = (e) => {  e.target.style.borderRight = "2px solid " + borderColor;
                                e.target.style.outline = "none";};
    var handleFocusOut = (e) => {   e.target.style.borderRightStyle = "hidden";
                                    e.target.style.outline = "none";};

    var shrinkSize = (e) => {
        e.target.style.maxHeight = "3.5em";
        tripleUpdateParent();
    }
    var expandSize = (e) => {
        e.target.style.maxHeight = "";
        e.target.style.height = "";
        e.target.style.height = String(e.target.scrollHeight) + "px";
        tripleUpdateParent();
    }

    if (mode === "value") {
        if (Array.isArray(spec.options)) {
            res = <select onChange={handleChange}
                        onBlur={(e) => {handleFocusOut(e); handleBlur(e)}}
                        onFocus={handleFocus}
                        style={inputStyle}
                        id={"settings-input-" + spec.name}
                        value={stringValue}
                        ref={inputRef}>
                    {spec.options.map(option => <option key={String(option.value)} value={option.value}>
                        {option.displayName ?? String(option.value)}
                    </option>)}
                </select>
        }
        else if (spec.type === "int") {
            res = <input  onChange={handleChange}
                        onBlur={(e) => {handleFocusOut(e); handleBlur(e)}}
                        onFocus={handleFocus}
                        style={inputStyle} 
                        id={"settings-input-" + spec.name} 
                        type = "number" 
                        step = "1" 
                        lang="en"
                        value = {stringValue}
                        ref = {inputRef}/>          
        }
        else if (spec.type === "float") {
            res = 
                <input  onChange={handleChange}
                        onBlur={(e) => {handleFocusOut(e); handleBlur(e)}}
                        onFocus={handleFocus}
                        style={inputStyle}
                        id={"settings-input-" + spec.name} 
                        type = "number" 
                        step = "0.01" 
                        lang="en"
                        value = {stringValue} 
                        ref = {inputRef} />
        }
        else if (spec.type === "string") {
            res = <textarea   onChange={(e) => {
                                                handleChange(e); 
                                                updateParent();
                                            }} 
                            onBlur={(e) => {handleFocusOut(e); handleBlur(e); shrinkSize(e)}}
                            onFocus={(e) => {handleFocus(e); expandSize(e);}}
                            onInput={(e) => {e.target.style.height = ""; e.target.style.height = e.target.scrollHeight + "px"}}
                            style={textareaStyle} 
                            spellCheck="false"
                            id={"settings-input-" + spec.name} 
                            value={stringValue} 
                            ref = {inputRef} /> 
        }
    }
    else if (mode === "description") {
        res = <div style = {inputStyle}>
            {spec.description}
        </div>
    }
    


    return (
        <div style = {{ width: "100%",
                        fontSize: "1em",
                        marginTop: "4px"}}>
            <div style = {{ maxWidth: "80%",
                            display: "flex",
                            flexDirection: "column"}}>
                <label  htmlFor={"settings-input-" + spec.name}
                        onMouseEnter = {(e) => {
                            e.target.style.textShadow = "0px 0px 3px " + colors.yellow;
                        }}
                        onMouseLeave = {(e) => {
                            e.target.style.textShadow = "";
                        }} 
                        style = {{cursor: "pointer"}}
                        onClick = {toggleMode}> {spec.displayName} </label>
                {res}
            </div>
        </div>
    );
}

export {InputBox};
