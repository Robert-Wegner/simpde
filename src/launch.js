import {makeInputTexture, makeShaderPrograms, makeStateTextures} from "./makerFunctions";

const RK = Object.freeze({STATE_A: 0, STATE_B: 1, K1: 2, K2: 3, K3: 4, K4: 5, STAGE: 6});

function launch(canvas, specification, settings) {
    const gl = canvas.getContext("webgl2");
    if (!gl) throw new Error("This browser or graphics driver does not support WebGL 2.");
    if (!gl.getExtension("EXT_color_buffer_float")) {
        throw new Error("This browser or graphics driver cannot render to floating-point textures.");
    }

    const isRK4 = settings.integrationMethod === "rk4";
    const state = makeStateTextures(gl, specification, settings, isRK4 ? 7 : 2);
    const inputTexture = makeInputTexture(gl, settings);
    const programs = makeShaderPrograms(gl, specification, settings);
    const appliedSettings = {...settings};
    let frame = 0;
    let inputSign = 1;
    let disposed = false;

    const uniformLocations = Object.fromEntries(programs.programNames.map(name => [name, new Map()]));
    const targetPrograms = property => {
        const targets = new Set();
        if (property.shaderPrograms?.includes("compute")) {
            programs.computeProgramNames.forEach(name => targets.add(name));
        }
        if (property.shaderPrograms?.includes("color")) targets.add("color");
        if (property.shaderPrograms?.includes("vertex")) {
            programs.programNames.forEach(name => targets.add(name));
        }
        return [...targets];
    };

    for (const property of specification.vars) {
        for (const programName of targetPrograms(property)) {
            uniformLocations[programName].set(
                property.name,
                gl.getUniformLocation(programs[programName], property.uniformName)
            );
        }
    }

    function setUniform(programName, property, value) {
        if (!property || !uniformLocations[programName]) return;
        const location = uniformLocations[programName].get(property.name);
        if (location === null || location === undefined) return;
        gl.useProgram(programs[programName]);
        if (property.uniformType === "float") gl.uniform1f(location, value);
        else if (property.uniformType === "int") gl.uniform1i(location, value);
    }

    for (const property of specification.vars) {
        for (const programName of targetPrograms(property)) {
            const value = property.name === "inputStrength" ? 0 : settings[property.name];
            setUniform(programName, property, value);
        }
    }

    function setSampler(programName, uniformName, unit) {
        if (!programs[programName]) return;
        const location = gl.getUniformLocation(programs[programName], uniformName);
        if (location === null) return;
        gl.useProgram(programs[programName]);
        gl.uniform1i(location, unit);
    }

    for (const programName of programs.programNames) {
        gl.useProgram(programs[programName]);
        const flipY = gl.getUniformLocation(programs[programName], "flipY");
        if (flipY !== null) gl.uniform1f(flipY, 1);
    }
    if (isRK4) {
        setSampler("rhs", "image", 0);
        setSampler("rhs", "imageInput", 1);
        setSampler("combine", "baseImage", 0);
        setSampler("combine", "derivative1", 1);
        setSampler("combine", "derivative2", 2);
        setSampler("combine", "derivative3", 3);
        setSampler("combine", "derivative4", 4);
        setSampler("finalize", "image", 0);
        setSampler("finalize", "imageInput", 1);
    }
    else {
        setSampler("compute", "image", 0);
        setSampler("compute", "imageInput", 1);
    }
    setSampler("color", "imageColor", 0);

    const inputStrengthProperty = specification.vars.find(property => property.name === "inputStrength");
    const equationProgramNames = isRK4 ? ["rhs", "finalize"] : ["compute"];
    const mouseLocations = Object.fromEntries(equationProgramNames.map(name => {
        gl.useProgram(programs[name]);
        const randSeed = gl.getUniformLocation(programs[name], "randSeed");
        if (randSeed !== null) gl.uniform1f(randSeed, 0);
        const mouse = gl.getUniformLocation(programs[name], "mouse");
        if (mouse !== null) gl.uniform2f(mouse, 0, 0);
        return [name, mouse];
    }));

    function updateMouse(event) {
        const point = event.touches?.[0] || event;
        const rectangle = canvas.getBoundingClientRect();
        const x = (point.clientX - rectangle.left) * settings.width / rectangle.width;
        const y = (point.clientY - rectangle.top) * settings.height / rectangle.height;
        for (const programName of equationProgramNames) {
            if (mouseLocations[programName] === null) continue;
            gl.useProgram(programs[programName]);
            gl.uniform2f(mouseLocations[programName], -x, y);
        }
    }

    function setInputStrength(value) {
        for (const programName of equationProgramNames) setUniform(programName, inputStrengthProperty, value);
    }

    function beginInput(event) {
        event.preventDefault();
        updateMouse(event);
        setInputStrength(inputSign * appliedSettings.inputStrength);
        inputSign *= -1;
    }

    function endInput(event) {
        event.preventDefault();
        setInputStrength(0);
    }

    canvas.addEventListener("pointerdown", beginInput);
    canvas.addEventListener("pointermove", updateMouse);
    canvas.addEventListener("pointerup", endInput);
    canvas.addEventListener("pointercancel", endInput);
    canvas.addEventListener("pointerleave", endInput);

    function draw(programName, targetFramebuffer, bindings) {
        gl.useProgram(programs[programName]);
        gl.bindVertexArray(programs.vertexArrays[programName]);
        for (const [unit, texture] of bindings.entries()) {
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, texture);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, targetFramebuffer);
        gl.viewport(0, 0, settings.width, settings.height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    function updateNoiseSeed() {
        if (appliedSettings.noiseStrength === 0) return;
        const seed = Math.random();
        for (const programName of equationProgramNames) {
            gl.useProgram(programs[programName]);
            const location = gl.getUniformLocation(programs[programName], "randSeed");
            if (location !== null) gl.uniform1f(location, seed);
        }
    }

    function drawColor(texture) {
        draw("color", null, new Map([[0, texture]]));
    }

    function updateLegacy() {
        const current = frame % 2;
        const next = (frame + 1) % 2;
        draw("compute", state.framebuffers[next], new Map([[0, state.textures[current]], [1, inputTexture]]));
        drawColor(state.textures[next]);
        frame += 1;
    }

    function combine(baseIndex, derivativeIndices, weights, timeOffset, targetIndex) {
        gl.useProgram(programs.combine);
        gl.uniform4f(gl.getUniformLocation(programs.combine, "derivativeWeights"), ...weights);
        gl.uniform1f(gl.getUniformLocation(programs.combine, "timeOffset"), timeOffset);
        draw("combine", state.framebuffers[targetIndex], new Map([
            [0, state.textures[baseIndex]],
            [1, state.textures[derivativeIndices[0]]],
            [2, state.textures[derivativeIndices[1]]],
            [3, state.textures[derivativeIndices[2]]],
            [4, state.textures[derivativeIndices[3]]]
        ]));
    }

    function updateRK4() {
        const current = frame % 2 === 0 ? RK.STATE_A : RK.STATE_B;
        const next = frame % 2 === 0 ? RK.STATE_B : RK.STATE_A;
        const repeated = index => [index, index, index, index];

        draw("rhs", state.framebuffers[RK.K1], new Map([[0, state.textures[current]], [1, inputTexture]]));
        combine(current, repeated(RK.K1), [0.5, 0, 0, 0], 0.5, RK.STAGE);
        draw("rhs", state.framebuffers[RK.K2], new Map([[0, state.textures[RK.STAGE]], [1, inputTexture]]));
        combine(current, repeated(RK.K2), [0.5, 0, 0, 0], 0.5, RK.STAGE);
        draw("rhs", state.framebuffers[RK.K3], new Map([[0, state.textures[RK.STAGE]], [1, inputTexture]]));
        combine(current, repeated(RK.K3), [1, 0, 0, 0], 1, RK.STAGE);
        draw("rhs", state.framebuffers[RK.K4], new Map([[0, state.textures[RK.STAGE]], [1, inputTexture]]));
        combine(current, [RK.K1, RK.K2, RK.K3, RK.K4], [1 / 6, 1 / 3, 1 / 3, 1 / 6], 1, RK.STAGE);
        draw("finalize", state.framebuffers[next], new Map([[0, state.textures[RK.STAGE]], [1, inputTexture]]));
        drawColor(state.textures[next]);
        frame += 1;
    }

    function update() {
        if (disposed) return;
        updateNoiseSeed();
        if (isRK4) updateRK4();
        else updateLegacy();
    }

    update();
    const interval = window.setInterval(() => {
        for (let iteration = 0; iteration < appliedSettings.speed; iteration += 1) update();
    }, appliedSettings.delay);

    return {
        updateSetting(name, value) {
            appliedSettings[name] = value;
            const property = specification.vars.find(item => item.name === name);
            if (!property || name === "inputStrength") return;
            for (const programName of targetPrograms(property)) setUniform(programName, property, value);
        },
        dispose() {
            if (disposed) return;
            disposed = true;
            window.clearInterval(interval);
            canvas.removeEventListener("pointerdown", beginInput);
            canvas.removeEventListener("pointermove", updateMouse);
            canvas.removeEventListener("pointerup", endInput);
            canvas.removeEventListener("pointercancel", endInput);
            canvas.removeEventListener("pointerleave", endInput);
            state.framebuffers.forEach(framebuffer => gl.deleteFramebuffer(framebuffer));
            state.textures.forEach(texture => gl.deleteTexture(texture));
            gl.deleteTexture(inputTexture);
            programs.dispose();
        }
    };
}

export {launch, RK};
