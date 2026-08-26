import {prepareSettingsInput} from "./Sim";
import {defaultSpecification} from "./spec";

describe("settings JSON preparation", () => {
    test("normalizes and applies a cellular automaton rule", () => {
        const settings = prepareSettingsInput(defaultSpecification, {
            delay: "12",
            useCellularAutomatonRule: " b3s23 "
        });

        expect(settings.delay).toBe(12);
        expect(settings.useCellularAutomatonRule).toBe("B3S23");
        expect(settings.valueDimensions).toBe(1);
        expect(settings.timeOrder).toBe(1);
        expect(settings.integrationMethod).toBe("discrete");
        expect(settings.equation).toContain("u_1_right_above");
    });

    test("rejects invalid supplied values instead of silently replacing them", () => {
        expect(() => prepareSettingsInput(defaultSpecification, {width: 0}))
            .toThrow("'Width' has an invalid value.");
    });
});
