import {cellularAutomatonSettings} from "./cellularAutomaton";
import {
    cloneSpecification,
    defaultSpecification,
    fillDefaultSettings
} from "./spec";

const CREATIVE_GROUP_PREFIXES = ["/settings/input", "/settings/model"];

function isCreativeProperty(property) {
    return CREATIVE_GROUP_PREFIXES.some(prefix => property.group.startsWith(prefix));
}

const baseSpecification = {
    ...cloneSpecification(defaultSpecification),
    vars: cloneSpecification(defaultSpecification).vars.filter(property => !isCreativeProperty(property))
};

const standardCreativeProperties = cloneSpecification(defaultSpecification).vars.filter(isCreativeProperty);

function changeProperty(property, changes) {
    const changed = {...property, ...changes};
    if (Object.prototype.hasOwnProperty.call(changes, "defaultValue")) delete changed.defaultValueGenerator;
    if (Object.prototype.hasOwnProperty.call(changes, "defaultValueGenerator")) delete changed.defaultValue;
    return changed;
}

function creativeProperties({overrides = {}, extraProperties = []} = {}) {
    return standardCreativeProperties
        .map(property => changeProperty(property, overrides[property.name] || {}))
        .concat(extraProperties.map(property => ({...property})));
}

function composeExampleSpecification(title, creativeOptions) {
    return {
        ...cloneSpecification(baseSpecification),
        title,
        vars: [
            ...cloneSpecification(baseSpecification.vars),
            ...creativeProperties(creativeOptions)
        ]
    };
}

function completeSettings(specification, settings) {
    return fillDefaultSettings(specification)(settings);
}

const sdnlwSpecification = composeExampleSpecification("SimPDE! — SDNLW", {
    overrides: {
        noiseStrength: {defaultValue: 0.1},
        laplace: {defaultValue: 2}
    }
});
const sdnlwSettings = completeSettings(sdnlwSpecification, {
    valueDimensions: 1,
    laplace: 2,
    noiseStrength: 0.1
});

const schrodingerSpecification = composeExampleSpecification("SimPDE! — Linear Schrödinger wave packet", {
    overrides: {
        inputRadius: {hidden: true},
        inputStrength: {hidden: true, defaultValue: 0},
        initialDataFunction: {
            defaultValue: "(x, y) => { const dx = x - packetCenterX; const dy = y - packetCenterY; const amplitude = Math.exp(-(dx * dx + dy * dy) / (2.0 * packetSigma * packetSigma)); const phase = waveNumberX * x + waveNumberY * y; return [[amplitude * Math.cos(phase), 0.0], [amplitude * Math.sin(phase), 0.0]]; }",
            description: "JavaScript initial data for the real and imaginary parts of the wavefunction. The packet settings below are available by name."
        },
        laplace: {hidden: true},
        identity: {hidden: true},
        derivative: {hidden: true},
        cubic: {hidden: true},
        noiseStrength: {hidden: true},
        useCellularAutomatonRule: {hidden: true},
        equation: {
            defaultValue: "#\nA = 0.5 * trapStrength * (x * x + y * y);\nu_1_t = -kinetic * (u_2_xx + u_2_yy) + A * u_2;\n#\nA = 0.5 * trapStrength * (x * x + y * y);\nu_2_t = kinetic * (u_1_xx + u_1_yy) - A * u_1;\n",
            description: "GLSL for the coupled real and imaginary parts of i ψ_t = (-kinetic Δ + V) ψ."
        }
    },
    extraProperties: [
        {
            name: "packetSigma", displayName: "Packet width", group: "/settings/input/basic",
            type: "float", exclusiveMinimum: 0, defaultValue: 3, restartOnChange: true,
            description: "Gaussian standard deviation used by the JavaScript initial-data function."
        },
        {
            name: "packetCenterX", displayName: "Packet center X", group: "/settings/input/basic",
            type: "float", defaultValue: -25, restartOnChange: true,
            description: "Horizontal center of the initial Gaussian packet."
        },
        {
            name: "packetCenterY", displayName: "Packet center Y", group: "/settings/input/basic",
            type: "float", defaultValue: 0, restartOnChange: true,
            description: "Vertical center of the initial Gaussian packet."
        },
        {
            name: "waveNumberX", displayName: "Wave number X", group: "/settings/input/basic",
            type: "float", defaultValue: 2, restartOnChange: true,
            description: "Horizontal phase gradient of the initial wave packet."
        },
        {
            name: "waveNumberY", displayName: "Wave number Y", group: "/settings/input/basic",
            type: "float", defaultValue: 0, restartOnChange: true,
            description: "Vertical phase gradient of the initial wave packet."
        },
        {
            name: "kinetic", displayName: "Kinetic coefficient", group: "/settings/model/basic",
            type: "float", minimum: 0, defaultValue: 5,
            uniformName: "kinetic", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Coefficient multiplying the Laplacian in the Schrödinger Hamiltonian."
        },
        {
            name: "trapStrength", displayName: "Harmonic trap strength", group: "/settings/model/basic",
            type: "float", minimum: 0, defaultValue: 0,
            uniformName: "trapStrength", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Strength of V(x,y) = trapStrength (x² + y²) / 2."
        }
    ]
});

