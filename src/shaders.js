import {generateNecessaryVariables} from "./utils/processEquation";

const glslFloat = value => Number(value).toFixed(1);

function uniformDeclarations(properties, program) {
    return properties
        .filter(property => property.shaderPrograms?.includes(program))
        .map(property => `uniform ${property.uniformType} ${property.uniformName};`)
        .join("\n");
}

function readTexture(valueDimensions, field, offsetX, offsetY, channel) {
    const verticalShift = valueDimensions - field;
    return `sampleState(texCoordLocal + pixelSize * vec2(${glslFloat(offsetX)}, ${glslFloat(offsetY)}), ` +
        `${glslFloat(verticalShift)} * h, h, pixelSize).${channel}`;
}

function parseDisplayedQuantities(source, valueDimensions) {
    const expressions = [];
    const pattern = /`([^`]*)`|"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'/g;
    for (const match of String(source).matchAll(pattern)) expressions.push(match[1] ?? match[2] ?? match[3]);
    if (expressions.length !== valueDimensions) {
        throw new Error(`Displayed quantities must contain ${valueDimensions} quoted or backtick-delimited expressions.`);
    }
    return expressions;
}

function splitEquation(equation, valueDimensions) {
    const sections = String(equation).split("#");
    if (sections.length !== valueDimensions + 1) {
        throw new Error(`Equation requires one shared section and ${valueDimensions} field sections separated by #.`);
    }
    return sections.map(section => section.replace(/(\r\n|\n|\r)/gm, "\n"));
}

function vertexShaderSource(properties) {
    return `#version 300 es
precision highp float;

in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;

${uniformDeclarations(properties, "vertex")}
uniform float flipY;

void main() {
    vec2 clipSpace = (a_position / vec2(width, height)) * 2.0 - 1.0;
    gl_Position = vec4(clipSpace * vec2(1.0, flipY), 0.0, 1.0);
    v_texCoord = a_texCoord;
}`;
}

function centralAndNeighbourVariables(valueDimensions) {
    return [...Array(valueDimensions).keys()].map(index => {
        const field = index + 1;
        const sample = (x, y, channel = "r") => readTexture(valueDimensions, field, x, y, channel);
        return `
float u_${field} = ${sample(0, 0)};
float u_${field}_t = ${sample(0, 0, "g")};
float u_${field}_tt = 0.0;
float u_${field}_right = ${sample(1, 0)};
float u_${field}_left = ${sample(-1, 0)};
float u_${field}_above = ${sample(0, 1)};
float u_${field}_below = ${sample(0, -1)};
float u_${field}_right_above = ${sample(1, 1)};
float u_${field}_right_below = ${sample(1, -1)};
float u_${field}_left_above = ${sample(-1, 1)};
float u_${field}_left_below = ${sample(-1, -1)};
`;
    }).join("\n");
}

function effectiveIntegrationMethod(settings) {
    return settings.integrationMethod || "semiImplicitEuler";
}

function effectiveTimeOrder(settings) {
    return Number(settings.timeOrder) === 1 ? 1 : 2;
}

function stateCopies(valueDimensions) {
    return [...Array(valueDimensions).keys()].map(index => {
        const field = index + 1;
        return `float stored_u_${field} = u_${field};\nfloat stored_u_${field}_t = u_${field}_t;`;
    }).join("\n");
}

