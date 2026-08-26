const STANDARD_EQUATION_GENERATOR = "standardWaveEquation";
const STANDARD_DISPLAY_GENERATOR = "standardDisplayedQuantities";
const STANDARD_INITIAL_DATA_GENERATOR = "zeroInitialData";

function standardEquation(valueDimensions) {
    return [...Array(valueDimensions).keys()].map((_, index) => {
        const field = index + 1;
        return `#\n` +
            `u_${field}_tt = laplace * (u_${field}_xx + u_${field}_yy)\n` +
            `    - identity * u_${field}\n` +
            `    - derivative * u_${field}_t\n` +
            `    - cubic * u_${field} * u_${field} * u_${field}\n` +
            `    + noiseStrength * noise\n` +
            `    + force;\n`;
    }).join("");
}

function standardDisplayedQuantities(valueDimensions) {
    return "[" + [...Array(valueDimensions).keys()]
        .map((_, index) => `\`u_${index + 1}\``)
        .join(", ") + "]";
}

function zeroInitialData(valueDimensions) {
    return "(x, y) => [" + [...Array(valueDimensions).keys()]
        .map(() => "[0.0, 0.0]")
        .join(", ") + "]";
}

const defaultSpecification = {
    schemaVersion: 1,
    title: "SimPDE!",
    group: {
        name: "settings",
        displayName: "Settings",
        subgroups: [
            {name: "sim", displayName: "Simulation", subgroups: []},
            {
                name: "input",
                displayName: "Input",
                subgroups: [
                    {name: "basic", displayName: "Basic", subgroups: []},
                    {name: "advanced", displayName: "Advanced", subgroups: []}
                ]
            },
            {
                name: "model",
                displayName: "Model",
                subgroups: [
                    {name: "basic", displayName: "Basic", subgroups: []},
                    {name: "advanced", displayName: "Advanced", subgroups: []}
                ]
            },
            {
                name: "visual",
                displayName: "Visualization",
                subgroups: [
                    {name: "basic", displayName: "Basic", subgroups: []},
                    {name: "advanced", displayName: "Advanced", subgroups: []}
                ]
            }
        ]
    },
    vars: [
        {
            name: "width", displayName: "Width", group: "/settings/sim",
            type: "int", minimum: 1, maximum: 3000, defaultValue: 400,
            uniformName: "width", uniformType: "float", shaderPrograms: ["compute", "color", "vertex"],
            restartOnChange: true,
            description: "The width of the simulated texture in pixels."
        },
        {
            name: "height", displayName: "Height", group: "/settings/sim",
            type: "int", minimum: 1, maximum: 3000, defaultValue: 400,
            uniformName: "height", uniformType: "float", shaderPrograms: ["compute", "color", "vertex"],
            restartOnChange: true,
            description: "The total height of the vertically stacked simulation fields in pixels."
        },
        {
            name: "scaleT", displayName: "Time step", group: "/settings/sim",
            type: "float", minimum: 0, defaultValue: 0.05,
            uniformName: "scaleT", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "The size of each numerical integration step."
        },
        {
            name: "scaleX", displayName: "Scale in X axis", group: "/settings/sim",
            type: "float", exclusiveMinimum: 0, defaultValue: 1.0,
            uniformName: "scaleX", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "The physical spacing between horizontal grid points."
        },
        {
            name: "scaleY", displayName: "Scale in Y axis", group: "/settings/sim",
            type: "float", exclusiveMinimum: 0, defaultValue: 1.0,
            uniformName: "scaleY", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "The physical spacing between vertical grid points."
        },
        {
            name: "offsetX", displayName: "Offset in X axis", group: "/settings/sim",
            type: "float", defaultValue: 0.0,
            uniformName: "offsetX", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "The horizontal coordinate offset."
        },
        {
            name: "offsetY", displayName: "Offset in Y axis", group: "/settings/sim",
            type: "float", defaultValue: 0.0,
            uniformName: "offsetY", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "The vertical coordinate offset."
        },
        {
            name: "speed", displayName: "Iterations per frame", group: "/settings/sim",
            type: "int", minimum: 1, defaultValue: 1,
            restartOnChange: true,
            description: "The number of compute steps performed before each displayed frame."
        },
        {
            name: "delay", displayName: "Minimum frame interval", group: "/settings/sim",
            type: "int", minimum: 0, defaultValue: 1,
            restartOnChange: true,
            description: "The timer interval between displayed frames, in milliseconds."
        },
        {
            name: "valueDimensions", displayName: "Number of dimensions", group: "/settings/sim",
            type: "int", minimum: 1, maximum: 16, defaultValue: 2,
            effect: "resizeFields", restartOnChange: true,
            description: "The number of vertically stacked scalar fields, named u_1 through u_N."
        },
        {
            name: "timeOrder", displayName: "Time order", group: "/settings/sim",
            type: "int", minimum: 1, maximum: 2, defaultValue: 2,
            options: [
                {value: 1, displayName: "First order (u_t)"},
                {value: 2, displayName: "Second order (u_tt)"}
            ],
            restartOnChange: true,
            description: "First order treats equation assignments to u_i_t as the state derivative. Second order evolves the stored pair (u_i, u_i_t) from u_i_tt."
        },
        {
            name: "integrationMethod", displayName: "Integration method", group: "/settings/sim",
            type: "string", pattern: "^(semiImplicitEuler|rk4|discrete)$",
            defaultValue: "semiImplicitEuler",
            options: [
                {value: "semiImplicitEuler", displayName: "Semi-implicit Euler"},
                {value: "rk4", displayName: "Runge–Kutta 4"},
                {value: "discrete", displayName: "Discrete update"}
            ],
            restartOnChange: true,
            description: "Semi-implicit Euler preserves the original kernel. RK4 is a four-stage general integrator. Discrete update executes direct state assignments without time integration."
        },
        {
            name: "inputRadius", displayName: "Radius of input", group: "/settings/input/basic",
            type: "int", minimum: 1, defaultValue: 20,
            restartOnChange: true,
            description: "The radius of the smooth mouse/touch input brush in pixels."
        },
        {
            name: "inputStrength", displayName: "Strength of input", group: "/settings/input/basic",
            type: "float", defaultValue: 10.0,
            uniformName: "inputStrength", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "The strength of the mouse/touch forcing term. Successive presses alternate its sign."
        },
        {
            name: "initialDataFunction", displayName: "Initial Data", group: "/settings/input/advanced",
            type: "string", defaultValueGenerator: STANDARD_INITIAL_DATA_GENERATOR,
            restartOnChange: true,
            description: "A JavaScript function (x, y) => [[u_1, u_1_t], ...] used to initialize every field. Numeric settings may be referenced by name."
        },
        {
            name: "laplace", displayName: "laplace", group: "/settings/model/basic",
            type: "float", defaultValue: 1.0,
            uniformName: "laplace", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "The coefficient of the Laplacian in the standard equation."
        },
        {
            name: "identity", displayName: "identity", group: "/settings/model/basic",
            type: "float", defaultValue: 1.0,
            uniformName: "identity", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "The coefficient of the identity term in the standard equation."
        },
        {
            name: "derivative", displayName: "derivative", group: "/settings/model/basic",
            type: "float", defaultValue: 1.0,
            uniformName: "derivative", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "The coefficient of the first time derivative in the standard equation."
        },
        {
            name: "cubic", displayName: "cubic", group: "/settings/model/basic",
            type: "float", defaultValue: 1.0,
            uniformName: "cubic", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "The coefficient of the cubic nonlinearity in the standard equation."
        },
        {
            name: "noiseStrength", displayName: "Noise strength", group: "/settings/model/basic",
            type: "float", defaultValue: 0.0,
            uniformName: "noiseStrength", uniformType: "float", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "The coefficient of the spatial Gaussian-like noise term."
        },
        {
            name: "useCellularAutomatonRule", displayName: "Apply Cellular Automaton Rule", group: "/settings/model/basic",
            type: "string", pattern: "^$|^B[0-8]*S[0-8]*$", defaultValue: "",
            effect: "cellularAutomaton", restartOnChange: true,
            hidden: true,
            description: "A Life-like rule in B...S... notation. B3S23 is Conway's Game of Life."
        },
        {
            name: "boundaryCondition", displayName: "Boundary Condition", group: "/settings/model/advanced",
            type: "int", minimum: 0, maximum: 3, defaultValue: 0,
            uniformName: "boundaryCondition", uniformType: "int", shaderPrograms: ["compute"],
            restartOnChange: false,
            description: "0: periodic; 1: zero rectangular edge; 2: zero circular edge; 3: zero vertical edges."
        },
        {
            name: "equation", displayName: "Equation", group: "/settings/model/advanced",
            type: "string", defaultValueGenerator: STANDARD_EQUATION_GENERATOR,
            restartOnChange: true,
            description: "GLSL statements split by #. Text before the first # is shared; one following section is required for each field. Spatial derivatives such as u_1_x, u_1_xx, u_1_xy and higher orders are generated automatically."
        },
        {
            name: "colorSensitivity", displayName: "Color sensitivity", group: "/settings/visual/basic",
            type: "float", minimum: 0, defaultValue: 10.0,
            uniformName: "colorSensitivity", uniformType: "float", shaderPrograms: ["color"],
            restartOnChange: false,
            description: "A multiplier applied before mapping values to colors."
        },
        {
            name: "colorMixRatio", displayName: "Secondary color sensitivity", group: "/settings/visual/basic",
            type: "float", minimum: 0, defaultValue: 0.1,
            uniformName: "colorMixRatio", uniformType: "float", shaderPrograms: ["color"],
            restartOnChange: false,
            description: "The secondary color response."
        },
        {
            name: "colorExponent", displayName: "Color exponent", group: "/settings/visual/basic",
            type: "float", minimum: 0, defaultValue: 1.0,
            uniformName: "colorExponent", uniformType: "float", shaderPrograms: ["color"],
            restartOnChange: false,
            description: "The exponent in the primary brightness response."
        },
        {
            name: "colorMixExponent", displayName: "Secondary color exponent", group: "/settings/visual/basic",
            type: "float", minimum: 0, defaultValue: 1.0,
            uniformName: "colorMixExponent", uniformType: "float", shaderPrograms: ["color"],
            restartOnChange: false,
            description: "The exponent in the secondary color response."
        },
        {
            name: "colorCap", displayName: "Maximum color brightness", group: "/settings/visual/basic",
            type: "float", minimum: 0, maximum: 1, defaultValue: 1.0,
            uniformName: "colorCap", uniformType: "float", shaderPrograms: ["color"],
            restartOnChange: false,
            description: "The maximum contribution used by the color curves."
        },
        {
            name: "colorPattern", displayName: "Color pattern", group: "/settings/visual/basic",
            type: "int", minimum: 0, maximum: 5, defaultValue: 0,
            uniformName: "colorPattern", uniformType: "int", shaderPrograms: ["color"],
            restartOnChange: false,
            description: "Selects one of six color-channel permutations and inversions."
        },
        {
            name: "displayedQuantity", displayName: "Displayed quantities", group: "/settings/visual/advanced",
            type: "string", defaultValueGenerator: STANDARD_DISPLAY_GENERATOR,
            restartOnChange: true,
            description: "A list of quoted or backtick-delimited GLSL expressions, one per field. Prefix an expression with '1i' to treat it as the imaginary component of a complex value."
        }
    ]
};

