import {
    defaultSettings,
    defaultSpecification,
    fillDefaultSettings,
    standardEquation,
    validateSpecification
} from "./spec";

test("the application specification is JSON serializable and valid", () => {
    const serialized = JSON.stringify(defaultSpecification);
    const parsed = JSON.parse(serialized);
    expect(validateSpecification(parsed)).toEqual([]);
    const containsFunctionValue = value => {
        if (typeof value === "function") return true;
        if (Array.isArray(value)) return value.some(containsFunctionValue);
        if (value && typeof value === "object") return Object.values(value).some(containsFunctionValue);
        return false;
    };
    expect(containsFunctionValue(defaultSpecification)).toBe(false);
    expect(defaultSettings.integrationMethod).toBe("semiImplicitEuler");
    expect(defaultSettings.timeOrder).toBe(2);
});

test("legacy settings and equation names migrate into the current schema", () => {
    const settings = fillDefaultSettings(defaultSpecification)({
        laplacian: 2,
        noise: 0.25,
        valueDimensions: 1,
        equation: "# u_1_tt = u_laplace * Delta_u_1 + u_noise * noise;",
        displayedQuantity: "[`u_1`]",
        initialDataFunction: "(x, y) => [[0, 0]]"
    });
    expect(settings.laplace).toBe(2);
    expect(settings.noiseStrength).toBe(0.25);
    expect(settings.equation).toContain("laplace * (u_1_xx + u_1_yy)");
    expect(settings.equation).toContain("noiseStrength * noise");
});

test("the standard equation has exactly one section per field", () => {
    expect(standardEquation(3).split("#")).toHaveLength(4);
});
