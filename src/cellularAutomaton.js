function parseCellularAutomatonRule(value) {
    const normalized = String(value ?? "").trim().toUpperCase();
    const match = /^B([0-8]*)S([0-8]*)$/.exec(normalized);
    if (!match) {
        throw new Error("Cellular automaton rules use B...S... notation, for example B3S23.");
    }
    const uniqueSorted = digits => [...new Set(digits.split("").map(Number))].sort((a, b) => a - b);
    return {
        rule: `B${uniqueSorted(match[1]).join("")}S${uniqueSorted(match[2]).join("")}`,
        births: uniqueSorted(match[1]),
        survives: uniqueSorted(match[2])
    };
}

function countCondition(counts) {
    if (counts.length === 0) return "false";
    return counts.map(count => `(B > ${(count - 0.4).toFixed(1)} && B < ${(count + 0.4).toFixed(1)})`).join(" || ");
}

function generateCellularAutomatonEquation(value) {
    const {births, survives} = parseCellularAutomatonRule(value);
    return `#
B = u_1_right + u_1_left
    + u_1_above + u_1_below
    + u_1_right_above + u_1_right_below
    + u_1_left_above + u_1_left_below;

A = 0.0;
if (u_1 < 0.4 && (${countCondition(births)})) {
    A = 1.0;
}
else if (u_1 > 0.6 && (${countCondition(survives)})) {
    A = 1.0;
}
if (abs(force) + noiseStrength * abs(noise) > 0.5) {
    A = 1.0;
}
u_1 = A;
u_1_t = 0.0;
u_1_tt = 0.0;
`;
}

function cellularAutomatonSettings(value) {
    const parsed = parseCellularAutomatonRule(value);
    return {
        useCellularAutomatonRule: parsed.rule,
        valueDimensions: 1,
        timeOrder: 1,
        integrationMethod: "discrete",
        equation: generateCellularAutomatonEquation(parsed.rule),
        displayedQuantity: "[`u_1`]"
    };
}

export {
    cellularAutomatonSettings,
    generateCellularAutomatonEquation,
    parseCellularAutomatonRule
};
