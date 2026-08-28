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
        expect(byId.sdnlw.settings).toMatchObject({
            width: 1050,
            height: 700,
            laplace: 5,
            identity: 0.2,
            derivative: 0.01,
            noiseStrength: 1.2,
            boundaryCondition: 1
        });

        expect(byId["linear-schrodinger"].settings.valueDimensions).toBe(2);
        expect(byId["linear-schrodinger"].settings.integrationMethod).toBe("rk4");
        expect(byId["linear-schrodinger"].settings.timeOrder).toBe(1);
        expect(byId["linear-schrodinger"].settings.nonlinearPower).toBe(3);
        expect(byId["linear-schrodinger"].settings.equation).toContain("nonlinearPower");

        expect(byId["navier-stokes-3"].settings.valueDimensions).toBe(3);
        expect(byId["navier-stokes-3"].settings.integrationMethod).toBe("rk4");
        expect(byId["navier-stokes-3"].settings.equation).toContain("u_1_x + u_2_y");
        expect(byId["navier-stokes-3"].settings.initialDataFunction).toContain("vortexSeparation");

        const ginzburgLandau = byId["ginzburg-landau"];
        expect(ginzburgLandau.settings.initialDataFunction).toContain("[[0.0, 0.0], [0.0, 0.0]]");
        expect(ginzburgLandau.settings.noiseStrength).toBeGreaterThan(0);
        expect(ginzburgLandau.settings.equation).toContain("nonlinearDispersion");

        const swiftHohenberg = byId["swift-hohenberg"];
        expect(swiftHohenberg.settings.initialDataFunction).toContain("[[0.0, 0.0]]");
        expect(swiftHohenberg.settings.noiseStrength).toBeGreaterThan(0);
        expect(swiftHohenberg.settings.noiseStrength).toBe(10);
        expect(swiftHohenberg.settings.equation).toContain("u_1_xxxx");

        expect(byId["heat-equation"].settings.equation).toContain("thermalDiffusivity");

        const capillaryGravity = byId["capillary-gravity-rain"];
        expect(capillaryGravity.settings).toMatchObject({
            timeOrder: 2,
            integrationMethod: "semiImplicitEuler",
            waterDepth: 0.001,
            surfaceTensionOverDensity: 0.000072,
            rainBaseRate: 150,
            boundaryCondition: 0
        });
        expect(capillaryGravity.settings.equation).toContain("u_1_xxxx + 2.0 * u_1_xxyy + u_1_yyyy");
        expect(capillaryGravity.settings.equation).toContain("rainCandidateProbability");
        expect(capillaryGravity.settings.equation).toContain("rainLambda / max(rainLambdaMax");
        expect(capillaryGravity.settings.equation).toContain("rainImpulse * rainKick / max(scaleT");

        const lensWave = byId["lens-wave"];
        expect(lensWave.settings.timeOrder).toBe(2);
        expect(lensWave.settings.equation).toContain("lensCenterX");
        expect(lensWave.settings.equation).toContain("sourceX");
        expect(lensWave.settings).toMatchObject({
            width: 1050,
            height: 700,
            sourceX: -90,
            lensCenterX: 0.19,
            lensSize: 2
        });

        const automaton = byId["cellular-automaton"];
        expect(automaton.settings).toMatchObject(cellularAutomatonSettings("B3S23"));
        expect(automaton.specification.vars.find(property =>
            property.name === "useCellularAutomatonRule").hidden).toBe(false);
        expect(byId.sdnlw.specification.vars.find(property =>
            property.name === "useCellularAutomatonRule").hidden).toBe(true);

        const alternativeAutomaton = byId["alternative-cellular-automaton"];
        expect(alternativeAutomaton.settings).toMatchObject(cellularAutomatonSettings("B3S134567"));
    });
});
