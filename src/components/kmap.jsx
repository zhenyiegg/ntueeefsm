// kmap.jsx

export function simplifyBooleanFunction(
    minterms,
    numVariables,
    validIndices,
    actualNumStateBits
) {
    const hasDontCares = !!validIndices;

    // Create variable names based on state bits (Q) and inputs (X)
    const variables = [];

    // Use the provided actualNumStateBits if available, otherwise use a default calculation
    const numStateBits = actualNumStateBits || Math.ceil(Math.log2(8)); // Default: 8 states max = 3 bits
    const numInputBits = numVariables - numStateBits;

    // Add state variables (Q1, Q0, etc.) but only up to the actual number of state bits
    for (let i = numStateBits - 1; i >= 0; i--) {
        variables.push(`Q${i}`);
    }

    // Add input variables (X1, X0, etc.)
    // For single input case, use X0 instead of X
    if (numInputBits === 1) {
        variables.push("X0");
    } else {
        for (let i = numInputBits - 1; i >= 0; i--) {
            variables.push(`X${i}`);
        }
    }

    // Slice to get only the needed number of variables
    variables.length = numVariables;

    // Check for special cases
    // If there are no minterms, return "0"
    if (minterms.length === 0) {
        return "0";
    }

    // For a specific special case: check if all minterms correspond to a single input variable
    // This is a common case when simplifying to expressions like just X0
    if (numInputBits === 1 && minterms.length > 0) {
        // Check if all minterms are odd (X0 = 1) or all are even (X0 = 0)
        const allOdd = minterms.every((m) => m % 2 === 1);
        const allEven = minterms.every((m) => m % 2 === 0);

        // If all valid minterms are odd, this means X0 = 1 for all of them
        if (allOdd && hasDontCares) {
            // Now check if this would cover all valid state-input combinations where X0 = 1
            const allValidWithX0One = Array.from(validIndices).filter(
                (idx) => idx % 2 === 1
            ); // All valid indices where X0 = 1

            // If our minterms include all valid combinations where X0 = 1
            if (
                allValidWithX0One.length === minterms.length &&
                allValidWithX0One.every((idx) => minterms.includes(idx))
            ) {
                return "X0";
            }
        }

        // If all valid minterms are even, this means X0 = 0 for all of them
        if (allEven && hasDontCares) {
            // Check if this would cover all valid state-input combinations where X0 = 0
            const allValidWithX0Zero = Array.from(validIndices).filter(
                (idx) => idx % 2 === 0
            ); // All valid indices where X0 = 0

            // If our minterms include all valid combinations where X0 = 0
            if (
                allValidWithX0Zero.length === minterms.length &&
                allValidWithX0Zero.every((idx) => minterms.includes(idx))
            ) {
                return "X0'";
            }
        }
    }

    // Use Set to ensure unique minterms
    const uniqueMinterms = new Set(minterms);

    // Build minterm objects with proper tracking
    const allMinterms = [];
    for (let i = 0; i < 1 << numVariables; i++) {
        const binary = i.toString(2).padStart(numVariables, "0");

        let val = 0;
        if (uniqueMinterms.has(i)) {
            val = 1; // This is a minterm (function output is 1)
        } else if (hasDontCares && !validIndices.has(i)) {
            // Don't care terms are those NOT in validIndices
            // validIndices contains all state-input combinations that are valid in the FSM
            // Any combination not in validIndices is a "don't care" state
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

        // Collect uncombined terms as prime implicants, but only if they are minterms (not don't cares)
        Object.values(groups)
            .flat()
            .forEach((term) => {
                if (!term.used) {
                    // Only add actual minterms to the final expression
                    // Don't care terms (value=2) are used for grouping but not included in final terms
                    if (term.value === 1) {
                        primeImplicants.add(
                            binaryToExpression(term.binary, variables)
                        );
                    }
                }
            });

        if (!combined) break;
        groups = newGroups;
    }

    // Convert to final expression
    const terms = Array.from(primeImplicants);

    // Special case check for JK flip-flops with single minterms
    // If we're getting "0" but there are minterms, ensure the expression is correct
    if (terms.length === 0 && minterms.length > 0) {
        // Generate expressions directly from the minterms
        const mintermExpressions = minterms.map((m) => {
            const binary = m.toString(2).padStart(numVariables, "0");
            return binaryToExpression(binary, variables);
        });
        return mintermExpressions.join(" + ");
    }

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
    // If there are no minterms, return "0" instead of "Σm()"
    if (mintermIndices.length === 0) {
        return "0";
    }

    // Sort for nicer display
    const sorted = [...mintermIndices].sort((a, b) => a - b);

    // Example: F = Σm(1,3,5,...)
    return `Σm(${sorted.join(",")})`;
}

/**
 * Given a list of minterm decimal indices (where Function Output=1), total
 * number of variables, and validIndices, return the complementary maxterm indices
 * and produce a canonical product-of-maxterms string: "ΠM(0,2,4,...)"
 *
 * validIndices represents the state-input combinations that are used in the FSM.
 * Any combination not in validIndices is a don't care state and should be excluded
 * from both minterms and maxterms.
 */
export function getCanonicalProductOfMaxterms(
    mintermIndices,
    numVars,
    validIndices
) {
    const allIndices = Array.from({ length: 2 ** numVars }, (_, i) => i);
    let maxtermIndices;

    if (validIndices) {
        // If validIndices is provided, only include indices that are valid (not don't cares)
        // and not in the minterms list
        maxtermIndices = allIndices.filter(
            (i) => validIndices.has(i) && !mintermIndices.includes(i)
        );
    } else {
        // Backward compatibility: if validIndices is not provided, use original behavior
        maxtermIndices = allIndices.filter((i) => !mintermIndices.includes(i));
    }

    if (maxtermIndices.length === 0) {
        return "1";
    }

    const sorted = maxtermIndices.sort((a, b) => a - b);

    // Example: F = ΠM(0,2,4,7,...)
    return `ΠM(${sorted.join(",")})`;
}
