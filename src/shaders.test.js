import {
    fragmentShaderCombinationSource,
    fragmentShaderComputeSource,
    fragmentShaderFinalizeSource,
    fragmentShaderRhsSource,
    parseDisplayedQuantities,
    readTexture,
    splitEquation
} from "./shaders";
import {defaultSettings, defaultSpecification} from "./spec";

test("multi-field texture lookup addresses fields from the top without negative slabs", () => {
    expect(readTexture(2, 1, 0, 0, "r")).toContain("1.0 * h");
    expect(readTexture(2, 2, 0, 0, "r")).toContain("0.0 * h");
});

test("compute shaders restore central value and time-derivative state", () => {
    const source = fragmentShaderComputeSource(defaultSpecification.vars, defaultSettings);
    expect(source).toMatch(/float u_1 = texture\(/);
    expect(source).toMatch(/float u_1_t = texture\(/);
    expect(source).toContain("u_1_t = u_1_t + scaleT * u_1_tt");
    expect(source).toContain("u_1 = u_1 + scaleT * u_1_t");
});

test("equation sections and displayed quantities are validated before GLSL compilation", () => {
    expect(splitEquation("shared#first#second", 2)).toEqual(["shared", "first", "second"]);
    expect(() => splitEquation("#only one", 2)).toThrow(/2 field sections/);
    expect(parseDisplayedQuantities("[`u_1`, \"u_2_x\"]", 2)).toEqual(["u_1", "u_2_x"]);
});

test("first-order Euler and discrete updates omit second-order integration", () => {
    const firstOrder = fragmentShaderComputeSource(defaultSpecification.vars, {
        ...defaultSettings,
        timeOrder: 1,
        integrationMethod: "semiImplicitEuler"
    });
    expect(firstOrder).toContain("u_1 = u_1 + scaleT * u_1_t");
    expect(firstOrder).not.toContain("u_1_t = u_1_t + scaleT * u_1_tt");

    const discrete = fragmentShaderComputeSource(defaultSpecification.vars, {
        ...defaultSettings,
        integrationMethod: "discrete"
    });
    expect(discrete).not.toContain("u_1 = u_1 + scaleT * u_1_t");
    expect(discrete).not.toContain("u_1_t = u_1_t + scaleT * u_1_tt");
});

test("RK4 shaders expose a full-state RHS, weighted stages, and final display pass", () => {
    const settings = {...defaultSettings, timeOrder: 1, integrationMethod: "rk4"};
    const rhs = fragmentShaderRhsSource(defaultSpecification.vars, settings);
    const combination = fragmentShaderCombinationSource();
    const finalize = fragmentShaderFinalizeSource(defaultSpecification.vars, settings);

    expect(rhs).toContain("outColor = vec4(vec2(u_1_t, 0.0), 0.0, 0.0)");
    expect(combination).toContain("derivativeWeights.w * texture(derivative4");
    expect(combination).toContain("base.rg + scaleT * increment");
    expect(finalize).toContain("outColor = vec4(stored_u_1, u_1_t, t");
});