const schrodingerSettings = completeSettings(schrodingerSpecification, {
    width: 400,
    height: 800,
    scaleT: 0.002,
    scaleX: 0.25,
    scaleY: 0.25,
    speed: 2,
    delay: 16,
    valueDimensions: 2,
    timeOrder: 1,
    integrationMethod: "rk4",
    inputStrength: 0,
    packetSigma: 3,
    packetCenterX: -25,
    packetCenterY: 0,
    waveNumberX: 2,
    waveNumberY: 0,
    kinetic: 5,
    trapStrength: 0,
    boundaryCondition: 1,
    colorSensitivity: 1.5,
    colorMixRatio: 0.25,
    colorExponent: 0.6,
    displayedQuantity: "[`1i u_2`, `u_1 * u_1 + u_2 * u_2`]"
});

const navierStokesSpecification = composeExampleSpecification("SimPDE! — 3-component Navier–Stokes", {
    overrides: {
        inputRadius: {hidden: true},
        inputStrength: {hidden: true, defaultValue: 0},
        initialDataFunction: {
            defaultValue: "(x, y) => { const k = vortexWaveNumber; const a = vortexAmplitude; const e = perturbation; const u = a * (Math.sin(k * x) * Math.cos(k * y) + e * Math.sin(2.0 * k * y)); const v = a * (-Math.cos(k * x) * Math.sin(k * y) + e * Math.sin(2.0 * k * x)); const p = -0.25 * a * a * (Math.cos(2.0 * k * x) + Math.cos(2.0 * k * y)); return [[u, 0.0], [v, 0.0], [p, 0.0]]; }",
            description: "JavaScript initial data for horizontal velocity, vertical velocity, and pressure: a perturbed Taylor–Green vortex."
        },
        laplace: {hidden: true},
        identity: {hidden: true},
        derivative: {hidden: true},
        cubic: {hidden: true},
        noiseStrength: {hidden: true},
        useCellularAutomatonRule: {hidden: true},
        equation: {
            defaultValue: "#\nu_1_t = -u_1 * u_1_x - u_2 * u_1_y - u_3_x + viscosity * (u_1_xx + u_1_yy);\n#\nu_2_t = -u_1 * u_2_x - u_2 * u_2_y - u_3_y + viscosity * (u_2_xx + u_2_yy);\n#\nu_3_t = -pressureSpeed * pressureSpeed * (u_1_x + u_2_y) + pressureDiffusion * (u_3_xx + u_3_yy);\n",
            description: "GLSL artificial-compressibility Navier–Stokes: u_1 and u_2 are velocity; u_3 relaxes pressure toward incompressibility."
        }
    },
    extraProperties: [
        {
            name: "vortexAmplitude", displayName: "Vortex amplitude", group: "/settings/input/basic",
            type: "float", defaultValue: 0.4, restartOnChange: true,
            description: "Velocity amplitude in the Taylor–Green initial data."
        },
        {
            name: "vortexWaveNumber", displayName: "Vortex wave number", group: "/settings/input/basic",
            type: "float", exclusiveMinimum: 0, defaultValue: 0.75, restartOnChange: true,
            description: "Spatial frequency in the periodic Taylor–Green initial data."
        },
        {
            name: "perturbation", displayName: "Vortex perturbation", group: "/settings/input/basic",
            type: "float", minimum: 0, defaultValue: 0.03, restartOnChange: true,
            description: "Divergence-free higher-frequency perturbation added to the initial vortex."
        },
        {
            name: "viscosity", displayName: "Kinematic viscosity", group: "/settings/model/basic",
            type: "float", minimum: 0, defaultValue: 0.08,
            uniformName: "viscosity", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Diffusion coefficient for both velocity components."
        },
        {
            name: "pressureSpeed", displayName: "Pressure-wave speed", group: "/settings/model/basic",
            type: "float", exclusiveMinimum: 0, defaultValue: 1,
            uniformName: "pressureSpeed", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Artificial-compressibility speed. Larger values suppress divergence more strongly but require a smaller time step."
        },
        {
            name: "pressureDiffusion", displayName: "Pressure diffusion", group: "/settings/model/basic",
            type: "float", minimum: 0, defaultValue: 0.05,
            uniformName: "pressureDiffusion", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Small pressure smoothing term used by the local artificial-compressibility formulation."
        }
    ]
});

