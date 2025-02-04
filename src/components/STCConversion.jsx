/* STCConversion.jsx */

import React, { useEffect, useState } from "react";
import {
    simplifyBooleanFunction,
    getCanonicalSumOfMinterms,
    getCanonicalProductOfMaxterms,
} from "./kmap"; // K-map solver
import CircuitDiagram from "./CircuitDiagram"; // <-- Reuse your P5 circuit component
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";

const STCConversion = ({
    diagramType, // e.g. "Mealy" or "Moore"
    flipFlopType, // e.g. "D", "T", or "JK"
    transitionTable, // array of { presentState, input, nextState, output }, etc.
    numInputs, // pass this down from the parent (if you need it)
}) => {
    // We'll track how many bits we need for each state,
    // the simplified equations, and whether we should display the circuit.
    const [numStateBits, setNumStateBits] = useState(0);
    const [simplifiedEquations, setSimplifiedEquations] = useState({});
    const [isGenerated, setIsGenerated] = useState(false);
    const [mergedExcitationTable, setMergedExcitationTable] = useState(null);

    // Add new states for excitation table
    const [excitationAnswers, setExcitationAnswers] = useState({});
    const [excitationValidation, setExcitationValidation] = useState({});
    const [isExcitationComplete, setIsExcitationComplete] = useState(false);
    const [excitationTooltip, setExcitationTooltip] = useState({});
    const [excitationBlankCells, setExcitationBlankCells] = useState(new Set());
    const [focusedExcitationCell, setFocusedExcitationCell] = useState(null);

    // Add state for info tooltip
    const [showExcitationInfo, setShowExcitationInfo] = useState(false);

    useEffect(() => {
        if (transitionTable.length === 0) return;

        /**
         * 1) ENCODE THE STATES
         *    We parse each row of the transition table to figure out the encoded bits for each state.
         */
        const states = {};
        const validIndices = new Set();
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

        const mergedTable = []; // For the combined excitation table

        transitionTable.forEach((row) => {
            // parse the current row
            const inputVal = row.input;
            const presentStateId = row.presentState.split(" ")[0]; // e.g. "S1"
            const nextStateId = row.nextState.split(" ")[0]; // e.g. "S2"

            // For safety, .padStart(...) to ensure we have uniform bits
            const presentCode = states[presentStateId].padStart(maxBits, "0");
            const nextCode = states[nextStateId].padStart(maxBits, "0");

            // For the solver: mark this combination of (presentCode + inputVal) as "valid"
            const varsForThisRow = presentCode + inputVal;
            const decimalIndex = parseInt(varsForThisRow, 2);
            validIndices.add(decimalIndex);

            const rowExcitations = [];

            for (let i = 0; i < maxBits; i++) {
                const currentBit = presentCode[maxBits - 1 - i];
                const nextBit = nextCode[maxBits - 1 - i];
                let ffInputVal;

                if (flipFlopType === "D") {
                    ffInputVal = nextBit === "1" ? 1 : 0;
                    flipFlopInputs[`Q${i}`].push({
                        presentStateCode: presentCode,
                        input: inputVal,
                        flipFlopInputValue: ffInputVal,
                    });
                    // We'll store e.g. "1" or "0"
                    rowExcitations.push(ffInputVal.toString());
                } else if (flipFlopType === "T") {
                    ffInputVal = currentBit === nextBit ? 0 : 1;
                    flipFlopInputs[`Q${i}`].push({
                        presentStateCode: presentCode,
                        input: inputVal,
                        flipFlopInputValue: ffInputVal,
                    });
                    rowExcitations.push(ffInputVal.toString());
                } else if (flipFlopType === "JK") {
                    // J-K calculation
                    let J, K;
                    if (currentBit === "0" && nextBit === "0") {
                        J = 0;
                        K = "X";
                    } else if (currentBit === "0" && nextBit === "1") {
                        J = 1;
                        K = "X";
                    } else if (currentBit === "1" && nextBit === "0") {
                        J = "X";
                        K = 1;
                    } else {
                        J = "X";
                        K = 0;
                    }
                    flipFlopInputs[`Q${i}`].push({
                        presentStateCode: presentCode,
                        input: inputVal,
                        J,
                        K,
                    });
                    rowExcitations.push(`${J}${K}`);
                }
            }

            // Now that we have all bit excitations for this row,
            // build a single string for that row's "D1D0" or "T1T0" or "J1K1 J0K0".
            // Remember rowExcitations currently holds them in LSB->MSB order,
            // so we can reverse if you need MSB->LSB, or just keep consistent:
            const reversed = [...rowExcitations].reverse();
            const excitationString =
                flipFlopType === "JK"
                    ? // for JK, you might want a space to separate pairs
                      reversed.join(" ")
                    : reversed.join("");

            // Finally push one row into mergedTable
            mergedTable.push({
                presentState: presentCode,
                input: inputVal,
                nextState: nextCode,
                excitation: excitationString,
                output: row.output,
            });
        });

        setMergedExcitationTable(mergedTable);

        // 3) BUILD MINTERM ARRAYS & PRODUCE EQUATIONS
        //    For D/T: we have a single output function for each Q-bit
        //    For JK: we have two (J and K) for each Q-bit
        const eqns = {};

        Object.keys(flipFlopInputs).forEach((ffKey) => {
            const table = flipFlopInputs[ffKey];
            if (!table.length) return;

            // # of variables = (#bits in presentState) + (#bits in input).
            const numVariables =
                table[0].presentStateCode.length + table[0].input.length;

            if (flipFlopType === "D" || flipFlopType === "T") {
                // Collect minterm indices
                const minterms = [];
                table.forEach((entry) => {
                    const vars = entry.presentStateCode + entry.input; // e.g. '0101'
                    if (entry.flipFlopInputValue === 1) {
                        const index = parseInt(vars, 2);
                        minterms.push(index);
                    }
                });

                // Build object with all forms
                eqns[ffKey] = {
                    mintermIndices: minterms,
                    minimalSoP: simplifyBooleanFunction(
                        minterms,
                        numVariables,
                        validIndices
                    ),
                    canonicalSoM: getCanonicalSumOfMinterms(
                        minterms,
                        numVariables
                    ),
                    canonicalPoM: getCanonicalProductOfMaxterms(
                        minterms,
                        numVariables
                    ),
                };
            } else if (flipFlopType === "JK") {
                // We'll do J and K separately
                const mintermsJ = [];
                const mintermsK = [];

                table.forEach((entry) => {
                    if (entry.J === 1) {
                        const index = parseInt(
                            entry.presentStateCode + entry.input,
                            2
                        );
                        mintermsJ.push(index);
                    }
                    if (entry.K === 1) {
                        const index = parseInt(
                            entry.presentStateCode + entry.input,
                            2
                        );
                        mintermsK.push(index);
                    }
                });

                eqns[`${ffKey}_J`] = {
                    mintermIndices: mintermsJ,
                    minimalSoP: simplifyBooleanFunction(
                        mintermsJ,
                        numVariables,
                        validIndices
                    ),
                    canonicalSoM: getCanonicalSumOfMinterms(
                        mintermsJ,
                        numVariables
                    ),
                    canonicalPoM: getCanonicalProductOfMaxterms(
                        mintermsJ,
                        numVariables
                    ),
                };
                eqns[`${ffKey}_K`] = {
                    mintermIndices: mintermsK,
                    minimalSoP: simplifyBooleanFunction(
                        mintermsK,
                        numVariables,
                        validIndices
                    ),
                    canonicalSoM: getCanonicalSumOfMinterms(
                        mintermsK,
                        numVariables
                    ),
                    canonicalPoM: getCanonicalProductOfMaxterms(
                        mintermsK,
                        numVariables
                    ),
                };
            }
        });

        setSimplifiedEquations(eqns);
        setIsGenerated(true);
    }, [transitionTable, flipFlopType, numInputs]);

    // Update validation function for excitation table
    const validateExcitationInput = (value, column) => {
        if (value === "") return true;

        switch (column) {
            case "input":
            case "output":
            case "nextState":
                // Allow single (0,1) or double (00,01,10,11) binary digits
                return /^[01]$|^[01]{2}$/.test(value);

            case "excitation":
                if (flipFlopType === "JK") {
                    // Always return true to allow free typing for JK
                    return true;
                } else if (flipFlopType === "T" || flipFlopType === "D") {
                    // For T and D flip-flops, allow single or double binary digits
                    return /^[01]$|^[01]{2}$/.test(value);
                }
                return false;

            default:
                return false;
        }
    };

    // Update handler for excitation cell changes
    const handleExcitationCellChange = (rowIndex, column, value) => {
        const key = `${rowIndex}-${column}`;

        const capitalizedValue =
            column === "excitation" ? value.toUpperCase() : value;

        if (validateExcitationInput(value, column)) {
            setExcitationAnswers((prev) => ({
                ...prev,
                [key]: capitalizedValue,
            }));
        }

        // Always set a tooltip message
        let message;
        switch (column) {
            case "input":
            case "output":
            case "nextState":
                message = "Enter 0, 1, 00, 01, 10, or 11";
                break;
            case "excitation":
                if (flipFlopType === "JK") {
                    message =
                        "Format should be: XY XY where X,Y can be 0, 1, or X (e.g., 0X 1X)";
                } else {
                    message = `Enter 0, 1, 00, 01, 10, or 11 for ${flipFlopType} flip-flop`;
                }
                break;
            default:
                message = "Invalid input";
        }
        setExcitationTooltip((prev) => ({
            ...prev,
            [key]: message,
        }));
    };

    // Add excitation focus handler
    const handleExcitationFocus = (rowIndex, column) => {
        const key = `${rowIndex}-${column}`;
        setFocusedExcitationCell(key);

        // Set initial tooltip message
        let message;
        switch (column) {
            case "input":
            case "output":
            case "nextState":
                message = "Enter 0, 1, 00, 01, 10, or 11";
                break;
            case "excitation":
                if (flipFlopType === "JK") {
                    message =
                        "Format should be: XY XY where X,Y can be 0, 1, or X (e.g., 0X 1X)";
                } else {
                    message = `Enter 0, 1, 00, 01, 10, or 11 for ${flipFlopType} flip-flop`;
                }
                break;
            default:
                message = "Invalid input";
        }
        setExcitationTooltip((prev) => ({
            ...prev,
            [key]: message,
        }));
    };

    // Add confirm handler for excitation table
    const handleExcitationConfirm = () => {
        const newValidation = {};
        let allCorrect = true;

        excitationBlankCells.forEach((key) => {
            const [rowIndex, column] = key.split("-");
            const correctValue = mergedExcitationTable[rowIndex][column];
            const userAnswer = excitationAnswers[key];

            const isCorrect = userAnswer && userAnswer === correctValue;
            newValidation[key] = isCorrect;

            if (!isCorrect) {
                allCorrect = false;
            }
        });

        setExcitationValidation(newValidation);
        setIsExcitationComplete(allCorrect);
    };

    // Update useEffect to initialize blank cells for excitation table
    useEffect(() => {
        if (mergedExcitationTable) {
            const newBlankCells = new Set();
            mergedExcitationTable.forEach((_, rowIndex) => {
                let blanksInRow = 0;
                const columns = [
                    "input",
                    "nextState",
                    "excitation",
                    "output",
                ].sort(() => Math.random() - 0.5);

                for (const column of columns) {
                    if (blanksInRow >= 2) break;
                    if (Math.random() < 0.3) {
                        newBlankCells.add(`${rowIndex}-${column}`);
                        blanksInRow++;
                    }
                }
            });
            setExcitationBlankCells(newBlankCells);
        }
    }, [mergedExcitationTable]);

    // Update renderExcitationCell to adjust maxLength based on column and flip-flop type
    const renderExcitationCell = (row, rowIndex, column, value) => {
        const key = `${rowIndex}-${column}`;
        const isBlank = excitationBlankCells.has(key);
        const isCorrect = excitationValidation[key];

        if (!isBlank) return value;

        let maxLength;
        switch (column) {
            case "input":
            case "output":
                maxLength = 2;
                break;
            case "nextState":
                maxLength = 8; // For format "S# (###)"
                break;
            case "excitation":
                maxLength = flipFlopType === "JK" ? 7 : 2; // JK: "XX XX", D/T: "##"
                break;
            default:
                maxLength = 1;
        }

        return (
            <div className="input-container">
                <input
                    type="text"
                    maxLength={maxLength}
                    value={excitationAnswers[key] || ""}
                    onChange={(e) =>
                        handleExcitationCellChange(
                            rowIndex,
                            column,
                            e.target.value
                        )
                    }
                    onFocus={() => handleExcitationFocus(rowIndex, column)}
                    onBlur={() => setFocusedExcitationCell(null)}
                    className={`table-input ${
                        excitationValidation[key]
                            ? "correct"
                            : excitationValidation.hasOwnProperty(key)
                            ? "incorrect"
                            : ""
                    }`}
                    disabled={isCorrect}
                />
                {focusedExcitationCell === key && (
                    <div className="input-tooltip">
                        {excitationTooltip[key]}
                    </div>
                )}
            </div>
        );
    };

    /**
     * Renders Excitation Table for the user to see
     * (so they can verify how the Flip-Flop inputs are determined).
     */
    const renderExcitationTable = () => {
        if (!mergedExcitationTable) return null;

        const bitIndices = Array.from(
            { length: numStateBits },
            (_, i) => numStateBits - 1 - i
        );

        // State bits, e.g. Q1Q0
        const presentStateBits = bitIndices.map((i) => `Q${i}`).join("");
        const nextStateBits = bitIndices.map((i) => `Q${i}*`).join("");

        // Input bits, e.g. X0 or X1X0 for multiple inputs
        const inputBitIndices = Array.from(
            { length: numInputs },
            (_, i) => numInputs - 1 - i
        );
        const inputBits = inputBitIndices.map((i) => `X${i}`).join("");

        // Final bracketed headers
        const presentStateHeader = `Present State (${presentStateBits})`;
        const nextStateHeader = `Next State (${nextStateBits})`;
        const inputHeader = `Input (${inputBits || "X"})`;

        // Build the flip-flop "excitation" header
        let excitationHeader;
        if (flipFlopType === "D") {
            excitationHeader = bitIndices.map((i) => `D${i}`).join("");
        } else if (flipFlopType === "T") {
            excitationHeader = bitIndices.map((i) => `T${i}`).join("");
        } else if (flipFlopType === "JK") {
            excitationHeader = bitIndices.map((i) => `J${i}K${i}`).join(" ");
        }

        return (
            <div className="excitation-table-container">
                <h3>Combined Excitation Table</h3>
                <button
                    className="info-button"
                    onClick={() => setShowExcitationInfo(!showExcitationInfo)}
                    aria-label="Excitation Table Information"
                >
                    <FontAwesomeIcon icon={faCircleInfo} />
                </button>
                {showExcitationInfo && (
                    <div className="info-tooltip">
                        <h3>Excitation Table Information</h3>
                        <p>
                            This table shows the flip-flop input calculations:
                        </p>
                        <ul>
                            <li>
                                Present State: Binary encoding of current state
                                ({numStateBits} bits)
                            </li>
                            <li>
                                Next State: Binary encoding of next state (
                                {numStateBits} bits)
                            </li>
                            {flipFlopType === "JK" ? (
                                <li>
                                    JK Inputs: Format is "J1K1 J0K0" where each
                                    JK pair can be 0X, X0, 1X, or X1
                                </li>
                            ) : (
                                <li>
                                    {flipFlopType} Inputs: Binary values for
                                    each flip-flop
                                </li>
                            )}
                        </ul>
                        <p>Number of state bits needed: {numStateBits}</p>
                        <p>
                            State variables:{" "}
                            {Array.from(
                                { length: numStateBits },
                                (_, i) => `Q${numStateBits - 1 - i}`
                            ).join(", ")}
                        </p>
                    </div>
                )}
                <table className="excitation-table">
                    <thead>
                        <tr>
                            <th>{presentStateHeader}</th>
                            <th>{inputHeader}</th>
                            <th>{nextStateHeader}</th>
                            <th>{excitationHeader}</th>
                            <th>Output (Z)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mergedExcitationTable.map((row, idx) => (
                            <tr key={idx}>
                                <td>{row.presentState}</td>
                                <td>
                                    {renderExcitationCell(
                                        row,
                                        idx,
                                        "input",
                                        row.input
                                    )}
                                </td>
                                <td>
                                    {renderExcitationCell(
                                        row,
                                        idx,
                                        "nextState",
                                        row.nextState
                                    )}
                                </td>
                                <td>
                                    {renderExcitationCell(
                                        row,
                                        idx,
                                        "excitation",
                                        row.excitation
                                    )}
                                </td>
                                <td>
                                    {renderExcitationCell(
                                        row,
                                        idx,
                                        "output",
                                        row.output
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="convert-button-container">
                    {isExcitationComplete ? (
                        <button className="convert-button">Next</button>
                    ) : (
                        <button
                            onClick={handleExcitationConfirm}
                            className="confirm-button purple-button"
                        >
                            Confirm
                        </button>
                    )}
                </div>
            </div>
        );
    };

    /**
     * Render the minterm / maxterm / minimal SoP for each equation
     */
    const renderEquations = () => {
        return (
            <div className="equations-container">
                {Object.keys(simplifiedEquations).map((key) => {
                    const eqn = simplifiedEquations[key];
                    const variableName = key.includes("_")
                        ? key.replace("_", "") // For JK flip-flops
                        : key;

                    return (
                        <div key={key} className="equation-block">
                            <h4>{variableName} Equation</h4>
                            <div className="equation-forms">
                                <div className="equation-form">
                                    <span className="equation-label">
                                        Canonical Form (Σm):
                                    </span>
                                    <span className="equation-value">
                                        {variableName} = Σm(
                                        {eqn.mintermIndices.join(", ")})
                                    </span>
                                </div>
                                <div className="equation-form">
                                    <span className="equation-label">
                                        Sum of Minterms:
                                    </span>
                                    <span className="equation-value">
                                        {eqn.canonicalSoM}
                                    </span>
                                </div>
                                <div className="equation-form">
                                    <span className="equation-label">
                                        Product of Maxterms:
                                    </span>
                                    <span className="equation-value">
                                        {eqn.canonicalPoM}
                                    </span>
                                </div>
                                <div className="equation-form">
                                    <span className="equation-label">
                                        Simplified Expression:
                                    </span>
                                    <span className="equation-value">
                                        {eqn.minimalSoP}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Add click-outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                !event.target.closest(".info-button") &&
                !event.target.closest(".info-tooltip")
            ) {
                setShowExcitationInfo(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div>
            {/* 1) Display Excitation Table */}
            {renderExcitationTable()}

            {/* 2) Display Minterm/Maxterm equations and minimal SoP */}
            <h3>Minterm / Maxterm Equations</h3>
            {renderEquations()}

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
