import {
    finiteDifferenceCoefficients,
    generateNecessaryVariables,
    parseDerivativeReferences
} from "./processEquation";

test("finite-difference coefficients have the intended sign and order", () => {
    expect(finiteDifferenceCoefficients(1)).toEqual([-1, 1]);
    expect(finiteDifferenceCoefficients(2)).toEqual([1, -2, 1]);
    expect(finiteDifferenceCoefficients(3)).toEqual([-1, 3, -3, 1]);
});

test("higher, mixed, and time-derivative references are parsed", () => {
    expect(parseDerivativeReferences("u_1_xxx + u_2_t_xy", 2)).toEqual([
        {name: "u_1_xxx", field: 1, timeDerivative: false, orderX: 3, orderY: 0},
        {name: "u_2_t_xy", field: 2, timeDerivative: true, orderX: 1, orderY: 1}
    ]);
});

test("generated derivatives use the correct texture channel and scaling", () => {
    const settings = {
        valueDimensions: 2,
        equation: "# u_1_tt = u_1_x; # u_2_tt = u_2_t_yy;",
        displayedQuantity: "[`u_1`, `u_2`]"
    };
    const source = generateNecessaryVariables(
        settings,
        (dimensions, field, x, y, channel) => `sample(${dimensions},${field},${x},${y},${channel})`
    );
    expect(source).toContain("sample(2,1,1,0,r)");
    expect(source).toContain("sample(2,2,0,1,g)");
    expect(source).toContain("pow(scaleX, -1.0)");
    expect(source).toContain("pow(scaleY, -2.0)");
});
