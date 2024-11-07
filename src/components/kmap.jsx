// kmap.jsx

function simplifyBooleanFunction(minterms, numVariables) {
    // Extend variables to support more bits
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

    // Generate all possible minterms
    const allMinterms = [];
    for (let i = 0; i < Math.pow(2, numVariables); i++) {
        const binary = i.toString(2).padStart(numVariables, "0");
        allMinterms.push({
            binary,
            value: minterms.includes(i) ? 1 : 0,
            used: false,
        });
    }

    // Group minterms by the number of ones
    let groups = {};
    allMinterms.forEach((minterm) => {
        if (minterm.value === 1) {
            const ones = minterm.binary
                .split("")
                .filter((b) => b === "1").length;
            if (!groups[ones]) groups[ones] = [];
            groups[ones].push(minterm);
        }
    });

    const mergedGroups = [];
    let canCombine = true;

    while (canCombine) {
        let canCombineThisIteration = false; // Use a local variable
        const newGroups = {};

        const groupKeys = Object.keys(groups)
            .map((key) => parseInt(key))
            .sort((a, b) => a - b);

        for (let i = 0; i < groupKeys.length - 1; i++) {
            const groupA = groups[groupKeys[i]];
            const groupB = groups[groupKeys[i + 1]];

            for (let a = 0; a < groupA.length; a++) {
                const mintermA = groupA[a];

                for (let b = 0; b < groupB.length; b++) {
                    const mintermB = groupB[b];

                    const diff = diffBits(mintermA.binary, mintermB.binary);
                    if (diff.count === 1) {
                        canCombineThisIteration = true;
                        const combinedBinary = replaceBit(
                            mintermA.binary,
                            diff.index,
                            "-"
                        );
                        const key = combinedBinary;

                        if (!newGroups[key]) {
                            newGroups[key] = {
                                binary: combinedBinary,
                                minterms: [
                                    ...(mintermA.minterms || [
                                        parseInt(mintermA.binary, 2),
                                    ]),
                                    ...(mintermB.minterms || [
                                        parseInt(mintermB.binary, 2),
                                    ]),
                                ],
                                used: false,
                            };
                        }
                        mintermA.used = true;
                        mintermB.used = true;
                    }
                }
            }
        }

        // Add unused minterms to mergedGroups
        Object.values(groups).forEach((group) => {
            for (const minterm of group) {
                if (!minterm.used && minterm.value === 1) {
                    mergedGroups.push({
                        binary: minterm.binary,
                        minterms: [parseInt(minterm.binary, 2)],
                    });
                }
            }
        });

        // Prepare groups for next iteration
        groups = {};
        for (const item of Object.values(newGroups)) {
            const ones = item.binary.split("").filter((b) => b === "1").length;
            if (!groups[ones]) groups[ones] = [];
            groups[ones].push(item);
        }

        canCombine = canCombineThisIteration; // Update canCombine at the end of the loop
    }

    // Remove duplicate terms from mergedGroups
    const uniqueGroups = mergedGroups.filter(
        (group, index, self) =>
            index ===
            self.findIndex(
                (g) =>
                    g.binary === group.binary &&
                    g.minterms.toString() === group.minterms.toString()
            )
    );

    // Now, convert uniqueGroups to expressions
    const expressions = uniqueGroups.map((group) => {
        return binaryToExpression(group.binary, variables);
    });

    // Combine expressions using OR
    const finalExpression = expressions.join(" + ") || "0";
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

export { simplifyBooleanFunction };