function simulationFragmentSource(properties, settings, beforeShared, fieldBranches, outsideOutput) {
    const sections = splitEquation(settings.equation, settings.valueDimensions);
    const generatedDerivatives = generateNecessaryVariables(settings, readTexture);
    return `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 outColor;

uniform sampler2D image;
uniform sampler2D imageInput;
uniform vec2 mouse;
uniform float randSeed;
${uniformDeclarations(properties, "compute")}

float randomValue(vec2 coordinate) {
    return fract(sin(dot(coordinate, vec2(12.9898, 78.233))) * 43758.5453);
}

float gaussianLike(float seed) {
    float a = randomValue(vec2(randomValue(v_texCoord.xy * (seed + 10.0)), randSeed));
    float b = randomValue(vec2(randomValue(v_texCoord.xy * 100.0), randSeed));
    float c = randomValue(vec2(randomValue(v_texCoord.xy * 1000.0), randSeed));
    float d = randomValue(vec2(randomValue(v_texCoord.yx * (seed + 11.0)), randSeed));
    float e = randomValue(vec2(randomValue(v_texCoord.yx * 101.0), randSeed));
    float f = randomValue(vec2(randomValue(v_texCoord.yx * 1001.0), randSeed));
    return (a + b + c - d - e - f) / 6.0;
}

vec2 modulo(vec2 value, vec2 period) {
    return value - floor(value / period) * period;
}

vec4 sampleState(vec2 localPosition, float verticalShift, float fieldHeight, vec2 texelSize) {
    if (boundaryCondition == 1
        && (localPosition.x < texelSize.x
            || localPosition.y < texelSize.y
            || localPosition.x > 1.0 - texelSize.x
            || localPosition.y > fieldHeight - texelSize.y)) {
        return vec4(0.0);
    }
    return texture(
        image,
        vec2(0.0, verticalShift) + modulo(localPosition, vec2(1.0, fieldHeight))
    );
}

void main() {
    vec4 previous = texture(image, v_texCoord);
    float h = ${glslFloat(1 / settings.valueDimensions)};
    int textureField = min(${settings.valueDimensions - 1}, int(floor(v_texCoord.y / h)));
    int fieldFromTop = ${settings.valueDimensions - 1} - textureField;
    vec2 texCoordLocal = v_texCoord - vec2(0.0, float(textureField) * h);
    vec2 pixelSize = vec2(1.0 / width, 1.0 / height);

    float force = 0.0;
    float noise = 0.0;
    float t = previous.b;
    float x = offsetX + (texCoordLocal.x - 0.5) * width * scaleX;
    float y = offsetY + (texCoordLocal.y - 0.5 * h) * height * scaleY;
    float X = texCoordLocal.x * width * scaleX;
    float Y = texCoordLocal.y * height * scaleY;
    float A = 0.0;
    float B = 0.0;
    float C = 0.0;
    float D = 0.0;
    float E = 0.0;
    float F = 0.0;
    float G = 0.0;
    float H = 0.0;
    float I = 0.0;
    float J = 0.0;
    float K = 0.0;
    float L = 0.0;
    float M = 0.0;
    float N = 0.0;
    float O = 0.0;
    float P = 0.0;
    float Q = 0.0;
    float R = 0.0;
    float S = 0.0;
    float T = 0.0;
    float U = 0.0;
    float V = 0.0;
    float W = 0.0;

    ${centralAndNeighbourVariables(settings.valueDimensions)}
    ${generatedDerivatives}
    ${beforeShared}

    bool insideBoundary = boundaryCondition == 0
        || (boundaryCondition == 1
            && texCoordLocal.x >= pixelSize.x
            && texCoordLocal.y >= pixelSize.y
            && texCoordLocal.x <= 1.0 - pixelSize.x
            && texCoordLocal.y <= h - pixelSize.y)
        || (boundaryCondition == 2
            && distance(texCoordLocal, vec2(0.5, 0.5 * h)) < 0.5 * h - min(pixelSize.x, pixelSize.y))
        || (boundaryCondition == 3
            && texCoordLocal.x > 0.5 * pixelSize.x
            && texCoordLocal.x < 1.0 - 0.5 * pixelSize.x);

    if (insideBoundary) {
        if (noiseStrength != 0.0) noise = gaussianLike(1.0 + randSeed);
        force = inputStrength * texture(
            imageInput,
            modulo(v_texCoord + pixelSize * (mouse + 0.5 * vec2(width, height)), vec2(1.0))
        ).b;
        ${sections[0]}
        ${fieldBranches}
    }
    else {
        ${outsideOutput}
    }
}`;
}

function fragmentShaderComputeSource(properties, settings) {
    const sections = splitEquation(settings.equation, settings.valueDimensions);
    const displayed = parseDisplayedQuantities(settings.displayedQuantity, settings.valueDimensions);
    const method = effectiveIntegrationMethod(settings);
    const timeOrder = effectiveTimeOrder(settings);
    const fieldUpdates = [...Array(settings.valueDimensions).keys()].map(index => {
        const field = index + 1;
        const display = displayed[index].startsWith("1i") ? displayed[index].slice(2).trim() : displayed[index];
        let integration = "";
        if (method !== "discrete" && timeOrder === 1) {
            integration = `u_${field} = u_${field} + scaleT * u_${field}_t;`;
        }
        else if (method !== "discrete") {
            integration = `u_${field}_t = u_${field}_t + scaleT * u_${field}_tt;\n` +
                `            u_${field} = u_${field} + scaleT * u_${field}_t;`;
        }
        return `
        if (fieldFromTop == ${index}) {
            ${sections[field]}
            ${integration}
            t = t + scaleT;
            outColor = vec4(u_${field}, u_${field}_t, t, ${display});
        }
        `;
    }).join("\n");
    return simulationFragmentSource(
        properties,
        settings,
        "",
        fieldUpdates,
        "outColor = vec4(0.0, 0.0, t + scaleT, 0.0);"
    );
}

