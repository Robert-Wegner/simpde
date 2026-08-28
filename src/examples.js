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
    return fillDefaultSettings(specification)({
        ...settings,
        width: 1050,
        height: 702,
        delay: 8,
        speed: 1
    });
}

const sdnlwSpecification = composeExampleSpecification("Stochastic nonlinear wave", {
    overrides: {
        laplace: {defaultValue: 5},
        identity: {defaultValue: 0.2},
        derivative: {defaultValue: 0.01},
        noiseStrength: {defaultValue: 1.2},
        boundaryCondition: {defaultValue: 1}
    }
});
const sdnlwSettings = completeSettings(sdnlwSpecification, {
    width: 600,
    height: 600,
    scaleT: 0.05,
    scaleX: 1,
    scaleY: 1,
    offsetX: 0,
    offsetY: 0,
    speed: 1,
    delay: 1,
    valueDimensions: 1,
    timeOrder: 2,
    integrationMethod: "semiImplicitEuler",
    colorSensitivity: 10,
    colorMixRatio: 0.1,
    colorExponent: 1,
    colorMixExponent: 1,
    colorCap: 1,
    colorPattern: 0,
    displayedQuantity: "[`u_1`]",
    inputRadius: 20,
    inputStrength: 10,
    initialDataFunction: "(x, y) => [[0.0, 0.0]]",
    laplace: 5,
    identity: 0.2,
    derivative: 0.01,
    cubic: 1,
    noiseStrength: 1.2,
    useCellularAutomatonRule: "",
    boundaryCondition: 1,
    equation: "#\nu_1_tt = laplace * (u_1_xx + u_1_yy)\n    - identity * u_1\n    - derivative * u_1_t\n    - cubic * u_1 * u_1 * u_1\n    + noiseStrength * noise\n    + force;\n"
});