function cloneSpecification(specification) {
    return JSON.parse(JSON.stringify(specification));
}

function generatedDefault(generator, valueDimensions) {
    if (generator === STANDARD_EQUATION_GENERATOR) return standardEquation(valueDimensions);
    if (generator === STANDARD_DISPLAY_GENERATOR) return standardDisplayedQuantities(valueDimensions);
    if (generator === STANDARD_INITIAL_DATA_GENERATOR) return zeroInitialData(valueDimensions);
    throw new Error(`Unknown defaultValueGenerator '${generator}'.`);
}

function defaultForProperty(property, settings, specification) {
    if (Object.prototype.hasOwnProperty.call(property, "defaultValue")) return property.defaultValue;
    if (property.defaultValueGenerator) {
        const dimensions = settings.valueDimensions ??
            specification.vars.find(item => item.name === "valueDimensions")?.defaultValue ?? 1;
        return generatedDefault(property.defaultValueGenerator, dimensions);
    }
    return undefined;
}

function coerceSetting(property, value) {
    if (property.type === "int") {
        const parsed = typeof value === "number" ? value : Number(value);
        return Number.isInteger(parsed) ? parsed : undefined;
    }
    if (property.type === "float") {
        const parsed = typeof value === "number" ? value : Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    if (property.type === "string") return typeof value === "string" ? value : String(value ?? "");
    return undefined;
}

function admitSetting(property, value) {
    if (property.type === "int" && !Number.isInteger(value)) return false;
    if (property.type === "float" && !Number.isFinite(value)) return false;
    if (property.type === "string" && typeof value !== "string") return false;
    if (property.minimum !== undefined && value < property.minimum) return false;
    if (property.maximum !== undefined && value > property.maximum) return false;
    if (property.exclusiveMinimum !== undefined && value <= property.exclusiveMinimum) return false;
    if (property.exclusiveMaximum !== undefined && value >= property.exclusiveMaximum) return false;
    if (property.pattern && !(new RegExp(property.pattern).test(value))) return false;
    return true;
}

function migrateLegacySettings(input) {
    const settings = {...(input || {})};
    if (settings.laplace === undefined && settings.laplacian !== undefined) settings.laplace = settings.laplacian;
    if (settings.noiseStrength === undefined && settings.noise !== undefined) settings.noiseStrength = settings.noise;
    if (typeof settings.equation === "string") {
        settings.equation = settings.equation
            .replace(/\bu_laplace\b/g, "laplace")
            .replace(/\bu_identity\b/g, "identity")
            .replace(/\bu_derivative\b/g, "derivative")
            .replace(/\bu_cubic\b/g, "cubic")
            .replace(/\bu_noise\b/g, "noiseStrength")
            .replace(/\bDelta_u_(\d+)\b/g, "(u_$1_xx + u_$1_yy)");
    }
    return settings;
}

const fillDefaultSettings = specification => input => {
    const migrated = migrateLegacySettings(input);
    const settings = {};
    for (const property of specification.vars) {
        const candidate = Object.prototype.hasOwnProperty.call(migrated, property.name)
            ? coerceSetting(property, migrated[property.name])
            : defaultForProperty(property, {...migrated, ...settings}, specification);
        const fallback = defaultForProperty(property, {...migrated, ...settings}, specification);
        settings[property.name] = candidate !== undefined && admitSetting(property, candidate) ? candidate : fallback;
    }
    return settings;
};

function validateSpecification(specification) {
    const errors = [];
    if (!specification || typeof specification !== "object") return ["Configuration must be a JSON object."];
    if (!specification.group || !Array.isArray(specification.vars)) errors.push("Configuration requires 'group' and 'vars'.");
    const names = new Set();
    for (const property of specification.vars || []) {
        if (!property.name || !property.displayName || !property.group || !property.type) {
            errors.push("Every property needs name, displayName, group, and type.");
            continue;
        }
        if (names.has(property.name)) errors.push(`Duplicate property '${property.name}'.`);
        names.add(property.name);
        if (!["int", "float", "string"].includes(property.type)) errors.push(`Unsupported type for '${property.name}'.`);
        if (property.options !== undefined && (!Array.isArray(property.options) || property.options.length === 0)) {
            errors.push(`Options for '${property.name}' must be a nonempty array.`);
        }
        if (property.uniformName && (!property.uniformType || !Array.isArray(property.shaderPrograms))) {
            errors.push(`Uniform '${property.name}' needs uniformType and shaderPrograms.`);
        }
        if (typeof property.defaultValueGenerator === "string") {
            try { generatedDefault(property.defaultValueGenerator, 1); }
            catch (error) { errors.push(error.message); }
        }
    }
    const required = ["width", "height", "scaleT", "scaleX", "scaleY", "offsetX", "offsetY",
        "speed", "delay", "valueDimensions", "inputRadius", "inputStrength", "initialDataFunction",
        "boundaryCondition", "equation", "displayedQuantity", "noiseStrength", "colorSensitivity",
        "colorMixRatio", "colorExponent", "colorMixExponent", "colorCap", "colorPattern"];
    for (const name of required) if (!names.has(name)) errors.push(`Required engine property '${name}' is missing.`);
    return errors;
}

const defaultSettings = fillDefaultSettings(defaultSpecification)({});

export {
    admitSetting,
    cloneSpecification,
    coerceSetting,
    defaultSettings,
    defaultSpecification,
    fillDefaultSettings,
    generatedDefault,
    migrateLegacySettings,
    standardDisplayedQuantities,
    standardEquation,
    validateSpecification,
    zeroInitialData
};
