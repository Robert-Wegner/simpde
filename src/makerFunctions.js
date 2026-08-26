import {
    fragmentShaderColorSource,
    fragmentShaderCombinationSource,
    fragmentShaderComputeSource,
    fragmentShaderFinalizeSource,
    fragmentShaderRhsSource,
    vertexShaderSource
} from "./shaders";

function createTexture(gl) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return texture;
}

function compileShader(gl, type, source, label) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const details = gl.getShaderInfoLog(shader) || "Unknown shader compilation error.";
        gl.deleteShader(shader);
        throw new Error(`${label} shader failed to compile:\n${details}`);
    }
    return shader;
}

function linkProgram(gl, vertexShader, fragmentShader, label) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const details = gl.getProgramInfoLog(program) || "Unknown program link error.";
        gl.deleteProgram(program);
        throw new Error(`${label} program failed to link:\n${details}`);
    }
    return program;
}

function makeGeometry(gl, width, height) {
    const positions = new Float32Array([
        0, 0, width, 0, 0, height,
        0, height, width, 0, width, height
    ]);
    const textureCoordinates = new Float32Array([
        0, 0, 1, 0, 0, 1,
        0, 1, 1, 0, 1, 1
    ]);
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, textureCoordinates, gl.STATIC_DRAW);
    return {positionBuffer, textureBuffer};
}

function makeVertexArray(gl, program, geometry) {
    const vertexArray = gl.createVertexArray();
    gl.bindVertexArray(vertexArray);
    const position = gl.getAttribLocation(program, "a_position");
    gl.bindBuffer(gl.ARRAY_BUFFER, geometry.positionBuffer);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const textureCoordinate = gl.getAttribLocation(program, "a_texCoord");
    gl.bindBuffer(gl.ARRAY_BUFFER, geometry.textureBuffer);
    gl.enableVertexAttribArray(textureCoordinate);
    gl.vertexAttribPointer(textureCoordinate, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    return vertexArray;
}

function makeShaderPrograms(gl, specification, settings) {
    const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource(specification.vars), "Vertex");
    const rk4 = settings.integrationMethod === "rk4";
    const sources = rk4
        ? {
            rhs: fragmentShaderRhsSource(specification.vars, settings),
            combine: fragmentShaderCombinationSource(),
            finalize: fragmentShaderFinalizeSource(specification.vars, settings),
            color: fragmentShaderColorSource(specification.vars, settings)
        }
        : {
            compute: fragmentShaderComputeSource(specification.vars, settings),
            color: fragmentShaderColorSource(specification.vars, settings)
        };
    const fragments = {};
    const programs = {};
    for (const [name, source] of Object.entries(sources)) {
        const label = name[0].toUpperCase() + name.slice(1);
        fragments[name] = compileShader(gl, gl.FRAGMENT_SHADER, source, label);
        programs[name] = linkProgram(gl, vertex, fragments[name], label);
    }
    const geometry = makeGeometry(gl, settings.width, settings.height);
    const vertexArrays = {};
    for (const [name, program] of Object.entries(programs)) {
        vertexArrays[name] = makeVertexArray(gl, program, geometry);
    }
    const programNames = Object.keys(programs);
    const computeProgramNames = rk4 ? ["rhs", "combine", "finalize"] : ["compute"];

    return {
        ...programs,
        programNames,
        computeProgramNames,
        vertexArrays,
        dispose() {
            Object.values(vertexArrays).forEach(vertexArray => gl.deleteVertexArray(vertexArray));
            gl.deleteBuffer(geometry.positionBuffer);
            gl.deleteBuffer(geometry.textureBuffer);
            Object.values(programs).forEach(program => gl.deleteProgram(program));
            gl.deleteShader(vertex);
            Object.values(fragments).forEach(fragment => gl.deleteShader(fragment));
        }
    };
}

function compileInitialDataFunction(specification, settings) {
    const parameters = specification.vars
        .filter(property => ["int", "float"].includes(property.type) && /^[A-Za-z_$][\w$]*$/.test(property.name));
    const names = parameters.map(property => property.name);
    const values = parameters.map(property => settings[property.name]);
    let factory;
    try {
        // Initial-data functions are intentionally user-authored code, like the user-authored GLSL equation.
        // eslint-disable-next-line no-new-func
        factory = Function(...names, `"use strict"; return (${settings.initialDataFunction});`);
    }
    catch (error) {
        throw new Error(`Initial data could not be parsed: ${error.message}`);
    }
    const initialData = factory(...values);
    if (typeof initialData !== "function") throw new Error("Initial data must evaluate to a function of (x, y).");
    return initialData;
}

function makeStateTextures(gl, specification, settings, textureCount = 2) {
    const {width, height, valueDimensions, scaleX, scaleY} = settings;
    const initialDataFunction = compileInitialDataFunction(specification, settings);
    const textures = [];
    const framebuffers = [];
    const slabHeight = height / valueDimensions;

    for (let textureIndex = 0; textureIndex < textureCount; textureIndex += 1) {
        const texture = createTexture(gl);
        const data = new Float32Array(4 * width * height);
        if (textureIndex === 0) {
            for (let row = 0; row < height; row += 1) {
                const textureField = Math.min(valueDimensions - 1, Math.floor(row / slabHeight));
                const fieldFromTop = valueDimensions - 1 - textureField;
                const localRow = row - textureField * slabHeight;
                const y = (localRow + 0.5 - slabHeight / 2) * scaleY;
                for (let column = 0; column < width; column += 1) {
                    const x = (column + 0.5 - width / 2) * scaleX;
                    const allFields = initialDataFunction(x, y);
                    const fieldData = allFields?.[fieldFromTop];
                    if (!Array.isArray(fieldData) || fieldData.length < 2 ||
                        !Number.isFinite(Number(fieldData[0])) || !Number.isFinite(Number(fieldData[1]))) {
                        throw new Error(`Initial data must return [value, timeDerivative] for field ${fieldFromTop + 1}.`);
                    }
                    const offset = 4 * (row * width + column);
                    data[offset] = Number(fieldData[0]);
                    data[offset + 1] = Number(fieldData[1]);
                }
            }
        }
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, data);
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            throw new Error("The floating-point simulation framebuffer is incomplete.");
        }
        textures.push(texture);
        framebuffers.push(framebuffer);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return {textures, framebuffers};
}

function makeInputTexture(gl, settings) {
    const {width, height, inputRadius} = settings;
    const texture = createTexture(gl);
    const data = new Float32Array(4 * width * height);
    const radiusSquared = inputRadius * inputRadius;
    for (let row = 0; row < height; row += 1) {
        for (let column = 0; column < width; column += 1) {
            const distanceSquared = (row - height / 2) ** 2 + (column - width / 2) ** 2;
            const offset = 4 * (row * width + column);
            data[offset + 2] = distanceSquared < radiusSquared
                ? 2 ** (-radiusSquared / (radiusSquared - distanceSquared))
                : 0;
        }
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, data);
    return texture;
}

export {
    compileInitialDataFunction,
    compileShader,
    linkProgram,
    makeInputTexture,
    makeShaderPrograms,
    makeStateTextures
};