const schrodingerSpecification = composeExampleSpecification("Nonlinear Schrödinger wave packet", {
    overrides: {
        inputRadius: {hidden: false, defaultValue: 15},
        inputStrength: {hidden: false, defaultValue: 10},
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
            defaultValue: "#\nA = 0.5 * trapStrength * (x * x + y * y) + nonlinearStrength * pow(max(u_1 * u_1 + u_2 * u_2, 0.000000000001), 0.5 * (nonlinearPower - 1.0));\nB = waveNumberX * x + waveNumberY * y;\nu_1_t = -kinetic * (u_2_xx + u_2_yy) + A * u_2 + force * cos(B);\n#\nA = 0.5 * trapStrength * (x * x + y * y) + nonlinearStrength * pow(max(u_1 * u_1 + u_2 * u_2, 0.000000000001), 0.5 * (nonlinearPower - 1.0));\nB = waveNumberX * x + waveNumberY * y;\nu_2_t = kinetic * (u_1_xx + u_1_yy) - A * u_1 + force * sin(B);\n",
            description: "Coupled real and imaginary parts of a nonlinear Schrödinger equation with adjustable |ψ|^(p-1)ψ nonlinearity."
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
            uniformName: "waveNumberX", uniformType: "float", shaderPrograms: ["compute"],
            description: "Horizontal phase gradient of the initial wave packet."
        },
        {
            name: "waveNumberY", displayName: "Wave number Y", group: "/settings/input/basic",
            type: "float", defaultValue: 3, restartOnChange: true,
            uniformName: "waveNumberY", uniformType: "float", shaderPrograms: ["compute"],
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
        },
        {
            name: "nonlinearStrength", displayName: "Nonlinear strength", group: "/settings/model/basic",
            type: "float", defaultValue: -0.5,
            uniformName: "nonlinearStrength", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Coefficient of the power-law nonlinearity; negative values are focusing."
        },
        {
            name: "nonlinearPower", displayName: "Nonlinear power p", group: "/settings/model/basic",
            type: "float", minimum: 1, defaultValue: 3,
            uniformName: "nonlinearPower", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Power p in the nonlinear term |ψ|^(p-1)ψ. p = 3 gives the cubic nonlinear Schrödinger equation."
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
    inputStrength: 10,
    packetSigma: 3,
    packetCenterX: -25,
    packetCenterY: 0,
    waveNumberX: 2,
    waveNumberY: 3,
    kinetic: 5,
    trapStrength: 0,
    nonlinearStrength: -0.5,
    nonlinearPower: 3,
    boundaryCondition: 1,
    colorSensitivity: 1.5,
    colorMixRatio: 0.25,
    colorExponent: 0.6,
    displayedQuantity: "[`1i u_2`, `u_1 * u_1 + u_2 * u_2`]"
});

const navierStokesSpecification = composeExampleSpecification("Navier–Stokes vortex dipole", {
    overrides: {
        inputRadius: {hidden: false, defaultValue: 18},
        inputStrength: {hidden: false, defaultValue: 1.5},
        initialDataFunction: {
            defaultValue: "(x, y) => { const r2 = vortexRadius * vortexRadius; const left = Math.exp(-((x + vortexSeparation) * (x + vortexSeparation) + y * y) / (2.0 * r2)); const right = Math.exp(-((x - vortexSeparation) * (x - vortexSeparation) + y * y) / (2.0 * r2)); const u = -vortexAmplitude * y * (left - right) / r2; const v = vortexAmplitude * ((x + vortexSeparation) * left - (x - vortexSeparation) * right) / r2; return [[u, 0.0], [v, 0.0], [0.0, 0.0]]; }",
            description: "A smooth, divergence-free counter-rotating vortex pair that translates and deforms without an aggressive initial transient."
        },
        laplace: {hidden: true},
        identity: {hidden: true},
        derivative: {hidden: true},
        cubic: {hidden: true},
        noiseStrength: {hidden: true},
        useCellularAutomatonRule: {hidden: true},
        equation: {
            defaultValue: "#\nu_1_t = -u_1 * u_1_x - u_2 * u_1_y - u_3_x + viscosity * (u_1_xx + u_1_yy) + force;\n#\nu_2_t = -u_1 * u_2_x - u_2 * u_2_y - u_3_y + viscosity * (u_2_xx + u_2_yy);\n#\nu_3_t = -pressureSpeed * pressureSpeed * (u_1_x + u_2_y) + pressureDiffusion * (u_3_xx + u_3_yy);\n",
            description: "GLSL artificial-compressibility Navier–Stokes: u_1 and u_2 are velocity; u_3 relaxes pressure toward incompressibility."
        }
    },
    extraProperties: [
        {
            name: "vortexAmplitude", displayName: "Vortex amplitude", group: "/settings/input/basic",
            type: "float", defaultValue: 7, restartOnChange: true,
            description: "Stream-function amplitude of the two vortices."
        },
        {
            name: "vortexSeparation", displayName: "Vortex separation", group: "/settings/input/basic",
            type: "float", exclusiveMinimum: 0, defaultValue: 10, restartOnChange: true,
            description: "Distance from the origin to each vortex center."
        },
        {
            name: "vortexRadius", displayName: "Vortex radius", group: "/settings/input/basic",
            type: "float", exclusiveMinimum: 0, defaultValue: 6, restartOnChange: true,
            description: "Gaussian core radius of each vortex."
        },
        {
            name: "viscosity", displayName: "Kinematic viscosity", group: "/settings/model/basic",
            type: "float", minimum: 0, defaultValue: 0.05,
            uniformName: "viscosity", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Diffusion coefficient for both velocity components."
        },
        {
            name: "pressureSpeed", displayName: "Pressure-wave speed", group: "/settings/model/basic",
            type: "float", exclusiveMinimum: 0, defaultValue: 1.5,
            uniformName: "pressureSpeed", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Artificial-compressibility speed. Larger values suppress divergence more strongly but require a smaller time step."
        },
        {
            name: "pressureDiffusion", displayName: "Pressure diffusion", group: "/settings/model/basic",
            type: "float", minimum: 0, defaultValue: 0.08,
            uniformName: "pressureDiffusion", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Small pressure smoothing term used by the local artificial-compressibility formulation."
        }
    ]
});

const navierStokesSettings = completeSettings(navierStokesSpecification, {
    width: 360,
    height: 1080,
    scaleT: 0.002,
    scaleX: 0.25,
    scaleY: 0.25,
    speed: 4,
    delay: 16,
    valueDimensions: 3,
    timeOrder: 1,
    integrationMethod: "rk4",
    inputRadius: 18,
    inputStrength: 1.5,
    vortexAmplitude: 7,
    vortexSeparation: 10,
    vortexRadius: 6,
    viscosity: 0.035,
    pressureSpeed: 1.5,
    pressureDiffusion: 0.08,
    boundaryCondition: 0,
    colorSensitivity: 1.8,
    colorMixRatio: 0.2,
    displayedQuantity: "[`u_1`, `u_2`, `u_2_x - u_1_y`]"
});

const ginzburgLandauSpecification = composeExampleSpecification("Stochastic complex Ginzburg–Landau", {
    overrides: {
        inputRadius: {defaultValue: 16},
        inputStrength: {defaultValue: 20},
        initialDataFunction: {
            defaultValue: "(x, y) => [[0.0, 0.0], [0.0, 0.0]]",
            description: "Zero initial data for both components. Persistent random forcing seeds the evolving pattern."
        },
        laplace: {hidden: true},
        identity: {hidden: true},
        derivative: {hidden: true},
        cubic: {hidden: true},
        noiseStrength: {
            displayName: "Random forcing",
            defaultValue: 0.04,
            description: "Continuously seeds both components with independent spatial random forcing."
        },
        useCellularAutomatonRule: {hidden: true},
        equation: {
            defaultValue: "#\nA = u_1 * u_1 + u_2 * u_2;\nu_1_t = growth * u_1 + diffusion * ((u_1_xx + u_1_yy) - linearDispersion * (u_2_xx + u_2_yy)) - saturation * A * (u_1 - nonlinearDispersion * u_2) + noiseStrength * noise + force;\n#\nA = u_1 * u_1 + u_2 * u_2;\nu_2_t = growth * u_2 + diffusion * ((u_2_xx + u_2_yy) + linearDispersion * (u_1_xx + u_1_yy)) - saturation * A * (u_2 + nonlinearDispersion * u_1) + noiseStrength * noise;\n",
            description: "Real and imaginary components of the complex Ginzburg–Landau equation."
        }
    },
    extraProperties: [
        {
            name: "growth", displayName: "Linear growth", group: "/settings/model/basic",
            type: "float", defaultValue: 1,
            uniformName: "growth", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Linear instability that amplifies the noise-seeded field."
        },
        {
            name: "diffusion", displayName: "Diffusion", group: "/settings/model/basic",
            type: "float", minimum: 0, defaultValue: 1,
            uniformName: "diffusion", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Spatial coupling strength."
        },
        {
            name: "linearDispersion", displayName: "Linear dispersion", group: "/settings/model/basic",
            type: "float", defaultValue: 1.4,
            uniformName: "linearDispersion", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Phase rotation associated with spatial coupling."
        },
        {
            name: "nonlinearDispersion", displayName: "Nonlinear dispersion", group: "/settings/model/basic",
            type: "float", defaultValue: -0.8,
            uniformName: "nonlinearDispersion", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Phase rotation associated with nonlinear saturation."
        },
        {
            name: "saturation", displayName: "Saturation", group: "/settings/model/basic",
            type: "float", exclusiveMinimum: 0, defaultValue: 1,
            uniformName: "saturation", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Cubic amplitude saturation."
        }
    ]
});

const ginzburgLandauSettings = completeSettings(ginzburgLandauSpecification, {
    width: 1200,
    height: 800,
    scaleT: 0.01,
    scaleX: 0.5,
    scaleY: 0.5,
    offsetX: 0,
    offsetY: 0,
    speed: 1,
    delay: 16,
    valueDimensions: 2,
    timeOrder: 1,
    integrationMethod: "rk4",
    colorSensitivity: 1.5,
    colorMixRatio: 0.25,
    colorExponent: 0.7,
    colorMixExponent: 1,
    colorCap: 1,
    colorPattern: 0,
    displayedQuantity: "[`1i u_2`, `u_1 * u_1 + u_2 * u_2`]",
    inputRadius: 16,
    inputStrength: 20,
    initialDataFunction: "(x, y) => [[0.0, 0.0], [0.0, 0.0]]",
    laplace: 1,
    identity: 1,
    derivative: 1,
    cubic: 1,
    noiseStrength: 0.2,
    useCellularAutomatonRule: "",
    boundaryCondition: 0,
    equation: "#\nA = u_1 * u_1 + u_2 * u_2;\nu_1_t = growth * u_1 + diffusion * ((u_1_xx + u_1_yy) - linearDispersion * (u_2_xx + u_2_yy)) - saturation * A * (u_1 - nonlinearDispersion * u_2) + noiseStrength * noise + force;\n#\nA = u_1 * u_1 + u_2 * u_2;\nu_2_t = growth * u_2 + diffusion * ((u_2_xx + u_2_yy) + linearDispersion * (u_1_xx + u_1_yy)) - saturation * A * (u_2 + nonlinearDispersion * u_1) + noiseStrength * noise;\n",
    growth: 3,
    diffusion: 1,
    linearDispersion: 6.4,
    nonlinearDispersion: -4.8,
    saturation: 1,
});

const swiftHohenbergSpecification = composeExampleSpecification("Stochastic Swift–Hohenberg patterns", {
    overrides: {
        inputRadius: {defaultValue: 32},
        inputStrength: {defaultValue: 4},
        initialDataFunction: {
            defaultValue: "(x, y) => [[0.0, 0.0]]",
            description: "Zero initial data. Random forcing continuously nucleates and moves the stripes."
        },
        laplace: {hidden: true},
        identity: {hidden: true},
        derivative: {hidden: true},
        cubic: {hidden: true},
        noiseStrength: {
            displayName: "Random forcing",
            defaultValue: 10,
            description: "Persistent random forcing that seeds and agitates the pattern."
        },
        useCellularAutomatonRule: {hidden: true},
        equation: {
            defaultValue: "#\nA = u_1_xx + u_1_yy;\nB = u_1_xxxx + 2.0 * u_1_xxyy + u_1_yyyy;\nu_1_t = (patternGrowth - pow(patternWaveNumber, 4.0)) * u_1 - 2.0 * pow(patternWaveNumber, 2.0) * A - B - patternSaturation * u_1 * u_1 * u_1 + noiseStrength * noise + force;\n",
            description: "The isotropic Swift–Hohenberg equation expanded into Laplacian and biharmonic terms."
        }
    },
    extraProperties: [
        {
            name: "patternGrowth", displayName: "Pattern growth", group: "/settings/model/basic",
            type: "float", defaultValue: 0.25,
            uniformName: "patternGrowth", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Distance above the pattern-forming instability threshold."
        },
        {
            name: "patternWaveNumber", displayName: "Preferred wave number", group: "/settings/model/basic",
            type: "float", exclusiveMinimum: 0, defaultValue: 0.5,
            uniformName: "patternWaveNumber", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Selects the preferred stripe spacing."
        },
        {
            name: "patternSaturation", displayName: "Pattern saturation", group: "/settings/model/basic",
            type: "float", exclusiveMinimum: 0, defaultValue: 0.2,
            uniformName: "patternSaturation", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Cubic saturation that limits pattern amplitude."
        }
    ]
});

const swiftHohenbergSettings = completeSettings(swiftHohenbergSpecification, {
    width: 420,
    height: 420,
    scaleT: 0.01,
    scaleX: 1,
    scaleY: 1,
    speed: 4,
    delay: 16,
    valueDimensions: 1,
    timeOrder: 1,
    integrationMethod: "rk4",
    boundaryCondition: 0,
    inputRadius: 32,
    inputStrength: 4,
    initialDataFunction: "(x, y) => [[0.0, 0.0]]",
    laplace: 1,
    identity: 1,
    derivative: 1,
    cubic: 1,
    noiseStrength: 10,
    useCellularAutomatonRule: "",
    colorSensitivity: 2.2,
    colorMixRatio: 0.15,
    colorExponent: 0.8,
    colorMixExponent: 1,
    colorCap: 1,
    colorPattern: 0,
    patternGrowth: 0.25,
    patternWaveNumber: 0.5,
    patternSaturation: 0.2,
    equation: "#\nA = u_1_xx + u_1_yy;\nB = u_1_xxxx + 2.0 * u_1_xxyy + u_1_yyyy;\nu_1_t = (patternGrowth - pow(patternWaveNumber, 4.0)) * u_1 - 2.0 * pow(patternWaveNumber, 2.0) * A - B - patternSaturation * u_1 * u_1 * u_1 + noiseStrength * noise + force;\n",
    displayedQuantity: "[`u_1`]"
});

const heatSpecification = composeExampleSpecification("Heat equation", {
    overrides: {
        inputRadius: {defaultValue: 18},
        inputStrength: {defaultValue: 2},
        initialDataFunction: {
            defaultValue: "(x, y) => [[Math.exp(-((x + 25.0) * (x + 25.0) + y * y) / (2.0 * initialSpotWidth * initialSpotWidth)) - 0.7 * Math.exp(-((x - 20.0) * (x - 20.0) + (y - 12.0) * (y - 12.0)) / (2.0 * initialSpotWidth * initialSpotWidth)), 0.0]]",
            description: "Two smooth hot/cold spots used to show diffusion. initialSpotWidth is available by name."
        },
        laplace: {hidden: true},
        identity: {hidden: true},
        derivative: {hidden: true},
        cubic: {hidden: true},
        noiseStrength: {hidden: true},
        useCellularAutomatonRule: {hidden: true},
        equation: {
            defaultValue: "#\nu_1_t = thermalDiffusivity * (u_1_xx + u_1_yy) + force;\n",
            description: "The linear heat equation with optional pointer-applied heat input."
        }
    },
    extraProperties: [
        {
            name: "initialSpotWidth", displayName: "Initial spot width", group: "/settings/input/basic",
            type: "float", exclusiveMinimum: 0, defaultValue: 12, restartOnChange: true,
            description: "Gaussian width of the initial hot and cold spots."
        },
        {
            name: "thermalDiffusivity", displayName: "Thermal diffusivity", group: "/settings/model/basic",
            type: "float", minimum: 0, defaultValue: 1.2,
            uniformName: "thermalDiffusivity", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Rate at which temperature spreads."
        }
    ]
});

const heatSettings = completeSettings(heatSpecification, {
    width: 400,
    height: 400,
    scaleT: 0.02,
    scaleX: 0.5,
    scaleY: 0.5,
    speed: 3,
    delay: 16,
    valueDimensions: 1,
    timeOrder: 1,
    integrationMethod: "rk4",
    boundaryCondition: 1,
    colorSensitivity: 2,
    colorMixRatio: 0.2,
    displayedQuantity: "[`u_1`]"
});

const lensWaveSpecification = composeExampleSpecification("Linear wave through a lens", {
    overrides: {
        inputRadius: {defaultValue: 10},
        inputStrength: {defaultValue: 90},
        initialDataFunction: {
            defaultValue: "(x, y) => [[0.0, 0.0]]",
            description: "Zero displacement and velocity; a built-in source sends plane waves in from the left."
        },
        laplace: {hidden: true},
        identity: {hidden: true},
        derivative: {hidden: true},
        cubic: {hidden: true},
        noiseStrength: {hidden: true},
        useCellularAutomatonRule: {hidden: true},
        equation: {
            defaultValue: "#\nA = 1.0 / (1.0 + exp(lensEdgeSharpness * (sqrt(pow((x - lensCenterX) / (lensSize * lensRadiusX), 2.0) + pow((y - lensCenterY) / (lensSize * lensRadiusY), 2.0)) - 1.0)));\nB = baseWaveSpeed / (1.0 + lensStrength * A);\nC = sourceAmplitude * exp(-pow((x - sourceX) / sourceWidth, 2.0)) * sin(sourceFrequency * t);\nu_1_tt = B * B * (u_1_xx + u_1_yy) - waveDamping * u_1_t + C + force;\n",
            description: "A linear wave equation whose local propagation speed is reduced inside a smooth elliptical lens."
        }
    },
    extraProperties: [
        {
            name: "sourceAmplitude", displayName: "Source amplitude", group: "/settings/input/basic",
            type: "float", defaultValue: 10,
            uniformName: "sourceAmplitude", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Strength of the continuous plane-wave source on the left."
        },
        {
            name: "sourceFrequency", displayName: "Source frequency", group: "/settings/input/basic",
            type: "float", exclusiveMinimum: 0, defaultValue: 3,
            uniformName: "sourceFrequency", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Angular frequency of incoming waves."
        },
        {
            name: "sourceX", displayName: "Source X position", group: "/settings/input/basic",
            type: "float", defaultValue: -90,
            uniformName: "sourceX", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Horizontal position of the source near the left edge."
        },
        {
            name: "sourceWidth", displayName: "Source width", group: "/settings/input/basic",
            type: "float", exclusiveMinimum: 0, defaultValue: 1.2,
            uniformName: "sourceWidth", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Thickness of the incoming-wave source strip."
        },
        {
            name: "baseWaveSpeed", displayName: "Background wave speed", group: "/settings/model/basic",
            type: "float", exclusiveMinimum: 0, defaultValue: 5.79,
            uniformName: "baseWaveSpeed", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Propagation speed outside the lens."
        },
        {
            name: "waveDamping", displayName: "Wave damping", group: "/settings/model/basic",
            type: "float", minimum: 0, defaultValue: 0.035,
            uniformName: "waveDamping", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Small uniform damping that limits accumulated reflections."
        },
        {
            name: "lensStrength", displayName: "Lens refractive strength", group: "/settings/model/basic",
            type: "float", minimum: 0, defaultValue: 2.8,
            uniformName: "lensStrength", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "How strongly the lens reduces the local wave speed."
        },
        {
            name: "lensCenterX", displayName: "Lens center X", group: "/settings/model/basic",
            type: "float", defaultValue: 0.19,
            uniformName: "lensCenterX", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Horizontal center of the lens."
        },
        {
            name: "lensCenterY", displayName: "Lens center Y", group: "/settings/model/basic",
            type: "float", defaultValue: 0,
            uniformName: "lensCenterY", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Vertical center of the lens."
        },
        {
            name: "lensSize", displayName: "Lens size", group: "/settings/model/basic",
            type: "float", exclusiveMinimum: 0, defaultValue: 2,
            uniformName: "lensSize", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Overall lens-size multiplier. The default 2 doubles both lens radii."
        },
        {
            name: "lensRadiusX", displayName: "Lens radius X", group: "/settings/model/basic",
            type: "float", exclusiveMinimum: 0, defaultValue: 5,
            uniformName: "lensRadiusX", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Horizontal semi-axis of the elliptical lens."
        },
        {
            name: "lensRadiusY", displayName: "Lens radius Y", group: "/settings/model/basic",
            type: "float", exclusiveMinimum: 0, defaultValue: 18,
            uniformName: "lensRadiusY", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Vertical semi-axis of the elliptical lens."
        },
        {
            name: "lensEdgeSharpness", displayName: "Lens edge sharpness", group: "/settings/model/basic",
            type: "float", exclusiveMinimum: 0, defaultValue: 8,
            uniformName: "lensEdgeSharpness", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "Smoothness of the material transition at the lens boundary."
        }
    ]
});

const lensWaveSettings = completeSettings(lensWaveSpecification, {
    width: 800,
    height: 800,
    scaleT: 0.012,
    scaleX: 0.2,
    scaleY: 0.2,
    speed: 3,
    delay: 16,
    valueDimensions: 1,
    timeOrder: 2,
    integrationMethod: "semiImplicitEuler",
    inputRadius: 10,
    inputStrength: 90,
    initialDataFunction: "(x, y) => [[0.0, 0.0]]",
    laplace: 1,
    identity: 1,
    derivative: 1,
    cubic: 1,
    noiseStrength: 0,
    useCellularAutomatonRule: "",
    boundaryCondition: 3,
    colorSensitivity: 3,
    colorMixRatio: 0.12,
    colorExponent: 0.75,
    colorMixExponent: 1,
    colorCap: 1,
    colorPattern: 0,
    sourceAmplitude: 10,
    sourceFrequency: 3,
    sourceX: -90,
    sourceWidth: 1.2,
    baseWaveSpeed: 5.79,
    waveDamping: 0.05,
    lensStrength: 2.8,
    lensCenterX: 0.19,
    lensCenterY: 0,
    lensSize: 2,
    lensRadiusX: 5,
    lensRadiusY: 18,
    lensEdgeSharpness: 8,
    equation: "#\nA = 1.0 / (1.0 + exp(lensEdgeSharpness * (sqrt(pow((x - lensCenterX) / (lensSize * lensRadiusX), 2.0) + pow((y - lensCenterY) / (lensSize * lensRadiusY), 2.0)) - 1.0)));\nB = baseWaveSpeed / (1.0 + lensStrength * A);\nC = sourceAmplitude * exp(-pow((x - sourceX) / sourceWidth, 2.0)) * sin(sourceFrequency * t);\nu_1_tt = B * B * (u_1_xx + u_1_yy) - waveDamping * u_1_t + C + force;\n",
    displayedQuantity: "[`u_1`]"
});

const cellularAutomatonSpecification = composeExampleSpecification("Conway's Game of Life", {
    overrides: {
        inputStrength: {defaultValue: 10},
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
            type: "float", minimum: 0, maximum: 1, defaultValue: 0, restartOnChange: true,
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
    inputStrength: 10,
    initialDensity: 0,
    noiseStrength: 0,
    colorSensitivity: 50,
    colorMixRatio: 0.02,
    ...cellularAutomatonSettings("B3S23")
});

const alternativeCellularAutomatonSpecification = cloneSpecification(cellularAutomatonSpecification);
alternativeCellularAutomatonSpecification.title = "Alternative cellular automata";
const alternativeRuleProperty = alternativeCellularAutomatonSpecification.vars.find(property =>
    property.name === "useCellularAutomatonRule"
);
alternativeRuleProperty.defaultValue = "B3S134567";
alternativeRuleProperty.description = "The B3S134567 Life-like rule: cells are born with 3 neighbours and survive with 1, 3, 4, 5, 6, or 7.";

const alternativeCellularAutomatonSettings = completeSettings(alternativeCellularAutomatonSpecification, {
    width: 800,
    height: 800,
    scaleT: 1,
    scaleX: 1,
    scaleY: 1,
    speed: 1,
    delay: 1,
    valueDimensions: 1,
    inputRadius: 7,
    inputStrength: 10,
    initialDensity: 0,
    noiseStrength: 0,
    colorSensitivity: 50,
    colorMixRatio: 0.02,
    ...cellularAutomatonSettings("B3S134567")
});

const simulationExamples = [
    {
        id: "sdnlw",
        name: "Stochastic nonlinear wave",
        description: "A strongly noise-driven, weakly damped nonlinear wave.",
        specification: sdnlwSpecification,
        settings: sdnlwSettings
    },
    {
        id: "linear-schrodinger",
        name: "Nonlinear Schrödinger wave packet",
        description: "A wave packet with adjustable power p and focusing strength.",
        specification: schrodingerSpecification,
        settings: schrodingerSettings
    },
    {
        id: "navier-stokes-3",
        name: "Navier–Stokes vortex dipole",
        description: "A stable counter-rotating vortex pair shown as two velocity components and vorticity.",
        specification: navierStokesSpecification,
        settings: navierStokesSettings
    },
    {
        id: "ginzburg-landau",
        name: "Stochastic complex Ginzburg–Landau",
        description: "Noise-seeded complex amplitudes form moving spiral and defect patterns.",
        specification: ginzburgLandauSpecification,
        settings: ginzburgLandauSettings
    },
    {
        id: "swift-hohenberg",
        name: "Stochastic Swift–Hohenberg patterns",
        description: "Strong random forcing drives fluctuating stripes from zero initial data.",
        specification: swiftHohenbergSpecification,
        settings: swiftHohenbergSettings
    },
    {
        id: "heat-equation",
        name: "Heat equation",
        description: "Positive and negative temperature spots diffuse and smooth out.",
        specification: heatSpecification,
        settings: heatSettings
    },
    {
        id: "lens-wave",
        name: "Linear wave through a lens",
        description: "Plane waves enter from the left and refract through a central material lens.",
        specification: lensWaveSpecification,
        settings: lensWaveSettings
    },
    {
        id: "cellular-automaton",
        name: "Conway's Game of Life",
        description: "Conway's B3S23 cellular automaton.",
        specification: cellularAutomatonSpecification,
        settings: cellularAutomatonSettingsB3S23
    },
    {
        id: "alternative-cellular-automaton",
        name: "Alternative cellular automata",
        description: "The B3S134567 Life-like rule with unusually persistent structures.",
        specification: alternativeCellularAutomatonSpecification,
        settings: alternativeCellularAutomatonSettings
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
