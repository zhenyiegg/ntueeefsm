// kmap.jsx

export function simplifyBooleanFunction(minterms, numVariables, validIndices) {
    // If caller does not supply a validIndices set, we default to the old behavior
    const hasDontCares = !!validIndices;

    const variables = [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
    ].slice(0, numVariables);

    // Build a list of all possible combos 0..(2^numVariables -1)
    const allMinterms = [];
    for (let i = 0; i < 1 << numVariables; i++) {
        const binary = i.toString(2).padStart(numVariables, "0");

        // Decide if it's a 1, 0, or don't‐care
        let val = 0;
        if (minterms.includes(i)) {
            val = 1; // definitely 1
        } else if (hasDontCares && !validIndices.has(i)) {
            val = 2; // treat as don't‐care
        } else {
            val = 0; // forced 0
        }
        allMinterms.push({ binary, value: val, used: false });
    }

    // Now group all items that are 1 or 2 (don't‐care can be grouped with 1)
    let groups = {};
    allMinterms.forEach((m) => {
        if (m.value === 1 || m.value === 2) {
            const ones = m.binary.split("").filter((x) => x === "1").length;
            if (!groups[ones]) groups[ones] = [];
            groups[ones].push(m);
        }
    });

    const primeImplicants = [];
    let canCombine = true;

    while (canCombine) {
        canCombine = false;
        const newGroups = {};

        const sortedKeys = Object.keys(groups)
            .map(Number)
            .sort((a, b) => a - b);

        for (let idx = 0; idx < sortedKeys.length - 1; idx++) {
            const groupA = groups[sortedKeys[idx]];
            const groupB = groups[sortedKeys[idx + 1]];

            for (const mA of groupA) {
                for (const mB of groupB) {
                    const d = diffBits(mA.binary, mB.binary);
                    // We can combine if they differ by 1 bit AND neither is purely 0 (they're 1 or 2 or both)
                    if (d.count === 1) {
                        canCombine = true;
                        const combined = replaceBit(mA.binary, d.index, "-");
                        if (!newGroups[sortedKeys[idx]]) {
                            newGroups[sortedKeys[idx]] = [];
                        }
                        newGroups[sortedKeys[idx]].push({
                            binary: combined,
                            // union of minterm sets
                            minterms: [
                                ...(mA.minterms || [parseInt(mA.binary, 2)]),
                                ...(mB.minterms || [parseInt(mB.binary, 2)]),
                            ],
                            value: mA.value === 2 || mB.value === 2 ? 2 : 1, // if either is don't-care, result is don't-care
                            used: false,
                        });
                        mA.used = true;
                        mB.used = true;
                    }
                }
            }
        }

        // Move all uncombined 1/don't-care items into primeImplicants
        Object.values(groups)
            .flat()
            .forEach((m) => {
                if (!m.used && (m.value === 1 || m.value === 2)) {
                    primeImplicants.push({
                        binary: m.binary,
                        minterms: m.minterms || [parseInt(m.binary, 2)],
                        value: m.value,
                    });
                }
            });

        // Rebuild next iteration groups
        groups = {};
        Object.keys(newGroups).forEach((k) => {
            if (!groups[k]) groups[k] = [];
            groups[k].push(...newGroups[k]);
        });
    }

    // Remove duplicates
    const uniquePrimes = [];
    for (const imp of primeImplicants) {
        if (
            !uniquePrimes.some(
                (u) =>
                    u.binary === imp.binary &&
                    u.minterms.toString() === imp.minterms.toString()
            )
        ) {
            uniquePrimes.push(imp);
        }
    }

    // Convert each prime implicant to an expression
    const expressions = uniquePrimes
        // We only keep those that are actually 1 or 2 in at least one minterm
        .filter((imp) => imp.value !== 0)
        .map((imp) => binaryToExpression(imp.binary, variables));

    // If everything was don't-care or we have no expressions, it might be "0" or "1"
    // Usually, if we had actual minterms, we OR them
    const finalExpression =
        expressions.length > 0 ? expressions.join(" + ") : "0";

    return finalExpression;
}

function diffBits(a, b) {
    let count = 0;
    let index = -1;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            count++;
            index = i;
        }
    }
    return { count, index };
}

function replaceBit(str, index, char) {
    return str.substring(0, index) + char + str.substring(index + 1);
}

function binaryToExpression(binary, variables) {
    let term = "";
    for (let i = 0; i < binary.length; i++) {
        if (binary[i] === "1") {
            term += variables[i];
        } else if (binary[i] === "0") {
            term += variables[i] + "'";
        }
        // If it's '-', we skip the variable (it's eliminated)
    }
    return term || "1"; // If term is empty, it's a tautology
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * Given a list of minterm decimal indices, return a canonical
 * sum-of-minterms string: "Σm(1,3,5,...)"
 */
export function getCanonicalSumOfMinterms(mintermIndices, numVars) {
    // Sort for nicer display
    const sorted = [...mintermIndices].sort((a, b) => a - b);

    // Example: F = Σm(1,3,5,...)
    return `Σm(${sorted.join(",")})`;
}

/**
 * Given a list of minterm decimal indices (where F=1) and total
 * number of variables, return the complementary maxterm indices
 * and produce a canonical product-of-maxterms string: "ΠM(0,2,4,...)"
 */
export function getCanonicalProductOfMaxterms(mintermIndices, numVars) {
    const allIndices = Array.from({ length: 2 ** numVars }, (_, i) => i);
    const maxtermIndices = allIndices.filter(
        (i) => !mintermIndices.includes(i)
    );
    const sorted = maxtermIndices.sort((a, b) => a - b);

    // Example: F = ΠM(0,2,4,7,...)
    return `ΠM(${sorted.join(",")})`;
}
