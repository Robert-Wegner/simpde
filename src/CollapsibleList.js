
import React, { useState } from 'react';

function CollapsibleList(props) {
    const [isExpanded, setIsExpanded] = useState(Boolean(props.defaultOpen));
    
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
            <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => setIsExpanded(current => !current)}
                onMouseEnter={(event) => {
                    event.currentTarget.style.textShadow = "0px 0px 3px " + props.borderColor;
                }}
                onMouseLeave={(event) => {
                    event.currentTarget.style.textShadow = "";
                }}
                style={{
                    width: "100%",
                    padding: 0,
                    color: "inherit",
                    background: "transparent",
                    border: 0,
                    font: "inherit",
                    textAlign: "left",
                    cursor: "pointer"
                }}
            >
                <div style = {{fontSize: "1.2em", display: "flex", flexDirection: "row"}}>
                    <div style={{   transition: "transform 0.14s ease",
                                    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                                    marginRight: "8px"}}>
                        {"\u25B7"}
                    </div>
                    {props.title}
                </div>
            </button>
            <div style={{
                display: "grid",
                gridTemplateRows: isExpanded ? "1fr" : "0fr",
                transition: "grid-template-rows 0.14s ease"
            }}>
                <div style={{minHeight: 0, overflow: "hidden"}}>
                <div style = {{
                        display: "flex",
                        flexDirection: "column",
                        jusifyContent: "center",
                        alignItems: "left",
                        marginTop: "4px",
                        paddingBottom: "4px",
                        width: "100%"
                    }}>
                    {props.children}
                </div>
                </div> 
            </div>
            

            
        </div>
    );
}

export {CollapsibleList};
