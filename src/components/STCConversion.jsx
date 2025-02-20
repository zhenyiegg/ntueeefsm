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

    // Add new state to track if equations should be shown
    const [showEquations, setShowEquations] = useState(false);

    // Add new states for equation validation
    const [equationAnswers, setEquationAnswers] = useState({});
    const [equationValidation, setEquationValidation] = useState({});
    const [isEquationsComplete, setIsEquationsComplete] = useState(false);
    const [equationTooltip, setEquationTooltip] = useState({});
    const [focusedEquationCell, setFocusedEquationCell] = useState(null);

    // Add new state for equations info
    const [showEquationsInfo, setShowEquationsInfo] = useState(false);

    // Add new state at the top with other state variables
    const [showCircuit, setShowCircuit] = useState(false);

    // Add new state variables at the top with other states
    const [showHints, setShowHints] = useState({});
    const [hintAttempts, setHintAttempts] = useState({});

    // Add new state for hint tooltip
    const [activeHint, setActiveHint] = useState(null);

    // Add new state for tracking give up status
    const [hasGivenUp, setHasGivenUp] = useState({
        transitionTable: false,
        excitationTable: false,
        equations: false,
    });

    // Add this helper function near the top of your component
    const measureText = (text, font) => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        context.font = font;
        return context.measureText(text).width;
    };

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

    // Add useEffect to reset states when transitionTable changes
    useEffect(() => {
        if (transitionTable.length > 0) {
            setHasGivenUp({
                transitionTable: false,
                excitationTable: false,
                equations: false,
            });
            setExcitationAnswers({});
            setExcitationValidation({});
            setIsExcitationComplete(false);
            setEquationAnswers({});
            setEquationValidation({});
            setIsEquationsComplete(false);
        }
    }, [transitionTable]);

    // Update validation function for excitation table
    const validateExcitationInput = (value, column) => {
        if (value === "") return true;

        switch (column) {
            case "input":
            case "output":
                // Keep these as single or double binary digits
                return /^[01]$|^[01]{2}$/.test(value);

            case "nextState":
                // Allow single, double, or triple binary digits
                return /^[01]$|^[01]{2}$|^[01]{3}$/.test(value);

            case "excitation":
                if (flipFlopType === "JK") {
                    // Always return true to allow free typing for JK
                    return true;
                } else if (flipFlopType === "T" || flipFlopType === "D") {
                    // Allow single, double, or triple binary digits for excitation
                    return /^[01]$|^[01]{2}$|^[01]{3}$/.test(value);
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

        // Update tooltip message
        let message;
        switch (column) {
            case "input":
            case "output":
                message = "Enter 0, 1, 00, 01, 10, or 11";
                break;
            case "nextState":
                message = "Enter 0, 1, 00, 01, 10, 11, 000, 001, ..., or 111";
                break;
            case "excitation":
                if (flipFlopType === "JK") {
                    message =
                        "Format should be: XY XY where X,Y can be 0, 1, or X (e.g., 0X 1X)";
                } else {
                    message = `Enter 0, 1, 00, 01, 10, 11, 000, 001, ..., or 111 for ${flipFlopType} flip-flop`;
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

    // Update handleExcitationFocus to include updated tooltip messages
    const handleExcitationFocus = (rowIndex, column) => {
        const key = `${rowIndex}-${column}`;
        setFocusedExcitationCell(key);

        let message;
        switch (column) {
            case "input":
            case "output":
                message = "Enter 0, 1, 00, 01, 10, or 11";
                break;
            case "nextState":
                message = "Enter 0, 1, 00, 01, 10, 11, 000, 001, ..., or 111";
                break;
            case "excitation":
                if (flipFlopType === "JK") {
                    message =
                        "Format should be: XY XY where X,Y can be 0, 1, or X (e.g., 0X 1X)";
                } else {
                    message = `Enter 0, 1, 00, 01, 10, 11, 000, 001, ..., or 111 for ${flipFlopType} flip-flop`;
                }
                break;
            default:
                message = "Enter the correct value";
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
        const isGivenUp = hasGivenUp.excitationTable;
        const isIncorrect =
            excitationValidation.hasOwnProperty(key) && !isCorrect;

        if (!isBlank) return value;

        let maxLength;
        switch (column) {
            case "input":
            case "output":
                maxLength = 2;
                break;
            case "nextState":
                maxLength = 3;
                break;
            case "excitation":
                maxLength = flipFlopType === "JK" ? 7 : 3; // JK: "XX XX", D/T: "##"
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
                    className={`table-input ${isCorrect ? "correct" : ""} ${
                        isIncorrect ? "incorrect" : ""
                    } ${isGivenUp ? "given-up" : ""}`}
                    disabled={isCorrect || isGivenUp}
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
                <div className="button-container">
                    <button
                        className="info-button"
                        onClick={() =>
                            setShowExcitationInfo(!showExcitationInfo)
                        }
                    >
                        <FontAwesomeIcon icon={faCircleInfo} />
                    </button>
                    <button
                        className="give-up-button"
                        onClick={() => handleGiveUp("excitationTable")}
                        disabled={hasGivenUp.excitationTable}
                    >
                        Give Up
                    </button>
                </div>
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
                        <button
                            className="convert-button purple-button"
                            onClick={() => setShowEquations(true)}
                        >
                            Next
                        </button>
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

    // Update validation for equation inputs to handle different field types
    const validateEquationInput = (value, field) => {
        if (value === "") return true;

        switch (field) {
            case "minterms":
            case "maxterms":
                // Allow numbers, commas, and spaces for minterm/maxterm indices
                return /^[0-9,\s]*$/.test(value);
            case "sop":
                // Allow letters (A-Z), numbers, operators (+), prime ('), and spaces
                return /^[A-Z0-9'+\s]*$/.test(value);
            default:
                return false;
        }
    };

    // Update handleEquationCellChange to include updated tooltip messages
    const handleEquationCellChange = (equationKey, field, value) => {
        const key = `${equationKey}-${field}`;

        // Convert to uppercase for SOP expressions
        const processedValue = field === "sop" ? value.toUpperCase() : value;

        if (validateEquationInput(processedValue, field)) {
            setEquationAnswers((prev) => ({
                ...prev,
                [key]: processedValue,
            }));
        }

        // Set appropriate tooltip message based on field type
        let message;
        switch (field) {
            case "minterms":
                message =
                    "Enter minterm indices separated by commas (e.g., 0, 1, 4, 5)";
                break;
            case "maxterms":
                message =
                    "Enter maxterm indices separated by commas (e.g., 2, 3, 6, 7)";
                break;
            case "sop":
                message =
                    "Enter simplified boolean expression using Q (state) and X (input) variables (e.g., Q1'Q0X0 + Q1X1')";
                break;
            default:
                message = "Enter the correct value";
        }

        setEquationTooltip((prev) => ({
            ...prev,
            [key]: message,
        }));
    };

    // Update handleEquationFocus to use the same updated messages
    const handleEquationFocus = (equationKey, field) => {
        const key = `${equationKey}-${field}`;
        setFocusedEquationCell(key);

        let message;
        switch (field) {
            case "minterms":
                message =
                    "Enter minterm indices separated by commas (e.g., 0, 1, 4, 5)";
                break;
            case "maxterms":
                message =
                    "Enter maxterm indices separated by commas (e.g., 2, 3, 6, 7)";
                break;
            case "sop":
                message =
                    "Enter simplified boolean expression using Q (state) and X (input) variables (e.g., Q1'Q0X0 + Q1X1')";
                break;
            default:
                message = "Enter the correct value";
        }

        setEquationTooltip((prev) => ({
            ...prev,
            [key]: message,
        }));
    };

    // Add helper function to get hint or answer
    const getHintOrAnswer = (key, equation, isAnswer = false) => {
        const [baseKey, field] = key.split("-");

        if (field === "minterms") {
            if (isAnswer) {
                return `Answer: ${equation.mintermIndices.join(", ")}`;
            }
            return `Hint: These are the input combinations where the output is 1. Look for ${equation.mintermIndices.length} indices.`;
        } else if (field === "maxterms") {
            if (isAnswer) {
                const maxterms = equation.canonicalPoM.match(/\((.*?)\)/)[1];
                return `Answer: ${maxterms}`;
            }
            return "Hint: Maxterms are the complement of minterms. Look for input combinations where the output is 0.";
        } else if (field === "sop") {
            if (isAnswer) {
                return `Answer: ${equation.minimalSoP}`;
            }
            return "Hint: This is the simplified boolean expression. Look for patterns in the minterms.";
        }
        return "";
    };

    // Update handleEquationConfirm to track incorrect attempts
    const handleEquationConfirm = () => {
        const newValidation = {};
        const newHints = { ...showHints };
        const newAttempts = { ...hintAttempts };
        let allCorrect = true;

        Object.keys(simplifiedEquations).forEach((key) => {
            const eqn = simplifiedEquations[key];

            // Check minterms
            const mintermKey = `${key}-minterms`;
            const userMinterms = equationAnswers[mintermKey] || "";
            const correctMinterms = eqn.mintermIndices.join(", ");
            const areMintermsCorrect =
                userMinterms.replace(/\s/g, "") ===
                correctMinterms.replace(/\s/g, "");
            newValidation[mintermKey] = areMintermsCorrect;

            if (!areMintermsCorrect && userMinterms !== "") {
                newHints[mintermKey] = true;
                newAttempts[mintermKey] = (newAttempts[mintermKey] || 0) + 1;
            }

            // Check maxterms
            const maxtermKey = `${key}-maxterms`;
            const userMaxterms = equationAnswers[maxtermKey] || "";
            const correctMaxterms = eqn.canonicalPoM.match(/\((.*?)\)/)[1];
            const areMaxtermsCorrect =
                userMaxterms.replace(/\s/g, "") ===
                correctMaxterms.replace(/\s/g, "");
            newValidation[maxtermKey] = areMaxtermsCorrect;

            if (!areMaxtermsCorrect && userMaxterms !== "") {
                newHints[maxtermKey] = true;
                newAttempts[maxtermKey] = (newAttempts[maxtermKey] || 0) + 1;
            }

            // Check simplified expression
            const sopKey = `${key}-sop`;
            const userSop = equationAnswers[sopKey] || "";
            const correctSop = eqn.minimalSoP;
            const isSopCorrect =
                userSop.replace(/\s/g, "") === correctSop.replace(/\s/g, "");
            newValidation[sopKey] = isSopCorrect;

            if (!isSopCorrect && userSop !== "") {
                newHints[sopKey] = true;
                newAttempts[sopKey] = (newAttempts[sopKey] || 0) + 1;
            }

            if (!areMintermsCorrect || !areMaxtermsCorrect || !isSopCorrect) {
                allCorrect = false;
            }
        });

        setEquationValidation(newValidation);
        setShowHints(newHints);
        setHintAttempts(newAttempts);
        setIsEquationsComplete(allCorrect);
    };

    // Add helper function to get flip-flop variable names
    const getFlipFlopName = (ffIndex, ffType) => {
        switch (ffType) {
            case "D":
                return `D${ffIndex}`;
            case "T":
                return `T${ffIndex}`;
            case "JK":
                // For JK, we return both J and K names since they're handled separately
                return `${ffIndex}`; // The J/K prefix is already in the key (e.g., Q0_J, Q0_K)
            default:
                return `Q${ffIndex}`;
        }
    };

    // Update the renderEquationInput function to use correct variable names
    const renderEquationInput = (key, field, variableName, equation) => {
        const fullKey = `${key}-${field}`;
        const isGivenUp = hasGivenUp.equations;
        const isCorrect = equationValidation[fullKey];
        const isIncorrect =
            equationValidation.hasOwnProperty(fullKey) && !isCorrect;

        // Calculate width based on input value
        const value = equationAnswers[fullKey] || "";
        const minWidth = 100;
        const padding = 16;
        const width = Math.max(
            minWidth,
            measureText(value, "1rem monospace") + padding
        );

        // Extract the flip-flop index from the key (e.g., "Q0" -> "0")
        const ffIndex = key.match(/\d+/)[0];

        // Get the proper flip-flop name
        let displayName;
        if (key.includes("_J")) {
            displayName = `J${ffIndex}`;
        } else if (key.includes("_K")) {
            displayName = `K${ffIndex}`;
        } else {
            displayName = getFlipFlopName(ffIndex, flipFlopType);
        }

        return (
            <div className="equation-form">
                <span className="equation-label">
                    {field === "minterms"
                        ? "Sum of Minterms (Σm):"
                        : field === "maxterms"
                        ? "Product of Maxterms:"
                        : "Simplified Expression:"}
                </span>
                <span className="equation-value">
                    {displayName} ={" "}
                    {field === "minterms"
                        ? "Σm("
                        : field === "maxterms"
                        ? "∏M("
                        : ""}
                    <div className="input-container">
                        <input
                            type="text"
                            className={`equation-input ${
                                isCorrect ? "correct" : ""
                            } ${isIncorrect ? "incorrect" : ""} ${
                                isGivenUp ? "given-up" : ""
                            }`}
                            value={value}
                            style={{ width: `${width}px` }}
                            onChange={(e) =>
                                handleEquationCellChange(
                                    key,
                                    field,
                                    e.target.value
                                )
                            }
                            onFocus={() => handleEquationFocus(key, field)}
                            onBlur={() => setFocusedEquationCell(null)}
                            disabled={isCorrect || isGivenUp}
                        />
                        {focusedEquationCell === fullKey && (
                            <div className="input-tooltip">
                                {equationTooltip[fullKey]}
                            </div>
                        )}
                    </div>
                    {field === "minterms" || field === "maxterms" ? ")" : ""}
                </span>
            </div>
        );
    };

    // Update the equation block rendering to use the new renderEquationInput
    const renderEquations = () => {
        return (
            <div className="equations-container">
                <h3>Minterm / Maxterm Equations</h3>
                <div className="button-container">
                    <button
                        className="info-button"
                        onClick={() => setShowEquationsInfo(!showEquationsInfo)}
                    >
                        <FontAwesomeIcon icon={faCircleInfo} />
                    </button>
                    <button
                        className="give-up-button"
                        onClick={() => handleGiveUp("equations")}
                        disabled={hasGivenUp.equations}
                    >
                        Give Up
                    </button>
                </div>
                {showEquationsInfo && (
                    <div className="info-tooltip">
                        <h3>Equation Information</h3>
                        <p>Fill in the minterm indices for each equation:</p>
                        <ul>
                            <li>
                                Use the Sum of Minterms expression to identify
                                the indices
                            </li>
                            <li>
                                Separate multiple indices with commas (e.g., "0,
                                1, 4, 5")
                            </li>
                            <li>
                                The indices should match the terms in the
                                canonical sum
                            </li>
                        </ul>
                        <p>
                            Example: If sum of minterms is "x̄ȳz + x̄yz̄", the
                            indices would be "1, 2"
                        </p>
                    </div>
                )}
                <div className="equations-list">
                    {Object.keys(simplifiedEquations).map((key) => {
                        const variableName = key.includes("_")
                            ? key.replace("_", "")
                            : key;
                        const eqn = simplifiedEquations[key];

                        return (
                            <div key={key} className="equation-block">
                                <h4>
                                    {key.includes("_")
                                        ? `${getFlipFlopName(
                                              key.match(/\d+/)[0],
                                              flipFlopType
                                          )}${
                                              key.includes("_J") ? "J" : "K"
                                          } Equation`
                                        : `${getFlipFlopName(
                                              key.match(/\d+/)[0],
                                              flipFlopType
                                          )} Equation`}
                                </h4>
                                <div className="equation-forms">
                                    {renderEquationInput(
                                        key,
                                        "minterms",
                                        variableName,
                                        eqn
                                    )}
                                    {renderEquationInput(
                                        key,
                                        "maxterms",
                                        variableName,
                                        eqn
                                    )}
                                    {renderEquationInput(
                                        key,
                                        "sop",
                                        variableName,
                                        eqn
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="convert-button-container">
                    {isEquationsComplete ? (
                        <button
                            className="convert-button purple-button"
                            onClick={() => setShowCircuit(true)}
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={handleEquationConfirm}
                            className="confirm-button purple-button"
                        >
                            Confirm
                        </button>
                    )}
                </div>
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
                setShowEquationsInfo(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Add click-outside handler for hint tooltips
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest(".hint-container")) {
                setActiveHint(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Add handler for give up button
    const handleGiveUp = (section) => {
        setHasGivenUp((prev) => ({
            ...prev,
            [section]: true,
        }));

        // Fill in all answers for the respective section
        if (section === "excitationTable") {
            const newAnswers = {};
            excitationBlankCells.forEach((key) => {
                const [rowIndex, column] = key.split("-");
                newAnswers[key] = mergedExcitationTable[rowIndex][column];
            });
            setExcitationAnswers(newAnswers);
            setExcitationValidation({});
            setIsExcitationComplete(true);
        } else if (section === "equations") {
            const newAnswers = {};
            Object.keys(simplifiedEquations).forEach((key) => {
                const eqn = simplifiedEquations[key];
                newAnswers[`${key}-minterms`] = eqn.mintermIndices.join(", ");
                newAnswers[`${key}-maxterms`] =
                    eqn.canonicalPoM.match(/\((.*?)\)/)[1];
                newAnswers[`${key}-sop`] = eqn.minimalSoP;
            });
            setEquationAnswers(newAnswers);
            setEquationValidation({});
            setIsEquationsComplete(true);
        }
    };

    return (
        <div>
            {/* 1) Always Display Excitation Table */}
            {renderExcitationTable()}

            {/* 2) Only show equations after clicking Next in excitation table */}
            {showEquations && renderEquations()}

            {/* 3) Only show circuit diagram after clicking Next in equations */}
            {showCircuit && (
                <>
                    <h2>Generated Circuit Diagram</h2>
                    {isGenerated && (
                        <CircuitDiagram
                            numInputs={numInputs ? numInputs.toString() : "1"}
                            flipFlopType={flipFlopType}
                            numFlipFlops={numStateBits.toString()}
                            fsmType={diagramType}
                            isGenerated={true}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default STCConversion;
