import {cellularAutomatonSettings} from "./cellularAutomaton";
import {
    baseSpecification,
    isCreativeProperty,
    simulationExamples
} from "./examples";
import {
    fragmentShaderComputeSource,
    fragmentShaderFinalizeSource,
    fragmentShaderRhsSource
} from "./shaders";
import {validateSpecification} from "./spec";

describe("built-in simulation examples", () => {
    test("every example is a complete valid configuration/settings pair", () => {
        for (const example of simulationExamples) {
            expect(validateSpecification(example.specification)).toEqual([]);
            expect(Object.keys(example.settings).sort()).toEqual(
                example.specification.vars.map(property => property.name).sort()
            );
            expect(() => fragmentShaderComputeSource(example.specification.vars, example.settings)).not.toThrow();
            if (example.settings.integrationMethod === "rk4") {
                expect(() => fragmentShaderRhsSource(example.specification.vars, example.settings)).not.toThrow();
                expect(() => fragmentShaderFinalizeSource(example.specification.vars, example.settings)).not.toThrow();
            }
        }
    });

    test("all examples preserve the shared Simulation and Visualization base", () => {
        for (const example of simulationExamples) {
            const sharedProperties = example.specification.vars.filter(property => !isCreativeProperty(property));
            expect(sharedProperties).toEqual(baseSpecification.vars);
        }
    });

    test("specialized examples select the intended dimensions and integration", () => {
        const byId = Object.fromEntries(simulationExamples.map(example => [example.id, example]));
        expect(byId.sdnlw.settings.integrationMethod).toBe("semiImplicitEuler");
        expect(byId.sdnlw.settings.timeOrder).toBe(2);

        expect(byId["linear-schrodinger"].settings.valueDimensions).toBe(2);
        expect(byId["linear-schrodinger"].settings.integrationMethod).toBe("rk4");
        expect(byId["linear-schrodinger"].settings.timeOrder).toBe(1);

        expect(byId["navier-stokes-3"].settings.valueDimensions).toBe(3);
        expect(byId["navier-stokes-3"].settings.integrationMethod).toBe("rk4");
        expect(byId["navier-stokes-3"].settings.equation).toContain("u_1_x + u_2_y");

        const automaton = byId["cellular-automaton"];
        expect(automaton.settings).toMatchObject(cellularAutomatonSettings("B3S23"));
        expect(automaton.specification.vars.find(property =>
            property.name === "useCellularAutomatonRule").hidden).toBe(false);
        expect(byId.sdnlw.specification.vars.find(property =>
            property.name === "useCellularAutomatonRule").hidden).toBe(true);
    });
});