const navierStokesSettings = completeSettings(navierStokesSpecification, {
    width: 300,
    height: 900,
    scaleT: 0.001,
    scaleX: 2 * Math.PI / 300,
    scaleY: 2 * Math.PI / 300,
    speed: 2,
    delay: 16,
    valueDimensions: 3,
    timeOrder: 1,
    integrationMethod: "rk4",
    inputStrength: 0,
    vortexAmplitude: 0.4,
    vortexWaveNumber: 0.75,
    perturbation: 0.03,
    viscosity: 0.08,
    pressureSpeed: 1,
    pressureDiffusion: 0.05,
    boundaryCondition: 0,
    colorSensitivity: 2.5,
    colorMixRatio: 0.2,
    displayedQuantity: "[`u_1`, `u_2`, `u_2_x - u_1_y`]"
});

const cellularAutomatonSpecification = composeExampleSpecification("SimPDE! — Life-like cellular automaton", {
    overrides: {
        inputStrength: {defaultValue: 1},
        initialDataFunction: {
            defaultValue: "(x, y) => [[Math.random() < initialDensity ? 1.0 : 0.0, 0.0]]",
            description: "JavaScript random initial state. initialDensity is available by name."
        },
        laplace: {hidden: true},
        identity: {hidden: true},
        derivative: {hidden: true},
        cubic: {hidden: true},
        noiseStrength: {hidden: true},
        useCellularAutomatonRule: {
            hidden: false,
            defaultValue: "B3S23",
            description: "A Life-like rule in B...S... notation. B3S23 is Conway's Game of Life; changing the string regenerates the discrete GLSL rule."
        },
        boundaryCondition: {hidden: true},
        equation: {hidden: true},
    },
    extraProperties: [
        {
            name: "initialDensity", displayName: "Initial live-cell density", group: "/settings/input/basic",
            type: "float", minimum: 0, maximum: 1, defaultValue: 0.18, restartOnChange: true,
            description: "Probability that a cell starts alive."
        }
    ]
});

const cellularAutomatonSettingsB3S23 = completeSettings(cellularAutomatonSpecification, {
    width: 800,
    height: 800,
    scaleT: 1,
    scaleX: 1,
    scaleY: 1,
    speed: 1,
    delay: 1,
    valueDimensions: 1,
    inputRadius: 3,
    inputStrength: 1,
    initialDensity: 0.18,
    noiseStrength: 0,
    colorSensitivity: 3,
    colorMixRatio: 0,
    ...cellularAutomatonSettings("B3S23")
});

const simulationExamples = [
    {
        id: "sdnlw",
        name: "SDNLW (default)",
        description: "The original stochastic damped nonlinear wave model and controls.",
        specification: sdnlwSpecification,
        settings: sdnlwSettings
    },
    {
        id: "linear-schrodinger",
        name: "Linear Schrödinger wave packet",
        description: "A two-component real/imaginary wavefunction evolved with RK4.",
        specification: schrodingerSpecification,
        settings: schrodingerSettings
    },
    {
        id: "navier-stokes-3",
        name: "3-component Navier–Stokes vortex",
        description: "A perturbed Taylor–Green vortex using a local artificial-compressibility pressure field.",
        specification: navierStokesSpecification,
        settings: navierStokesSettings
    },
    {
        id: "cellular-automaton",
        name: "Life-like cellular automaton",
        description: "Conway's Life by default, with editable B…S… rule notation.",
        specification: cellularAutomatonSpecification,
        settings: cellularAutomatonSettingsB3S23
    }
];

function findSimulationExample(id) {
    return simulationExamples.find(example => example.id === id);
}

export {
    baseSpecification,
    composeExampleSpecification,
    findSimulationExample,
    isCreativeProperty,
    simulationExamples
};
