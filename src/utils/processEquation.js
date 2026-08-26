function binomial(n, k) {
    if (k < 0 || k > n) return 0;
    let result = 1;
    for (let index = 1; index <= Math.min(k, n - k); index += 1) {
        result = result * (n - index + 1) / index;
    }
    return result;
}

function finiteDifferenceCoefficients(order) {
    return [...Array(order + 1).keys()].map(index =>
        ((order - index) % 2 === 0 ? 1 : -1) * binomial(order, index)
    );
}

function signedIndex(value) {
    if (value < 0) return `m${Math.abs(value)}`;
    if (value > 0) return `p${value}`;
    return "0";
}

function sampleVariable(field, timeDerivative, offsetX, offsetY) {
    if (offsetX === 0 && offsetY === 0) return `u_${field}${timeDerivative ? "_t" : ""}`;
    return `u_${field}${timeDerivative ? "_t" : ""}_${signedIndex(offsetX)}_${signedIndex(offsetY)}`;
}

function parseDerivativeReferences(source, valueDimensions) {
    const references = [];
    const seen = new Set();
    const expression = /\bu_(\d+)(_t)?_([xy]+)\b/g;
    for (const match of source.matchAll(expression)) {
        const name = match[0];
        if (seen.has(name)) continue;
        const field = Number(match[1]);
        if (field < 1 || field > valueDimensions) {
            throw new Error(`Derivative '${name}' refers to field ${field}, but valueDimensions is ${valueDimensions}.`);
        }
        const axes = match[3];
        references.push({
            name,
            field,
            timeDerivative: Boolean(match[2]),
            orderX: [...axes].filter(axis => axis === "x").length,
            orderY: [...axes].filter(axis => axis === "y").length
        });
        seen.add(name);
    }
    return references;
}

function stencilTerms(reference) {
    const coefficientsX = finiteDifferenceCoefficients(reference.orderX);
    const coefficientsY = finiteDifferenceCoefficients(reference.orderY);
    const offsetStartX = -Math.floor(reference.orderX / 2);
    const offsetStartY = -Math.floor(reference.orderY / 2);
    const terms = [];
    coefficientsX.forEach((coefficientX, indexX) => {
        coefficientsY.forEach((coefficientY, indexY) => {
            terms.push({
                coefficient: coefficientX * coefficientY,
                offsetX: offsetStartX + indexX,
                offsetY: offsetStartY + indexY
            });
        });
    });
    return terms;
}

function generateNecessaryVariables(settings, lookup) {
    const source = `${settings.equation}\n${settings.displayedQuantity}`;
    const references = parseDerivativeReferences(source, settings.valueDimensions);
    const lookups = new Map();

    for (const reference of references) {
        for (const term of stencilTerms(reference)) {
            if (term.offsetX === 0 && term.offsetY === 0) continue;
            const variable = sampleVariable(reference.field, reference.timeDerivative, term.offsetX, term.offsetY);
            if (!lookups.has(variable)) {
                lookups.set(variable,
                    `float ${variable} = ${lookup(
                        settings.valueDimensions,
                        reference.field,
                        term.offsetX,
                        term.offsetY,
                        reference.timeDerivative ? "g" : "r"
                    )};`
                );
            }
        }
    }

    const derivativeLines = references.map(reference => {
        const sum = stencilTerms(reference).map(term => {
            const variable = sampleVariable(
                reference.field,
                reference.timeDerivative,
                term.offsetX,
                term.offsetY
            );
            return `(${term.coefficient.toFixed(1)}) * ${variable}`;
        }).join("\n        + ");
        return `float ${reference.name} = ` +
            `pow(scaleX, ${(-reference.orderX).toFixed(1)}) * ` +
            `pow(scaleY, ${(-reference.orderY).toFixed(1)}) * (` + sum + `);`;
    });

    return [...lookups.values(), ...derivativeLines].join("\n");
}

export {
    finiteDifferenceCoefficients,
    generateNecessaryVariables,
    parseDerivativeReferences,
    sampleVariable,
    stencilTerms
};
