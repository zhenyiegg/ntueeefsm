// kmap.jsx

export function simplifyBooleanFunction(minterms, numVariables, validIndices) {
    const hasDontCares = !!validIndices;

    const variables = ["A", "B", "C", "D", "E", "F", "G", "H"].slice(
        0,
        numVariables
    );

    // Use Set to ensure unique minterms
    const uniqueMinterms = new Set(minterms);

    // Build minterm objects with proper tracking
    const allMinterms = [];
    for (let i = 0; i < 1 << numVariables; i++) {
        const binary = i.toString(2).padStart(numVariables, "0");

        let val = 0;
        if (uniqueMinterms.has(i)) {
            val = 1;
        } else if (hasDontCares && !validIndices.has(i)) {
            val = 2; // don't-care
        }

        allMinterms.push({
            binary,
            value: val,
            used: false,
            minterms: [i],
        });
    }

    // Group by number of 1s
    let groups = {};
    allMinterms.forEach((m) => {
        if (m.value === 1 || m.value === 2) {
            const ones = m.binary.split("").filter((x) => x === "1").length;
            if (!groups[ones]) groups[ones] = [];
            groups[ones].push(m);
        }
    });

    const primeImplicants = new Set();

    // Combine terms
    while (Object.keys(groups).length > 0) {
        const newGroups = {};
        let combined = false;

        const groupNums = Object.keys(groups)
            .map(Number)
            .sort((a, b) => a - b);

        for (let i = 0; i < groupNums.length - 1; i++) {
            const currentGroup = groups[groupNums[i]];
            const nextGroup = groups[groupNums[i + 1]];

            for (const term1 of currentGroup) {
                for (const term2 of nextGroup) {
                    const diff = diffBits(term1.binary, term2.binary);

                    if (diff.count === 1) {
                        combined = true;
                        const newTerm = {
                            binary: replaceBit(term1.binary, diff.index, "-"),
                            value:
                                term1.value === 2 || term2.value === 2 ? 2 : 1,
                            used: false,
                            minterms: [
                                ...new Set([
                                    ...term1.minterms,
                                    ...term2.minterms,
                                ]),
                            ],
                        };

                        const groupIndex = groupNums[i];
                        if (!newGroups[groupIndex]) newGroups[groupIndex] = [];
                        newGroups[groupIndex].push(newTerm);

                        term1.used = true;
                        term2.used = true;
                    }
                }
            }
        }

        // Collect uncombined terms as prime implicants
        Object.values(groups)
            .flat()
            .forEach((term) => {
                if (!term.used && (term.value === 1 || term.value === 2)) {
                    primeImplicants.add(
                        binaryToExpression(term.binary, variables)
                    );
                }
            });

        if (!combined) break;
        groups = newGroups;
    }

    // Convert to final expression
    const terms = Array.from(primeImplicants);
    return terms.length > 0 ? terms.join(" + ") : "0";
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
