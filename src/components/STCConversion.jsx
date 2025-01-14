/* STCConversion.jsx */

import React, { useEffect, useState } from "react";
import { simplifyBooleanFunction } from "./kmap"; // K-map solver
import CircuitDiagram from "./CircuitDiagram"; // <-- Reuse your P5 circuit component

const STCConversion = ({
    diagramType, // e.g. "Mealy" or "Moore"
    flipFlopType, // e.g. "D", "T", or "JK"
    transitionTable, // array of { presentState, input, nextState, output }, etc.
    numInputs, // pass this down from the parent (if you need it)
}) => {
    // Data about our computed excitation. Example structure:
    //   {
    //     Q0: [ { presentStateCode, input, flipFlopInputValue }, ... ],
    //     Q1: [ { ... }, ... ],
    //     ...
    //   }
    // or for JK:
    //   {
    //     Q0: [ { presentStateCode, input, J, K }, ... ],
    //     Q1: ...
    //   }
    const [excitationTable, setExcitationTable] = useState(null);

    // We’ll track how many bits we need for each state,
    // the simplified equations, and whether we should display the circuit.
    const [numStateBits, setNumStateBits] = useState(0);
    const [simplifiedEquations, setSimplifiedEquations] = useState({});
    const [isGenerated, setIsGenerated] = useState(false);

    useEffect(() => {
        if (transitionTable.length === 0) return;

        /**
         * 1) ENCODE THE STATES
         *    We parse each row of the transition table to figure out the encoded bits for each state.
         */
        const states = {};
        transitionTable.forEach((row) => {
            // Example row.presentState might be "S1 (01)", nextState might be "S2 (10)"
            // So let's parse out the 2nd capturing group which is the binary code in parentheses
            const presentMatch = row.presentState.match(/S(\d+)\s\((\d+)\)/);
            const nextMatch = row.nextState.match(/S(\d+)\s\((\d+)\)/);

            if (presentMatch && nextMatch) {
                const [, presentStateId, presentStateCode] = presentMatch;
                const [, nextStateId, nextStateCode] = nextMatch;
                states[`S${presentStateId}`] = presentStateCode;
                states[`S${nextStateId}`] = nextStateCode;
            }
        });

        // We can figure out how many bits we actually need
        const maxBits = Math.max(
            ...Object.values(states).map((code) => code.length)
        );
        setNumStateBits(maxBits);

        /**
         * 2) BUILD THE EXCITATION TABLE
         *    For each bit in the state encoding, gather the needed values for each input combination.
         */
        const flipFlopInputs = {};
        for (let i = 0; i < maxBits; i++) {
            flipFlopInputs[`Q${i}`] = [];
        }

        transitionTable.forEach((row) => {
            // parse the current row
            const inputVal = row.input;
            const presentStateId = row.presentState.split(" ")[0]; // e.g. "S1"
            const nextStateId = row.nextState.split(" ")[0]; // e.g. "S2"

            // For safety, .padStart(...) to ensure we have uniform bits
            const presentCode = states[presentStateId].padStart(maxBits, "0");
            const nextCode = states[nextStateId].padStart(maxBits, "0");

            for (let i = 0; i < maxBits; i++) {
                const currentBit = presentCode[i];
                const nextBit = nextCode[i];

                // handle D or T
                if (flipFlopType === "D" || flipFlopType === "T") {
                    let ffInputVal = 0;
                    if (flipFlopType === "D") {
                        // D input = next bit
                        ffInputVal = nextBit === "1" ? 1 : 0;
                    } else if (flipFlopType === "T") {
                        // T is 1 if nextBit != currentBit
                        ffInputVal = currentBit === nextBit ? 0 : 1;
                    }
                    flipFlopInputs[`Q${i}`].push({
                        presentStateCode: presentCode,
                        input: inputVal,
                        flipFlopInputValue: ffInputVal,
                    });
                } else if (flipFlopType === "JK") {
                    let J, K;
                    // standard JK logic
                    if (currentBit === "0" && nextBit === "0") {
                        J = 0;
                        K = "X"; // hold
                    } else if (currentBit === "0" && nextBit === "1") {
                        J = 1;
                        K = "X"; // set
                    } else if (currentBit === "1" && nextBit === "0") {
                        J = "X";
                        K = 1; // reset
                    } else {
                        J = "X";
                        K = 0; // hold
                    }
                    flipFlopInputs[`Q${i}`].push({
                        presentStateCode: presentCode,
                        input: inputVal,
                        J,
                        K,
                    });
                }
            }
        });

        setExcitationTable(flipFlopInputs);

        /**
         * 3) SIMPLIFY THE EXCITATION EQUATIONS (OPTIONAL)
         *    Use your KMap or Quine–McCluskey solver to get minimal logic.
         */
        const eqns = {};

        Object.keys(flipFlopInputs).forEach((ffKey) => {
            const table = flipFlopInputs[ffKey];
            if (!table.length) return;

            if (flipFlopType === "D" || flipFlopType === "T") {
                // Build minterms for 1’s
                const minterms = [];
                // # of variables = (#bits in presentState) + (#bits in input).
                const numVariables =
                    table[0].presentStateCode.length + table[0].input.length;

                table.forEach((entry) => {
                    const vars = entry.presentStateCode + entry.input; // e.g. '0101'
                    if (entry.flipFlopInputValue === 1) {
                        const index = parseInt(vars, 2);
                        minterms.push(index);
                    }
                });

                eqns[ffKey] = simplifyBooleanFunction(minterms, numVariables);
            } else if (flipFlopType === "JK") {
                // We handle J and K separately
                const numVariables =
                    table[0].presentStateCode.length + table[0].input.length;

                // For J
                const mintermsJ = [];
                table.forEach((entry) => {
                    if (entry.J === 1) {
                        const index = parseInt(
                            entry.presentStateCode + entry.input,
                            2
                        );
                        mintermsJ.push(index);
                    }
                });
                eqns[`${ffKey}_J`] = simplifyBooleanFunction(
                    mintermsJ,
                    numVariables
                );

                // For K
                const mintermsK = [];
                table.forEach((entry) => {
                    if (entry.K === 1) {
                        const index = parseInt(
                            entry.presentStateCode + entry.input,
                            2
                        );
                        mintermsK.push(index);
                    }
                });
                eqns[`${ffKey}_K`] = simplifyBooleanFunction(
                    mintermsK,
                    numVariables
                );
            }
        });

        setSimplifiedEquations(eqns);

        // Once we finish all calculations, set isGenerated to true so we can render the circuit
        setIsGenerated(true);
    }, [transitionTable, flipFlopType, numInputs]);

    /**
     * Renders Excitation Table for the user to see
     * (so they can verify how the Flip-Flop inputs are determined).
     */
    const renderExcitationTable = () => {
        if (!excitationTable) return null;
        return Object.keys(excitationTable).map((ffKey) => {
            const rows = excitationTable[ffKey];
            return (
                <div key={ffKey} style={{ marginBottom: "1rem" }}>
                    <h3>Excitation Table for {ffKey}</h3>
                    <table
                        style={{
                            borderCollapse: "collapse",
                            border: "1px solid black",
                            width: "100%",
                        }}
                    >
                        <thead>
                            <tr>
                                <th style={{ border: "1px solid black" }}>
                                    Present State
                                </th>
                                <th style={{ border: "1px solid black" }}>
                                    Input
                                </th>
                                {flipFlopType === "D" ||
                                flipFlopType === "T" ? (
                                    <th style={{ border: "1px solid black" }}>
                                        {flipFlopType} Input
                                    </th>
                                ) : (
                                    <>
                                        <th
                                            style={{
                                                border: "1px solid black",
                                            }}
                                        >
                                            J
                                        </th>
                                        <th
                                            style={{
                                                border: "1px solid black",
                                            }}
                                        >
                                            K
                                        </th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((entry, idx) => (
                                <tr key={idx}>
                                    <td
                                        style={{
                                            border: "1px solid black",
                                            textAlign: "center",
                                        }}
                                    >
                                        {entry.presentStateCode}
                                    </td>
                                    <td
                                        style={{
                                            border: "1px solid black",
                                            textAlign: "center",
                                        }}
                                    >
                                        {entry.input}
                                    </td>
                                    {flipFlopType === "D" ||
                                    flipFlopType === "T" ? (
                                        <td
                                            style={{
                                                border: "1px solid black",
                                                textAlign: "center",
                                            }}
                                        >
                                            {entry.flipFlopInputValue}
                                        </td>
                                    ) : (
                                        <>
                                            <td
                                                style={{
                                                    border: "1px solid black",
                                                    textAlign: "center",
                                                }}
                                            >
                                                {entry.J}
                                            </td>
                                            <td
                                                style={{
                                                    border: "1px solid black",
                                                    textAlign: "center",
                                                }}
                                            >
                                                {entry.K}
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        });
    };

    /**
     * Finally, render the simplified equations if you wish:
     */
    // const renderSimplifiedEquations = () => {
    //     return Object.keys(simplifiedEquations).map((key) => (
    //         <p key={key}>
    //             <strong>{key} = </strong>
    //             {simplifiedEquations[key]}
    //         </p>
    //     ));
    // };

    return (
        <div>
            {/* 1) Display Excitation Table */}
            {renderExcitationTable()}

            {/* 2) Display (optional) simplified equations
            <h3>Simplified Excitation Equations</h3>
            {renderSimplifiedEquations()} */}

            <h2>Generated Circuit Diagram</h2>

            {/**
             * 3) Draw the circuit using <CircuitDiagram />
             *    The p5-based circuit code requires:
             *       - numInputs     (string)
             *       - flipFlopType  (string: 'D','T','JK')
             *       - numFlipFlops  (string)
             *       - fsmType       (string: 'Mealy','Moore')
             *       - isGenerated   (bool)
             *
             *    In your case, numFlipFlops is `numStateBits`, which is a number.
             *    The p5 code expects a string, so do `.toString()`.
             */}
            {isGenerated && (
                <CircuitDiagram
                    numInputs={numInputs ? numInputs.toString() : "1"}
                    flipFlopType={flipFlopType}
                    numFlipFlops={numStateBits.toString()}
                    fsmType={diagramType} // e.g. "Mealy"/"Moore"
                    isGenerated={true}
                />
            )}
        </div>
    );
};

export default STCConversion;
