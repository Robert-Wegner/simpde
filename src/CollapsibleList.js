
import React, { useState, useRef } from 'react';

function CollapsibleList(props) {

    const [animationState, setAnimationState] = useState("contracted");

    const growRef = useRef(null);
    const wrapperRef = useRef(null);


    const waitTime = 0.1;
    var updateDiv = () => {
        var growDiv = growRef.current;
        var wrapper = wrapperRef.current;
        if (!growDiv || !wrapper) return;
        growDiv.style.height = wrapper.clientHeight + "px";
        setTimeout(() => (props.parentUpdateDiv) ? props.parentUpdateDiv() : (() => null)(), waitTime * 0.1 * 1000);
        //setTimeout(() => (props.parentUpdateDiv) ? props.parentUpdateDiv() : (() => null)(), waitTime * 0.5 * 1000);
        setTimeout(() => (props.parentUpdateDiv) ? props.parentUpdateDiv() : (() => null)(), waitTime * 1.2 * 1000);
    }
    var growDiv = () => {
        var growDiv = growRef.current;
        if (!growDiv) return;
        if (animationState === "extended") {
          growDiv.style.height = 0;
        } else {
          var wrapper = wrapperRef.current;
          if (!wrapper) return;
          growDiv.style.height = wrapper.clientHeight + "px";
        }
        setTimeout(() => (props.parentUpdateDiv) ? props.parentUpdateDiv() : (() => null)(), waitTime * 0.1 * 1000);
        setTimeout(() => (props.parentUpdateDiv) ? props.parentUpdateDiv() : (() => null)(), waitTime * 0.5 * 1000);
        setTimeout(() => (props.parentUpdateDiv) ? props.parentUpdateDiv() : (() => null)(), waitTime * 1.1 * 1000);
        //setTimeout(() => (props.parentUpdateDiv) ? props.parentUpdateDiv() : (() => null)(), waitTime * 1.4 * 1000);
    }

    var transitionStyle = { MozTransition: "height " + String(waitTime) + "s ease",
                            msTransition: "height " + String(waitTime) + "s ease",
                            OTransition: "height " + String(waitTime) + "s ease",
                            WebkitTransition: "height " + String(waitTime) + "s ease",
                            transition: "height " + String(waitTime) + "s ease",
                            height: 0,
                            overflow: "hidden"};
    
    return (
        <div style={{
                borderLeft: "2px solid " + props.borderColor,
                //boxShadow: "-5px 0px 5px -3px " + props.borderColor,
                display: "flex",
                flexDirection: "column",
                position: "relative",
                paddingLeft: "10px",
                paddingTop: "4px",
                marginTop: "4px",
                marginBottom: "4px",
                width: "100%"
            }} 
        >
            <div    onClick = {() => {  growDiv();
                                        setAnimationState(animationState === "extended" ? "contracted" : "extended"); 
                                    }}
                    onMouseEnter = {(e) => {
                        e.target.style.textShadow = "0px 0px 3px " + props.borderColor;
                    }}
                    onMouseLeave = {(e) => {
                        e.target.style.textShadow = "";
                    }}
                    style = {{  width: "100%",
                                cursor: "pointer"
                            }}

            > 
                <div style = {{fontSize: "1.2em", display: "flex", flexDirection: "row"}}>
                    <div style={{   MozTransition: "transform " + String(waitTime) + "s ease",
                                    msTransition: "transform " + String(waitTime) + "s ease",
                                    OTransition: "transform " + String(waitTime) + "s ease",
                                    WebkitTransition: "transform " + String(waitTime) + "s ease",
                                    transition: "transform " + String(waitTime) + "s ease",
                                    transform: animationState === "extended" ? "rotate(90deg)" : "rotate(0deg)", 
                                    marginRight: "8px"}}>
                        {"\u25B7"}
                    </div>
                    {props.title}
                </div>
            </div>
            <div ref = {growRef} style = {transitionStyle}
            > 
                <div ref = {wrapperRef}> 
                <div style = {{
                        display: "flex",
                        flexDirection: "column",
                        jusifyContent: "center",
                        alignItems: "left",
                        marginTop: "4px",
                        paddingBottom: "4px",
                        width: "100%"
                    }}>
                    {React.Children.map(props.children, child =>
                        React.isValidElement(child) && typeof child.type !== "string"
                            ? React.cloneElement(child, {parentUpdateDiv: updateDiv})
                            : child
                    )}
                </div>
                </div> 
            </div>
            

            
        </div>
    );
}

export {CollapsibleList};
