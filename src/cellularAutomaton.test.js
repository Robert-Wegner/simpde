import {
    cellularAutomatonSettings,
    generateCellularAutomatonEquation,
    parseCellularAutomatonRule
} from "./cellularAutomaton";

test("Life-like rules are parsed and normalized", () => {
    expect(parseCellularAutomatonRule("b33s322")).toEqual({
        rule: "B3S23",
        births: [3],
        survives: [2, 3]
    });
    expect(() => parseCellularAutomatonRule("23/3")).toThrow(/B\.\.\.S/);
});

test("B3S23 generates the eight-neighbour Conway equation", () => {
    const equation = generateCellularAutomatonEquation("B3S23");
    expect(equation).toContain("u_1_right_above");
    expect(equation).toContain("B > 2.6 && B < 3.4");
    expect(equation).toContain("u_1 = A");
    expect(cellularAutomatonSettings("B3S23")).toMatchObject({
        valueDimensions: 1,
        timeOrder: 1,
        integrationMethod: "discrete",
        displayedQuantity: "[`u_1`]"
    });
});