function fragmentShaderRhsSource(properties, settings) {
    const sections = splitEquation(settings.equation, settings.valueDimensions);
    const timeOrder = effectiveTimeOrder(settings);
    const branches = [...Array(settings.valueDimensions).keys()].map(index => {
        const field = index + 1;
        const derivative = timeOrder === 1
            ? `vec2(u_${field}_t, 0.0)`
            : `vec2(stored_u_${field}_t, u_${field}_tt)`;
        return `
        if (fieldFromTop == ${index}) {
            ${sections[field]}
            outColor = vec4(${derivative}, 0.0, 0.0);
        }
        `;
    }).join("\n");
    return simulationFragmentSource(
        properties,
        settings,
        stateCopies(settings.valueDimensions),
        branches,
        "outColor = vec4(0.0);"
    );
}

function fragmentShaderFinalizeSource(properties, settings) {
    const sections = splitEquation(settings.equation, settings.valueDimensions);
    const displayed = parseDisplayedQuantities(settings.displayedQuantity, settings.valueDimensions);
    const timeOrder = effectiveTimeOrder(settings);
    const branches = [...Array(settings.valueDimensions).keys()].map(index => {
        const field = index + 1;
        const display = displayed[index].startsWith("1i") ? displayed[index].slice(2).trim() : displayed[index];
        const storedDerivative = timeOrder === 1 ? `u_${field}_t` : `stored_u_${field}_t`;
        return `
        if (fieldFromTop == ${index}) {
            ${sections[field]}
            outColor = vec4(stored_u_${field}, ${storedDerivative}, t, ${display});
        }
        `;
    }).join("\n");
    return simulationFragmentSource(
        properties,
        settings,
        stateCopies(settings.valueDimensions),
        branches,
        "outColor = vec4(0.0, 0.0, t, 0.0);"
    );
}

function fragmentShaderCombinationSource() {
    return `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 outColor;

uniform sampler2D baseImage;
uniform sampler2D derivative1;
uniform sampler2D derivative2;
uniform sampler2D derivative3;
uniform sampler2D derivative4;
uniform vec4 derivativeWeights;
uniform float timeOffset;
uniform float scaleT;

void main() {
    vec4 base = texture(baseImage, v_texCoord);
    vec2 increment = derivativeWeights.x * texture(derivative1, v_texCoord).rg
        + derivativeWeights.y * texture(derivative2, v_texCoord).rg
        + derivativeWeights.z * texture(derivative3, v_texCoord).rg
        + derivativeWeights.w * texture(derivative4, v_texCoord).rg;
    outColor = vec4(base.rg + scaleT * increment, base.b + scaleT * timeOffset, 0.0);
}`;
}

function fragmentShaderColorSource(properties, settings) {
    const displayed = parseDisplayedQuantities(settings.displayedQuantity, settings.valueDimensions);
    const complexCases = displayed.map((expression, index) =>
        `if (fieldFromTop == ${index}) isComplex = ${expression.startsWith("1i") ? 1 : 0};`
    ).join("\n");

    return `#version 300 es
#define PI radians(180.0)
precision highp float;

in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D imageColor;
${uniformDeclarations(properties, "color")}

float moduloFloat(float value, float period) {
    return value - floor(value / period) * period;
}

float phaseAngle(float real, float imaginary) {
    if (abs(real) > abs(imaginary)) return atan(imaginary, real);
    return PI / 2.0 - atan(real, imaginary);
}

vec4 colorCurve(float phase) {
    float radius = cos(PI / 3.0) / sin(PI / 6.0)
        / cos(moduloFloat(phase + PI / 4.0, 2.0 * PI / 3.0) - PI / 3.0);
    float angle = atan(sqrt(2.0));
    float q = cos(phase) * (1.0 + colorMixRatio * (radius - 1.0));
    float p = sin(phase) * (1.0 + colorMixRatio * (radius - 1.0));
    float red = 1.0 / 3.0 + 1.0 / sqrt(6.0) * (0.5 * q * (1.0 - cos(angle)) + 0.5 * p * (1.0 + cos(angle)));
    float green = 1.0 / 3.0 - 1.0 / sqrt(6.0) * (0.5 * q * (1.0 + cos(angle)) + 0.5 * p * (1.0 - cos(angle)));
    float blue = 1.0 / 3.0 + 1.0 / sqrt(6.0) * (q - p) * sin(angle) / sqrt(2.0);
    float rescaling = 1.0 / pow(max(max(red, green), blue), colorMixExponent);
    return vec4(rescaling * red, rescaling * green, rescaling * blue, 1.0);
}

void main() {
    float h = ${glslFloat(1 / settings.valueDimensions)};
    int textureField = min(${settings.valueDimensions - 1}, int(floor(v_texCoord.y / h)));
    int fieldFromTop = ${settings.valueDimensions - 1} - textureField;
    vec4 data = texture(imageColor, v_texCoord);
    int isComplex = 0;
    ${complexCases}

    vec4 color = vec4(0.5, 0.5, 0.5, 1.0);
    if (isComplex == 0) {
        float primary = sign(data.a) * pow(colorSensitivity * abs(data.a), colorExponent);
        float secondary = sign(primary) * pow(colorMixRatio * abs(primary), colorMixExponent);
        if (colorPattern == 0) {
            color = primary >= 0.0
                ? vec4(1.0 - colorCap / (1.0 + primary), 1.0 - colorCap / (1.0 + secondary), 1.0 - colorCap, 1.0)
                : vec4(1.0 - colorCap, 1.0 - colorCap / (1.0 - secondary), 1.0 - colorCap / (1.0 - primary), 1.0);
        }
        else if (colorPattern == 1) {
            color = primary >= 0.0
                ? vec4(1.0 - colorCap, 1.0 - colorCap / (1.0 + primary), 1.0 - colorCap / (1.0 + secondary), 1.0)
                : vec4(1.0 - colorCap / (1.0 - primary), 1.0 - colorCap, 1.0 - colorCap / (1.0 - secondary), 1.0);
        }
        else if (colorPattern == 2) {
            color = primary >= 0.0
                ? vec4(1.0 - colorCap / (1.0 + secondary), 1.0 - colorCap / (1.0 + primary), 1.0 - colorCap, 1.0)
                : vec4(1.0 - colorCap / (1.0 - secondary), 1.0 - colorCap, 1.0 - colorCap / (1.0 - primary), 1.0);
        }
        else if (colorPattern == 3) {
            color = primary >= 0.0
                ? vec4(colorCap / (1.0 + primary), colorCap / (1.0 + secondary), colorCap, 1.0)
                : vec4(colorCap, colorCap / (1.0 - secondary), colorCap / (1.0 - primary), 1.0);
        }
        else if (colorPattern == 4) {
            color = primary >= 0.0
                ? vec4(colorCap, colorCap / (1.0 + primary), colorCap / (1.0 + secondary), 1.0)
                : vec4(colorCap / (1.0 - primary), colorCap, colorCap / (1.0 - secondary), 1.0);
        }
        else if (colorPattern == 5) {
            color = primary >= 0.0
                ? vec4(colorCap / (1.0 + secondary), colorCap / (1.0 + primary), colorCap, 1.0)
                : vec4(colorCap / (1.0 - secondary), colorCap, colorCap / (1.0 - primary), 1.0);
        }
    }
    else {
        float magnitude = length(vec2(data.r, data.a));
        float phase = phaseAngle(data.r, data.a);
        float brightness = pow(colorSensitivity * magnitude, colorExponent);
        color = vec4(vec3(1.0 - 1.0 / (1.0 + brightness)), 1.0) * colorCurve(phase);
    }
    outColor = color;
}`;
}

export {
    effectiveIntegrationMethod,
    effectiveTimeOrder,
    fragmentShaderColorSource,
    fragmentShaderCombinationSource,
    fragmentShaderComputeSource,
    fragmentShaderFinalizeSource,
    fragmentShaderRhsSource,
    parseDisplayedQuantities,
    readTexture,
    splitEquation,
    vertexShaderSource
};
