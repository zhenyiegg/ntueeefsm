/* STCConversion.jsx */

import React, { useEffect, useState } from "react";
import {
    simplifyBooleanFunction,
    getCanonicalSumOfMinterms,
    getCanonicalProductOfMaxterms,
} from "./kmap"; // K-map solver
import CircuitDiagram from "./CircuitDiagram"; // <-- Reuse your P5 circuit component
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo, faDownload } from "@fortawesome/free-solid-svg-icons";
import "../styles/StateToCircuit.css";

const STCConversion = ({
    diagramType, // e.g. "Mealy" or "Moore"
    flipFlopType, // e.g. "D", "T", or "JK"
    transitionTable, // array of { presentState, input, nextState, output }, etc.
    numInputs, // pass this down from the parent (if you need it)
    cellValidation, // validation state from parent
    blankCells, // blank cells from parent
    difficulty, // difficulty level from parent
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

    // Add new state for tracking give up status
    const [hasGivenUp, setHasGivenUp] = useState({
        transitionTable: false,
        excitationTable: false,
        equations: false,
    });

    // Add states for tracking incorrect attempts
    const [incorrectAttempts, setIncorrectAttempts] = useState({
        excitationTable: 0,
        equations: 0,
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

        // Create a set of used states and inputs combinations from the transition table
        const usedStateInputCombos = new Set();

        transitionTable.forEach((row) => {
            // parse the current row
            const inputVal = row.input;
            const presentStateId = row.presentState.split(" ")[0]; // e.g. "S1"
            const nextStateId = row.nextState.split(" ")[0]; // e.g. "S2"

            // For safety, .padStart(...) to ensure we have uniform bits
            const presentCode = states[presentStateId].padStart(maxBits, "0");
            const nextCode = states[nextStateId].padStart(maxBits, "0");

            // Mark this state-input combination as used
            usedStateInputCombos.add(`${presentCode}-${inputVal}`);

            // Log used state for debugging
            console.log(`Used State at: ${presentCode}, Input: ${inputVal}`);

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
                isUsed: true, // Mark as used state
            });
        });

        // Add unused states to the excitation table
        // Generate all possible state combinations
        const possibleInputs = [];
        if (numInputs === 1) {
            possibleInputs.push("0", "1");
        } else if (numInputs === 2) {
            possibleInputs.push("00", "01", "10", "11");
        } else {
            // Default fallback, single input
            possibleInputs.push("0", "1");
        }

        // Log numInputs and possibleInputs for debugging
        console.log(
            `numInputs: ${numInputs}, possibleInputs: ${JSON.stringify(
                possibleInputs
            )}`
        );

        // Generate all possible state combinations (2^maxBits)
        for (let stateNum = 0; stateNum < Math.pow(2, maxBits); stateNum++) {
            const presentCode = stateNum.toString(2).padStart(maxBits, "0");

            // For each possible input
            for (const inputVal of possibleInputs) {
                // Skip if this state-input combination is already used
                if (usedStateInputCombos.has(`${presentCode}-${inputVal}`)) {
                    continue;
                }

                // Log unused state for debugging
                console.log(
                    `Unused State at: ${presentCode}, Input: ${inputVal}`
                );

                // Add unused state with "X" values
                mergedTable.push({
                    presentState: presentCode,
                    input: inputVal,
                    nextState: "X".repeat(maxBits),
                    excitation:
                        flipFlopType === "JK"
                            ? Array(maxBits).fill("XX").join(" ") // Format for JK: "XX XX"
                            : "X".repeat(maxBits), // Format for D/T: "XX"
                    output: "X",
                    isUsed: false, // Mark as unused state
                });
            }
        }

        // Sort the table by present state and input for better readability
        mergedTable.sort((a, b) => {
            const stateCompare = a.presentState.localeCompare(b.presentState);
            if (stateCompare !== 0) return stateCompare;
            return a.input.localeCompare(b.input);
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
                        validIndices,
                        maxBits
                    ),
                    canonicalSoM: getCanonicalSumOfMinterms(
                        minterms,
                        numVariables
                    ),
                    canonicalPoM: getCanonicalProductOfMaxterms(
                        minterms,
                        numVariables,
                        validIndices
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
                        validIndices,
                        maxBits
                    ),
                    canonicalSoM: getCanonicalSumOfMinterms(
                        mintermsJ,
                        numVariables
                    ),
                    canonicalPoM: getCanonicalProductOfMaxterms(
                        mintermsJ,
                        numVariables,
                        validIndices
                    ),
                };
                eqns[`${ffKey}_K`] = {
                    mintermIndices: mintermsK,
                    minimalSoP: simplifyBooleanFunction(
                        mintermsK,
                        numVariables,
                        validIndices,
                        maxBits
                    ),
                    canonicalSoM: getCanonicalSumOfMinterms(
                        mintermsK,
                        numVariables
                    ),
                    canonicalPoM: getCanonicalProductOfMaxterms(
                        mintermsK,
                        numVariables,
                        validIndices
                    ),
                };
            }
        });

        // Add output equation (Z) for both Mealy and Moore machines
        const outputMinterms = [];

        // For Moore machines, the output depends only on the current state
        // For Mealy machines, the output depends on both current state and input
        if (diagramType === "Moore") {
            // Create a set to keep track of states with output 1
            const statesWithOutput1 = new Set();

            // First pass: identify which states have output 1
            transitionTable.forEach((entry) => {
                if (entry.output === "1") {
                    // Extract state code and add to set
                    const stateCodeMatch =
                        entry.presentState.match(/\(([01]+)\)/);
                    const presentStateCode = stateCodeMatch
                        ? stateCodeMatch[1]
                        : "";
                    statesWithOutput1.add(presentStateCode);
                }
            });

            // Second pass: generate minterms for all input combinations for those states
            const possibleInputs = [];
            for (let i = 0; i < Math.pow(2, numInputs); i++) {
                possibleInputs.push(i.toString(2).padStart(numInputs, "0"));
            }

            // Generate minterms for all state+input combinations where state has output 1
            statesWithOutput1.forEach((stateCode) => {
                possibleInputs.forEach((inputVal) => {
                    const vars = stateCode + inputVal;
                    const index = parseInt(vars, 2);
                    outputMinterms.push(index);
                });
            });
        } else {
            // Mealy machine - output depends on both state and input
            transitionTable.forEach((entry) => {
                // Extract the state code from something like "S1 (01)" -> "01"
                const stateCodeMatch = entry.presentState.match(/\(([01]+)\)/);
                const presentStateCode = stateCodeMatch
                    ? stateCodeMatch[1]
                    : "";

                if (entry.output === "1") {
                    // Create a combined binary string of state bits + input bits
                    const vars = presentStateCode + entry.input;
                    const index = parseInt(vars, 2);
                    outputMinterms.push(index);
                }
            });
        }

        // Calculate number of variables for output equation
        const numVarsForOutput =
            transitionTable.length > 0
                ? transitionTable[0].presentState.match(/\(([01]+)\)/)?.[1]
                      ?.length +
                  (diagramType === "Moore"
                      ? numInputs
                      : transitionTable[0].input.length)
                : 0;

        // Add Z equation to the equations list
        if (numVarsForOutput > 0) {
            eqns["Z"] = {
                mintermIndices: outputMinterms,
                minimalSoP: simplifyBooleanFunction(
                    outputMinterms,
                    numVarsForOutput,
                    validIndices,
                    maxBits
                ),
                canonicalSoM: getCanonicalSumOfMinterms(
                    outputMinterms,
                    numVarsForOutput
                ),
                canonicalPoM: getCanonicalProductOfMaxterms(
                    outputMinterms,
                    numVarsForOutput,
                    validIndices
                ),
            };
        }

        setSimplifiedEquations(eqns);
        setIsGenerated(true);
    }, [transitionTable, flipFlopType, numInputs, diagramType]);

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

            // When resetting equation answers, make sure to clear all zero-checkbox states too
            const newEquationAnswers = {};

            // Set all zero checkboxes to false initially
            if (simplifiedEquations) {
                Object.keys(simplifiedEquations).forEach((key) => {
                    const mintermKey = `${key}-minterms`;
                    const isZeroKey = `${mintermKey}-isZero`;
                    newEquationAnswers[isZeroKey] = false;
                });
            }

            setEquationAnswers(newEquationAnswers);
            setEquationValidation({});
            setIsEquationsComplete(false);
        }
    }, [transitionTable, simplifiedEquations]);

    // Update validation function for excitation table
    const validateExcitationInput = (value, column) => {
        if (value === "") return true;

        // Convert lowercase 'x' to uppercase 'X' for validation
        const normalizedValue = value.replace(/x/g, "X");

        // Same validation rules for both used and unused states within the same column
        switch (column) {
            case "input":
            case "output":
                // Accept 0, 1, X for single bit
                if (
                    normalizedValue === "0" ||
                    normalizedValue === "1" ||
                    normalizedValue === "X"
                )
                    return true;
                // Accept 00, 01, 10, 11, XX for two bits
                if (
                    normalizedValue === "00" ||
                    normalizedValue === "01" ||
                    normalizedValue === "10" ||
                    normalizedValue === "11" ||
                    normalizedValue === "XX"
                )
                    return true;
                // Allow mixed X patterns like X0, 0X, X1, 1X for two bits
                if (
                    normalizedValue === "X0" ||
                    normalizedValue === "0X" ||
                    normalizedValue === "X1" ||
                    normalizedValue === "1X"
                )
                    return true;
                return false;

            case "nextState":
                // Accept any number of bits (up to numStateBits) of 0s, 1s, and Xs
                if (
                    /^[01X]+$/.test(normalizedValue) &&
                    normalizedValue.length <= numStateBits
                )
                    return true;
                return false;

            case "excitation":
                if (flipFlopType === "D" || flipFlopType === "T") {
                    // For D or T: Accept any numStateBits of 0s, 1s, and Xs
                    if (
                        /^[01X]+$/.test(normalizedValue) &&
                        normalizedValue.length <= numStateBits
                    )
                        return true;
                    return false;
                } else if (flipFlopType === "JK") {
                    // For JK, special format
                    // Accept any combination of 0, 1, X, and spaces
                    // We'll validate the overall structure but allow more flexibility

                    // First, check if it's a single X value
                    if (normalizedValue === "X") return true;

                    // Allow simple 2-character inputs like "XX", "01", "0X", etc.
                    if (/^[01X]{2}$/.test(normalizedValue)) return true;

                    // If the input contains spaces, validate each pair
                    if (normalizedValue.includes(" ")) {
                        const pairs = normalizedValue.split(" ");

                        // Don't be too strict on number of pairs, but ensure none are too long
                        for (const pair of pairs) {
                            // Empty pairs from extra spaces are okay
                            if (pair === "") continue;

                            // Each non-empty pair should have 1-2 characters, all 0, 1, or X
                            if (pair.length > 2) return false;
                            if (!/^[01X]{1,2}$/.test(pair)) return false;
                        }
                        return true;
                    }

                    // If no spaces but has valid characters, accept it (might be partial input)
                    return /^[01X]+$/.test(normalizedValue);
                }
                return false;

            default:
                return false;
        }
    };

    // Update handler for excitation cell changes with enhanced tooltip messages
    const handleExcitationCellChange = (rowIndex, column, value) => {
        const key = `${rowIndex}-${column}`;
        // Remove unused variable
        // const isUnusedState = mergedExcitationTable[rowIndex].isUsed === false;

        // Convert all lowercase 'x' to uppercase 'X' for consistency
        const processedValue = value.replace(/x/g, "X");

        // Continue with normal capitalization for excitation column
        const capitalizedValue =
            column === "excitation"
                ? processedValue.toUpperCase()
                : processedValue;

        if (validateExcitationInput(processedValue, column)) {
            setExcitationAnswers((prev) => ({
                ...prev,
                [key]: capitalizedValue,
            }));
        }

        // Provide consistent tooltips for each column type - same as in handleExcitationFocus
        let message;
        switch (column) {
            case "input":
            case "output":
                message =
                    "Enter 0, 1, or X (lowercase 'x' is also accepted). X is valid for don't care values.";
                break;
            case "nextState":
                if (numStateBits === 1) {
                    message =
                        "Enter 0, 1, or X (lowercase 'x' is also accepted). X is valid for don't care values.";
                } else {
                    message = `Enter ${numStateBits} bits (using 0, 1, and X). Lowercase 'x' will be converted to 'X'. X can be used for don't care bits.`;
                }
                break;
            case "excitation":
                if (flipFlopType === "D") {
                    message = `Enter ${numStateBits} bits for D inputs using 0, 1, and X. Lowercase 'x' will be converted to 'X'. X can be used for don't care bits.`;
                } else if (flipFlopType === "T") {
                    message = `Enter ${numStateBits} bits for T inputs using 0, 1, and X. Lowercase 'x' will be converted to 'X'. X can be used for don't care bits.`;
                } else if (flipFlopType === "JK") {
                    message = `Enter JK pairs using 0, 1, and X (like "01 10" or "XX 0X").`;
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

    // Add handleExcitationFocus to include updated tooltip messages
    const handleExcitationFocus = (rowIndex, column) => {
        const key = `${rowIndex}-${column}`;
        setFocusedExcitationCell(key);

        // Use the same tooltip messages as in handleExcitationCellChange for consistency
        let message;
        switch (column) {
            case "input":
            case "output":
                message =
                    "Enter 0, 1, or X (lowercase 'x' is also accepted). X is valid for don't care values.";
                break;
            case "nextState":
                if (numStateBits === 1) {
                    message =
                        "Enter 0, 1, or X (lowercase 'x' is also accepted). X is valid for don't care values.";
                } else {
                    message = `Enter ${numStateBits} bits (using 0, 1, and X). Lowercase 'x' will be converted to 'X'. X can be used for don't care bits.`;
                }
                break;
            case "excitation":
                if (flipFlopType === "D") {
                    message = `Enter ${numStateBits} bits for D inputs using 0, 1, and X. Lowercase 'x' will be converted to 'X'. X can be used for don't care bits.`;
                } else if (flipFlopType === "T") {
                    message = `Enter ${numStateBits} bits for T inputs using 0, 1, and X. Lowercase 'x' will be converted to 'X'. X can be used for don't care bits.`;
                } else if (flipFlopType === "JK") {
                    message = `Enter JK pairs using 0, 1, and X (like "01 10" or "XX 0X").`;
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
        let hasIncorrect = false;

        // Process all blank cells to check if they are correct
        excitationBlankCells.forEach((key) => {
            const [rowIndex, column] = key.split("-");
            const row = mergedExcitationTable[rowIndex];
            const correctValue = row[column];
            const userAnswerRaw = excitationAnswers[key] || "";

            // Normalize user answer by converting any lowercase 'x' to uppercase 'X'
            const userAnswer = userAnswerRaw.replace(/x/g, "X");

            let isCorrect = false;

            if (row.isUsed === false) {
                // For unused states
                if (column === "input") {
                    // Input values should always match the correct value, even for unused states
                    isCorrect = userAnswer === correctValue;
                } else {
                    // For other columns of unused states, X values are always correct
                    if (/^X+$/.test(userAnswer)) {
                        isCorrect = true;
                    } else if (userAnswer === correctValue) {
                        isCorrect = true;
                    } else if (
                        column === "nextState" ||
                        column === "excitation"
                    ) {
                        // For nextState and excitation, check if there are valid X patterns
                        if (
                            /^[01X]+$/.test(userAnswer) &&
                            userAnswer.includes("X")
                        ) {
                            isCorrect = true;
                        }
                    } else if (column === "output") {
                        // For output, also allow X in patterns
                        if (
                            /^[01X]+$/.test(userAnswer) &&
                            userAnswer.includes("X")
                        ) {
                            isCorrect = true;
                        }
                    }
                }
            } else {
                // For used states, require exact match or valid partial X patterns
                // All-X answers should NOT be automatically correct for used states
                if (userAnswer === correctValue) {
                    isCorrect = true;
                }
                // Allow using X in place of a bit that doesn't matter
                else if (
                    /^[01X]+$/.test(userAnswer) &&
                    userAnswer.length === correctValue.length &&
                    userAnswer !== "X".repeat(userAnswer.length) && // Prevent all-X from being correct
                    column !== "input" // Don't allow X patterns for input fields
                ) {
                    // Allow partial X patterns if they match where they matter
                    let potentiallyCorrect = true;
                    for (let i = 0; i < userAnswer.length; i++) {
                        if (
                            userAnswer[i] !== "X" &&
                            userAnswer[i] !== correctValue[i]
                        ) {
                            potentiallyCorrect = false;
                            break;
                        }
                    }
                    isCorrect = potentiallyCorrect;
                }
            }

            newValidation[key] = isCorrect;

            if (!isCorrect) {
                allCorrect = false;
                hasIncorrect = true;
            }
        });

        setExcitationValidation(newValidation);
        setIsExcitationComplete(allCorrect);

        // Increment incorrect attempts counter if any answers are incorrect
        if (hasIncorrect) {
            setIncorrectAttempts((prev) => ({
                ...prev,
                excitationTable: prev.excitationTable + 1,
            }));
        }

        // If all correct, enable the equations section
        if (allCorrect) {
            setShowEquations(true);
        }
    };

    // Update useEffect to initialize blank cells for excitation table
    useEffect(() => {
        if (mergedExcitationTable) {
            const newBlankCells = new Set();

            // Set blank cell probability based on difficulty
            let blankProbability;
            switch (difficulty) {
                case "easy":
                    blankProbability = 0.25; // 25% chance of being blank (75% pre-filled)
                    break;
                case "medium":
                    blankProbability = 0.5; // 50% chance of being blank (50% pre-filled)
                    break;
                case "hard":
                    blankProbability = 0.75; // 75% chance of being blank (25% pre-filled)
                    break;
                case "expert":
                    // For expert mode, make all cells blank
                    mergedExcitationTable.forEach((_, rowIndex) => {
                        ["input", "nextState", "excitation", "output"].forEach(
                            (column) => {
                                newBlankCells.add(`${rowIndex}-${column}`);
                            }
                        );
                    });
                    setExcitationBlankCells(newBlankCells);
                    return;
                default:
                    blankProbability = 0.5; // Default to medium
            }

            // For non-expert difficulties, use probability-based approach
            mergedExcitationTable.forEach((_, rowIndex) => {
                // Track blanks in this row (only used for easy/medium)
                let blanksInRow = 0;

                // Try each column in random order
                const columns = [
                    "input",
                    "nextState",
                    "excitation",
                    "output",
                ].sort(() => Math.random() - 0.5);

                for (const column of columns) {
                    // Only apply max blanks per row limit for easy and medium difficulties
                    if (difficulty !== "hard" && blanksInRow >= 2) break;

                    // Chance of being blank based on difficulty
                    if (Math.random() < blankProbability) {
                        newBlankCells.add(`${rowIndex}-${column}`);
                        blanksInRow++;
                    }
                }
            });

            setExcitationBlankCells(newBlankCells);
        }
    }, [mergedExcitationTable, difficulty]);

    // Update renderExcitationCell to adjust maxLength based on column and flip-flop type
    const renderExcitationCell = (row, rowIndex, column, value) => {
        const key = `${rowIndex}-${column}`;
        const isBlank = excitationBlankCells.has(key);
        const isCorrect = excitationValidation[key];
        const isGivenUp = hasGivenUp.excitationTable;
        const isIncorrect =
            excitationValidation.hasOwnProperty(key) && !isCorrect;
        // Remove unused variable since we're not differentiating unused states in the UI anymore
        // const isUnusedState = row.isUsed === false;

        // Only show given-up state for cells that were not correct
        const showGivenUp = isGivenUp && !isCorrect;

        // For all cells including unused states, show value if not blank
        if (!isBlank) return value;

        // For all blank cells (both used and unused states), show input field
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
                // For JK flip-flops, allow more characters based on number of state bits
                // Each JK pair needs 2 chars plus 1 space, minus 1 space after the last pair
                maxLength =
                    flipFlopType === "JK" ? numStateBits * 3 - 1 : numStateBits;
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
                    } ${showGivenUp ? "given-up" : ""}`}
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
                <h3>Excitation Table</h3>
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
                        className="download-button"
                        onClick={downloadExcitationTableCSV}
                        title="Download as CSV"
                        disabled={!isExcitationComplete}
                    >
                        <FontAwesomeIcon icon={faDownload} />
                    </button>
                    <button
                        className="give-up-button"
                        onClick={() => handleGiveUp("excitationTable")}
                        disabled={
                            hasGivenUp.excitationTable ||
                            isExcitationComplete ||
                            incorrectAttempts.excitationTable < 2
                        }
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
                                    JK Inputs: Format is "J1K1 J0K0..." for{" "}
                                    {numStateBits} state bits. Each JK pair can
                                    be 0X, X0, 1X, X1, 00, 01, 10, 11, or XX. A
                                    value of "X" means "don't care" - either 0
                                    or 1 can be used.
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
                // Check if this is a case with no minterms (where answer should be 0)
                const eqn = simplifiedEquations[equationKey];
                const hasNoMinterms = eqn?.mintermIndices.length === 0;

                if (hasNoMinterms) {
                    message =
                        "When there are no minterms, check the '0' checkbox to indicate Sum of Minterms is 0";
                } else {
                    message =
                        "Enter minterm indices separated by commas (e.g., 0, 1, 4, 5)";
                }
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
        const fullKey = `${equationKey}-${field}`;
        setFocusedEquationCell(fullKey);

        // Set appropriate tooltip message based on field type
        let message;
        switch (field) {
            case "minterms":
                // Check if this is a case with no minterms (where answer should be 0)
                const eqn = simplifiedEquations[equationKey];
                const hasNoMinterms = eqn?.mintermIndices.length === 0;

                if (hasNoMinterms) {
                    message =
                        "When there are no minterms, check the '0' checkbox to indicate Sum of Minterms is 0";
                } else {
                    message =
                        "Enter minterm indices separated by commas (e.g., 0, 1, 4, 5)";
                }
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
            [fullKey]: message,
        }));
    };

    // Update handleEquationConfirm to track incorrect attempts
    const handleEquationConfirm = () => {
        const newValidation = {};
        const newHints = { ...showHints };
        const newAttempts = { ...hintAttempts };
        let allCorrect = true;
        let hasAnyIncorrect = false; // Changed from hasIncorrect to hasAnyIncorrect to make the naming clearer

        Object.keys(simplifiedEquations).forEach((key) => {
            const eqn = simplifiedEquations[key];

            // Check minterms
            const mintermKey = `${key}-minterms`;
            const isZeroKey = `${mintermKey}-isZero`;
            const isZero = equationAnswers[isZeroKey] || false;
            const userMinterms = equationAnswers[mintermKey] || "";
            const correctMinterms = eqn.mintermIndices.join(", ");

            // Check if this is the special "0" case (no minterms)
            const hasNoMinterms = eqn.mintermIndices.length === 0;

            // For the 0 case, if the checkbox is checked and the field is "0", it's correct
            // If there are no minterms and the checkbox is NOT checked, it's incorrect regardless of input
            // Otherwise, validate the normal minterm input
            let areMintermsCorrect;

            if (hasNoMinterms) {
                // When there are no minterms, ONLY accept the checkbox being checked
                areMintermsCorrect = isZero && userMinterms === "0";
            } else {
                // When there are minterms, checkbox should NOT be checked and value should match
                areMintermsCorrect =
                    !isZero &&
                    userMinterms.replace(/\s/g, "") ===
                        correctMinterms.replace(/\s/g, "");
            }

            newValidation[mintermKey] = areMintermsCorrect;

            if (!areMintermsCorrect) {
                newHints[mintermKey] = true;
                newAttempts[mintermKey] = (newAttempts[mintermKey] || 0) + 1;
                allCorrect = false;
                hasAnyIncorrect = true; // Set to true if any field is incorrect, even if it's empty
            }

            // Check maxterms
            const maxtermKey = `${key}-maxterms`;
            const maxtermZeroKey = `${maxtermKey}-isZero`;
            const isMaxtermZero = equationAnswers[maxtermZeroKey] || false;
            const userMaxterms = equationAnswers[maxtermKey] || "";

            // Extract correct maxterms or determine if there are none
            const hasNoMaxterms =
                !eqn.canonicalPoM ||
                !eqn.canonicalPoM.includes("(") ||
                eqn.canonicalPoM.match(/\((.*?)\)/)[1].trim() === "";
            const correctMaxterms = hasNoMaxterms
                ? ""
                : eqn.canonicalPoM.match(/\((.*?)\)/)[1];

            // For the 1 case (when there are no maxterms), if checkbox is checked and field is "1", it's correct
            let areMaxtermsCorrect;

            if (hasNoMaxterms) {
                // When there are no maxterms, ONLY accept the checkbox being checked
                areMaxtermsCorrect = isMaxtermZero && userMaxterms === "1";
            } else {
                // When there are maxterms, checkbox should NOT be checked and value should match
                areMaxtermsCorrect =
                    !isMaxtermZero &&
                    userMaxterms.replace(/\s/g, "") ===
                        correctMaxterms.replace(/\s/g, "");
            }

            newValidation[maxtermKey] = areMaxtermsCorrect;

            if (!areMaxtermsCorrect) {
                newHints[maxtermKey] = true;
                newAttempts[maxtermKey] = (newAttempts[maxtermKey] || 0) + 1;
                hasAnyIncorrect = true; // Set to true if any field is incorrect, even if it's empty
            }

            // Check simplified expression
            const sopKey = `${key}-sop`;
            const userSop = equationAnswers[sopKey] || "";
            const correctSop = eqn.minimalSoP;
            const isSopCorrect =
                userSop.replace(/\s/g, "") === correctSop.replace(/\s/g, "");
            newValidation[sopKey] = isSopCorrect;

            if (!isSopCorrect) {
                newHints[sopKey] = true;
                newAttempts[sopKey] = (newAttempts[sopKey] || 0) + 1;
                hasAnyIncorrect = true; // Set to true if any field is incorrect, even if it's empty
            }

            if (!areMintermsCorrect || !areMaxtermsCorrect || !isSopCorrect) {
                allCorrect = false;
            }
        });

        setEquationValidation(newValidation);
        setShowHints(newHints);
        setHintAttempts(newAttempts);
        setIsEquationsComplete(allCorrect);

        // Increment incorrect attempts counter if any answers are incorrect or missing
        if (hasAnyIncorrect) {
            setIncorrectAttempts((prev) => ({
                ...prev,
                equations: prev.equations + 1,
            }));
        }
    };

    // Add helper function to get flip-flop variable names
    const getFlipFlopName = (ffIndex, ffType) => {
        if (ffIndex === "Z") return "Z"; // Special case for output equation

        switch (ffType) {
            case "D":
                return `D${ffIndex}`;
            case "T":
                return `T${ffIndex}`;
            case "JK":
                // For JK, we return just the index since J/K are added separately where needed
                return `${ffIndex}`;
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

        // Only show given-up state for cells that were not correct
        const showGivenUp = isGivenUp && !isCorrect;

        // Calculate width based on input value
        const value = equationAnswers[fullKey] || "";
        const minWidth = 100;
        const padding = 16;
        const width = Math.max(
            minWidth,
            measureText(value, "1rem monospace") + padding
        );

        // Get the proper display name
        let displayName;
        if (key === "Z") {
            displayName = "Z";
        } else if (key.includes("_J")) {
            const ffIndex = key.match(/\d+/)[0];
            displayName = `J${ffIndex}`;
        } else if (key.includes("_K")) {
            const ffIndex = key.match(/\d+/)[0];
            displayName = `K${ffIndex}`;
        } else {
            const ffIndex = key.match(/\d+/)[0];
            displayName = getFlipFlopName(ffIndex, flipFlopType);
        }

        // Generate the variable list for the equation
        const stateVars = Array.from(
            { length: numStateBits },
            (_, i) => `Q${numStateBits - 1 - i}`
        );

        const inputVars =
            numInputs > 1
                ? Array.from(
                      { length: numInputs },
                      (_, i) => `X${numInputs - 1 - i}`
                  )
                : ["X"];

        const allVars = [...stateVars, ...inputVars].join(", ");

        // Render individual equation forms with proper styling for maxterms and minterms
        const isZeroCheckbox = field === "minterms" || field === "maxterms";
        const isZeroKey = `${fullKey}-isZero`;
        const isZero = equationAnswers[isZeroKey] || false;

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
                    {displayName}({allVars}) ={" "}
                    {(!isZeroCheckbox || !isZero) && field === "minterms" && (
                        <span>Σm(</span>
                    )}
                    {(!isZeroCheckbox || !isZero) && field === "maxterms" && (
                        <span>∏M(</span>
                    )}
                    <div className="input-container">
                        <input
                            type="text"
                            className={`equation-input ${
                                isCorrect ? "correct" : ""
                            } ${isIncorrect ? "incorrect" : ""} ${
                                showGivenUp ? "given-up" : ""
                            } ${isZeroCheckbox && isZero ? "zero-mode" : ""}`}
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
                        {(field === "minterms" || field === "maxterms") &&
                            (!isZeroCheckbox || !isZero) && (
                                <span style={{ marginLeft: "2px" }}>)</span>
                            )}
                        {focusedEquationCell === fullKey && (
                            <div className="input-tooltip">
                                {equationTooltip[fullKey]}
                            </div>
                        )}
                    </div>
                    {/* Add "Or" text before the checkbox */}
                    {isZeroCheckbox &&
                        (field === "minterms" || field === "maxterms") && (
                            <>
                                <span className="equation-or-text">Or</span>
                                <div className="zero-checkbox-container">
                                    <label
                                        className={`zero-checkbox-label ${
                                            field === "maxterms"
                                                ? "maxterm"
                                                : ""
                                        } ${showGivenUp ? "given-up" : ""}`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="zero-checkbox"
                                            checked={isZero}
                                            onChange={(e) => {
                                                // Set the isZero property for this equation
                                                setEquationAnswers((prev) => ({
                                                    ...prev,
                                                    [isZeroKey]:
                                                        e.target.checked,
                                                }));

                                                // If checked, set the value to "0" for minterms or "1" for maxterms
                                                if (e.target.checked) {
                                                    setEquationAnswers(
                                                        (prev) => ({
                                                            ...prev,
                                                            [fullKey]:
                                                                field ===
                                                                "minterms"
                                                                    ? "0"
                                                                    : "1",
                                                        })
                                                    );

                                                    // Update tooltip when checked
                                                    setEquationTooltip(
                                                        (prev) => ({
                                                            ...prev,
                                                            [fullKey]:
                                                                field ===
                                                                "minterms"
                                                                    ? "Zero selected: indicates function is always 0 (no minterms)"
                                                                    : "One selected: indicates function is always 1 (no maxterms)",
                                                        })
                                                    );
                                                } else {
                                                    // If unchecked, clear the value
                                                    setEquationAnswers(
                                                        (prev) => ({
                                                            ...prev,
                                                            [fullKey]: "",
                                                        })
                                                    );

                                                    // Update tooltip when unchecked
                                                    const eqn =
                                                        simplifiedEquations[
                                                            key
                                                        ];
                                                    const hasNoTerms =
                                                        field === "minterms"
                                                            ? eqn
                                                                  ?.mintermIndices
                                                                  .length === 0
                                                            : eqn
                                                                  ?.maxtermIndices
                                                                  ?.length ===
                                                              0;

                                                    setEquationTooltip(
                                                        (prev) => ({
                                                            ...prev,
                                                            [fullKey]:
                                                                hasNoTerms
                                                                    ? field ===
                                                                      "minterms"
                                                                        ? "When there are no minterms, check the checkbox to indicate Sum of Minterms is 0"
                                                                        : "When there are no maxterms, check the checkbox to indicate Product of Maxterms is 1"
                                                                    : field ===
                                                                      "minterms"
                                                                    ? "Enter minterm indices separated by commas (e.g., 0, 1, 4, 5)"
                                                                    : "Enter maxterm indices separated by commas (e.g., 0, 1, 4, 5)",
                                                        })
                                                    );
                                                }
                                            }}
                                            disabled={isCorrect || isGivenUp}
                                        />
                                        <span>
                                            = {field === "minterms" ? "0" : "1"}
                                        </span>
                                    </label>
                                </div>
                            </>
                        )}
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
                        className="download-button"
                        onClick={downloadEquationsCSV}
                        title="Download as CSV"
                        disabled={!isEquationsComplete}
                    >
                        <FontAwesomeIcon icon={faDownload} />
                    </button>
                    <button
                        className="give-up-button"
                        onClick={() => handleGiveUp("equations")}
                        disabled={
                            hasGivenUp.equations ||
                            isEquationsComplete ||
                            incorrectAttempts.equations < 2
                        }
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
                            <li>
                                The variables are listed in order (e.g., D0(Q1,
                                Q0, X)) to ensure correct interpretation of
                                minterms/maxterms
                            </li>
                        </ul>
                        <p>
                            Example: If sum of minterms is "x̄ȳz + x̄yz̄", the
                            indices would be "1, 2"
                        </p>
                    </div>
                )}
                <div className="equations-list">
                    {Object.keys(simplifiedEquations)
                        .sort((a, b) => {
                            // Handle Z equation (it should come after all flip-flop equations)
                            if (a === "Z") return 1;
                            if (b === "Z") return -1;

                            // Extract the numeric part from the keys for flip-flop equations
                            const numA = parseInt(a.match(/\d+/)?.[0] || "0");
                            const numB = parseInt(b.match(/\d+/)?.[0] || "0");
                            // Sort in descending order (higher numbers first)
                            return numB - numA;
                        })
                        .map((key) => {
                            const variableName = key.includes("_")
                                ? key.replace("_", "")
                                : key;
                            const eqn = simplifiedEquations[key];

                            return (
                                <div key={key} className="equation-block">
                                    <h4>
                                        {key === "Z"
                                            ? "Output Equation (Z)"
                                            : key.includes("_")
                                            ? flipFlopType === "JK"
                                                ? `${
                                                      key.includes("_J")
                                                          ? "J"
                                                          : "K"
                                                  }${getFlipFlopName(
                                                      key.match(/\d+/)[0],
                                                      flipFlopType
                                                  )} Equation`
                                                : `${getFlipFlopName(
                                                      key.match(/\d+/)[0],
                                                      flipFlopType
                                                  )}${
                                                      key.includes("_J")
                                                          ? "J"
                                                          : "K"
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

    // Add handler for give up button
    const handleGiveUp = (section) => {
        setHasGivenUp((prev) => ({
            ...prev,
            [section]: true,
        }));

        // Fill in only incorrect or missing answers
        if (section === "excitationTable") {
            const newAnswers = { ...excitationAnswers }; // Preserve existing answers
            excitationBlankCells.forEach((key) => {
                const [rowIndex, column] = key.split("-");
                // Only update if the answer is incorrect or missing
                if (!excitationValidation[key]) {
                    newAnswers[key] = mergedExcitationTable[rowIndex][column];
                }
            });
            setExcitationAnswers(newAnswers);
            // Don't clear validations - preserve correct answers' validation state
            setIsExcitationComplete(true);
        } else if (section === "equations") {
            const newAnswers = { ...equationAnswers };
            // We don't need to modify validation for given-up fields
            // Let the UI style handle showing them as "given up"

            // Fill in correct answers for all equation fields that aren't already correct
            Object.keys(simplifiedEquations).forEach((key) => {
                const eqn = simplifiedEquations[key];

                // Handle minterms
                const mintermKey = `${key}-minterms`;
                const isZeroKey = `${mintermKey}-isZero`;
                const hasNoMinterms = eqn.mintermIndices.length === 0;

                // Only update fields that haven't been correctly answered
                if (!equationValidation[mintermKey]) {
                    if (hasNoMinterms) {
                        // Set the zero checkbox to checked and the value to "0"
                        newAnswers[isZeroKey] = true;
                        newAnswers[mintermKey] = "0";
                    } else {
                        // Set normal minterm indices and ensure checkbox is unchecked
                        newAnswers[isZeroKey] = false;
                        newAnswers[mintermKey] = eqn.mintermIndices.join(", ");
                    }
                    // Don't set validation to true for given-up fields
                }

                // Handle maxterms
                const maxtermKey = `${key}-maxterms`;
                const maxtermZeroKey = `${maxtermKey}-isZero`;

                // Determine if maxterms is empty case (function is 1)
                const hasNoMaxterms =
                    !eqn.canonicalPoM ||
                    !eqn.canonicalPoM.includes("(") ||
                    eqn.canonicalPoM.match(/\((.*?)\)/)[1].trim() === "";

                if (!equationValidation[maxtermKey]) {
                    if (hasNoMaxterms) {
                        // Set the checkbox to checked and the value to "1" for empty maxterms
                        newAnswers[maxtermZeroKey] = true;
                        newAnswers[maxtermKey] = "1";
                    } else {
                        // Set normal maxterm indices and ensure checkbox is unchecked
                        newAnswers[maxtermZeroKey] = false;
                        newAnswers[maxtermKey] =
                            eqn.canonicalPoM.match(/\((.*?)\)/)[1];
                    }
                    // Don't set validation to true for given-up fields
                }

                // Handle SoP
                const sopKey = `${key}-sop`;
                if (!equationValidation[sopKey]) {
                    newAnswers[sopKey] = eqn.minimalSoP;
                    // Don't set validation to true for given-up fields
                }
            });

            setEquationAnswers(newAnswers);
            // We don't update the validation state for given-up fields
            setIsEquationsComplete(true);
        }
    };

    // Add calculateScore function before the return statement
    const calculateScore = () => {
        let totalFields = 0;
        let correctFields = 0;

        // Count state transition table fields
        if (blankCells) {
            totalFields += blankCells.size;
            if (cellValidation) {
                Object.keys(cellValidation).forEach((key) => {
                    if (cellValidation[key]) correctFields++;
                });
            }
        }

        // Count excitation table fields
        if (excitationBlankCells) {
            totalFields += excitationBlankCells.size;
            if (excitationValidation) {
                Object.keys(excitationValidation).forEach((key) => {
                    if (excitationValidation[key]) correctFields++;
                });
            }
        }

        // Count equation fields
        if (simplifiedEquations) {
            // For each equation, we have 3 fields: minterms, maxterms, and SOP
            const numEquationFields =
                Object.keys(simplifiedEquations).length * 3;
            totalFields += numEquationFields;

            if (equationValidation) {
                Object.keys(equationValidation).forEach((key) => {
                    if (equationValidation[key]) correctFields++;
                });
            }
        }

        return {
            score: correctFields,
            total: totalFields,
            percentage:
                totalFields > 0
                    ? Math.round((correctFields / totalFields) * 100)
                    : 0,
        };
    };

    // Add renderScore function
    const renderScore = () => {
        const { score, total, percentage } = calculateScore();
        return (
            <div className="score-container">
                <div className="score-header">
                    <h3>Your Score</h3>
                    <div className="button-container">
                        <button
                            className="complete-download-button"
                            onClick={convertToNetlist}
                            title="Convert logic equations to netlist format and download"
                        >
                            <FontAwesomeIcon icon={faDownload} /> Convert to
                            Netlist
                        </button>
                        <button
                            className="complete-download-button"
                            onClick={downloadAllDataCSV}
                            title="Download Complete Project Data as CSV"
                        >
                            <FontAwesomeIcon icon={faDownload} /> Download
                            Complete Project
                        </button>
                    </div>
                </div>
                <div className="score-details">
                    <p>
                        <span className="score-number">{score}</span> /{" "}
                        <span className="score-total">{total}</span> correct
                        answers
                    </p>
                    <div className="score-percentage">
                        <span
                            style={{
                                color: percentage >= 70 ? "#4CAF50" : "#ff4444",
                            }}
                        >
                            {percentage}%
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    // Function to create netlist from logic equations
    const convertToNetlist = () => {
        if (
            !simplifiedEquations ||
            Object.keys(simplifiedEquations).length === 0
        ) {
            return;
        }

        // This will hold our netlist of gates
        const netlist = [];
        // Keep track of intermediate signals to avoid duplicates
        const intermediateSignals = new Map();
        // Counter for naming gates
        let gateCounter = 1;
        // Track signal levels for determining gate levels
        const signalLevels = new Map();

        // Initialize input signal levels (all inputs are level 0)
        const stateVars = Array.from(
            { length: numStateBits },
            (_, i) => `Q${numStateBits - 1 - i}`
        );
        const inputVars =
            numInputs > 1
                ? Array.from(
                      { length: numInputs },
                      (_, i) => `X${numInputs - 1 - i}`
                  )
                : ["X"];

        [...stateVars, ...inputVars].forEach((signal) => {
            signalLevels.set(signal, 0);
        });

        // Process each equation
        Object.keys(simplifiedEquations).forEach((key) => {
            // Get the SOP expression from user answers or the simplified equation
            const sopKey = `${key}-sop`;
            let sopExpression =
                equationAnswers[sopKey] || simplifiedEquations[key].minimalSoP;

            // Skip if the expression is simply "0" or "1"
            if (sopExpression === "0" || sopExpression === "1") {
                return;
            }

            // Parse the SOP expression (example: "Q1'Q0' + Q1Q0X")
            // Split by + to get individual product terms
            const productTerms = sopExpression
                .split("+")
                .map((term) => term.trim());

            // Array to collect outputs of AND gates for this equation
            const andOutputs = [];
            const andOutputLevels = [];

            // Process each product term (AND gate)
            productTerms.forEach((term) => {
                // Parse the term to extract variables and inversions
                const inputs = [];
                const inputLevels = [];
                let i = 0;

                while (i < term.length) {
                    // Check if this is a variable (Q or X followed by a number)
                    if (
                        (term[i] === "Q" || term[i] === "X") &&
                        i + 1 < term.length
                    ) {
                        // Extract variable name (e.g., Q0, X1)
                        const varName = term[i] + term[i + 1];
                        i += 2;

                        // Check if it's inverted (has a ' after it)
                        const isInverted = i < term.length && term[i] === "'";
                        if (isInverted) {
                            // Create a NOT gate for this input
                            const notOutput = `${varName}_NOT`;

                            // Only add the NOT gate if we haven't already created it
                            if (!intermediateSignals.has(`${varName}'`)) {
                                // NOT gates for inputs are at level 1
                                const notGateLevel = 1;

                                netlist.push({
                                    name: `Gate${gateCounter++}`,
                                    type: "not",
                                    input: [varName],
                                    output: notOutput,
                                    level: notGateLevel.toString(),
                                });

                                intermediateSignals.set(
                                    `${varName}'`,
                                    notOutput
                                );
                                signalLevels.set(notOutput, notGateLevel);
                            }

                            const notSignal = intermediateSignals.get(
                                `${varName}'`
                            );
                            inputs.push(notSignal);
                            inputLevels.push(signalLevels.get(notSignal));
                            i++; // Skip the ' character
                        } else {
                            inputs.push(varName);
                            inputLevels.push(signalLevels.get(varName) || 0);
                        }
                    } else {
                        // Skip any spacing or unrecognized characters
                        i++;
                    }
                }

                // If we have inputs, create an AND gate
                if (inputs.length > 0) {
                    // AND gates are at level = max input level + 1
                    const andGateLevel = Math.max(...inputLevels) + 1;
                    const andOutput = `AND_${gateCounter}`;

                    netlist.push({
                        name: `Gate${gateCounter++}`,
                        type: "and",
                        input: inputs,
                        output: andOutput,
                        level: andGateLevel.toString(),
                    });

                    andOutputs.push(andOutput);
                    andOutputLevels.push(andGateLevel);
                    signalLevels.set(andOutput, andGateLevel);
                }
            });

            // If we have multiple product terms, we need an OR gate to combine them
            if (andOutputs.length > 1) {
                // OR gate is at level = max AND gate level + 1
                const orGateLevel = Math.max(...andOutputLevels) + 1;

                netlist.push({
                    name: `Gate${gateCounter++}`,
                    type: "or",
                    input: andOutputs,
                    output: key,
                    level: orGateLevel.toString(),
                });

                signalLevels.set(key, orGateLevel);
            } else if (andOutputs.length === 1) {
                // If there's only one product term, connect it directly to the output
                // Find the last gate we created and update its output
                const lastGate = netlist[netlist.length - 1];
                if (lastGate && lastGate.output === andOutputs[0]) {
                    lastGate.output = key;
                    signalLevels.set(key, signalLevels.get(andOutputs[0]));
                }
            }
        });

        // Convert netlist to formatted JSON string
        const netlistJson = JSON.stringify(netlist, null, 2);

        // Create and trigger download
        const blob = new Blob([netlistJson], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `netlist_${flipFlopType}_${diagramType}_${new Date()
            .toISOString()
            .slice(0, 10)}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Function to download excitation table as CSV
    const downloadExcitationTableCSV = () => {
        if (!mergedExcitationTable) return;

        // Create CSV header
        const bitIndices = Array.from(
            { length: numStateBits },
            (_, i) => numStateBits - 1 - i
        );
        const presentStateBits = bitIndices.map((i) => `Q${i}`).join("");
        const nextStateBits = bitIndices.map((i) => `Q${i}*`).join("");
        const inputBits = Array.from(
            { length: numInputs },
            (_, i) => `X${i}`
        ).join("");

        let excitationHeader;
        if (flipFlopType === "D") {
            excitationHeader = bitIndices.map((i) => `D${i}`).join(",");
        } else if (flipFlopType === "T") {
            excitationHeader = bitIndices.map((i) => `T${i}`).join(",");
        } else if (flipFlopType === "JK") {
            excitationHeader = bitIndices.map((i) => `J${i},K${i}`).join(",");
        }

        let csvContent = `Present State (${presentStateBits}),Input (${
            inputBits || "X"
        }),Next State (${nextStateBits}),${excitationHeader},Output (Z)\n`;

        // Add each row to CSV
        mergedExcitationTable.forEach((row, rowIndex) => {
            // Get user input for blank cells or use original values
            const inputKey = `${rowIndex}-input`;
            const nextStateKey = `${rowIndex}-nextState`;
            const excitationKey = `${rowIndex}-excitation`;
            const outputKey = `${rowIndex}-output`;

            const input = excitationBlankCells.has(inputKey)
                ? excitationAnswers[inputKey] || ""
                : row.input;
            const nextState = excitationBlankCells.has(nextStateKey)
                ? excitationAnswers[nextStateKey] || ""
                : row.nextState;
            const excitation = excitationBlankCells.has(excitationKey)
                ? excitationAnswers[excitationKey] || ""
                : row.excitation;
            const output = excitationBlankCells.has(outputKey)
                ? excitationAnswers[outputKey] || ""
                : row.output;

            // Create a CSV row and escape any commas in the data
            let excitationValues = excitation;
            if (flipFlopType === "JK") {
                // For JK flip-flops, split the excitation value (e.g., "1X X0") into separate columns
                const jkPairs = excitation.split(" ");
                excitationValues = jkPairs
                    .map((pair) => `"${pair[0]}","${pair[1]}"`)
                    .join(",");
            } else {
                // For D or T flip-flops, split the excitation value into individual bits
                excitationValues = excitation
                    .split("")
                    .map((bit) => `"${bit}"`)
                    .join(",");
            }

            const csvRow = [
                `"${row.presentState}"`,
                `"${input}"`,
                `"${nextState}"`,
                excitationValues,
                `"${output}"`,
            ].join(",");

            csvContent += csvRow + "\n";
        });

        // Create a hidden download link
        const encodedUri = encodeURI(
            "data:text/csv;charset=utf-8," + csvContent
        );
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute(
            "download",
            `excitation_table_${flipFlopType}_${new Date()
                .toISOString()
                .slice(0, 10)}.csv`
        );
        document.body.appendChild(link);

        // Trigger download and remove link
        link.click();
        document.body.removeChild(link);
    };

    // Function to download equations as CSV
    const downloadEquationsCSV = () => {
        if (
            !simplifiedEquations ||
            Object.keys(simplifiedEquations).length === 0
        )
            return;

        // Create CSV header
        let csvContent =
            "Equation,Sum of Minterms,Product of Maxterms,Simplified Expression\n";

        // Generate variable list for displaying in the CSV
        const stateVars = Array.from(
            { length: numStateBits },
            (_, i) => `Q${numStateBits - 1 - i}`
        );
        const inputVars =
            numInputs > 1
                ? Array.from(
                      { length: numInputs },
                      (_, i) => `X${numInputs - 1 - i}`
                  )
                : ["X"];
        const allVars = [...stateVars, ...inputVars].join(", ");

        // Add each equation to CSV
        Object.keys(simplifiedEquations)
            .sort((a, b) => {
                // Handle Z equation (it should come after all flip-flop equations)
                if (a === "Z") return 1;
                if (b === "Z") return -1;

                // Extract the numeric part from the keys for flip-flop equations
                const numA = parseInt(a.match(/\d+/)?.[0] || "0");
                const numB = parseInt(b.match(/\d+/)?.[0] || "0");
                // Sort in descending order (higher numbers first)
                return numB - numA;
            })
            .forEach((key) => {
                // Get display name
                let displayName;
                if (key === "Z") {
                    displayName = `Z(${allVars})`;
                } else if (key.includes("_J")) {
                    const ffIndex = key.match(/\d+/)[0];
                    displayName = `J${ffIndex}(${allVars})`;
                } else if (key.includes("_K")) {
                    const ffIndex = key.match(/\d+/)[0];
                    displayName = `K${ffIndex}(${allVars})`;
                } else {
                    const ffIndex = key.match(/\d+/)[0];
                    displayName = `${getFlipFlopName(
                        ffIndex,
                        flipFlopType
                    )}(${allVars})`;
                }

                // Get user input or calculated values
                const mintermKey = `${key}-minterms`;
                const maxtermKey = `${key}-maxterms`;
                const sopKey = `${key}-sop`;
                const isZeroMintermsKey = `${mintermKey}-isZero`;
                const isZeroMaxtermsKey = `${maxtermKey}-isZero`;

                const isZeroMinterms =
                    equationAnswers[isZeroMintermsKey] || false;
                const isZeroMaxterms =
                    equationAnswers[isZeroMaxtermsKey] || false;

                let minterms = isZeroMinterms
                    ? "0"
                    : equationAnswers[mintermKey] || "";
                let maxterms = isZeroMaxterms
                    ? "1"
                    : equationAnswers[maxtermKey] || "";
                let sop = equationAnswers[sopKey] || "";

                // Create a CSV row and escape any commas in the data
                const csvRow = [
                    `"${displayName}"`,
                    `"${isZeroMinterms ? "0" : "Σm(" + minterms + ")"}"`,
                    `"${isZeroMaxterms ? "1" : "ΠM(" + maxterms + ")"}"`,
                    `"${sop}"`,
                ].join(",");

                csvContent += csvRow + "\n";
            });

        // Create a hidden download link
        const encodedUri = encodeURI(
            "data:text/csv;charset=utf-8," + csvContent
        );
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute(
            "download",
            `equations_${flipFlopType}_${new Date()
                .toISOString()
                .slice(0, 10)}.csv`
        );
        document.body.appendChild(link);

        // Trigger download and remove link
        link.click();
        document.body.removeChild(link);
    };

    // Function to download all data as a single CSV
    const downloadAllDataCSV = () => {
        if (!transitionTable || !mergedExcitationTable || !simplifiedEquations)
            return;

        // Get the score details
        const { score, total, percentage } = calculateScore();

        // Create CSV content with section headers
        let csvContent = "";

        // 1. Add State Transition Table
        csvContent += "STATE TRANSITION TABLE\n";
        csvContent += "Present State,Input,Next State,Output\n";

        transitionTable.forEach((row) => {
            const csvRow = [
                row.presentState,
                row.input,
                row.nextState,
                row.output,
            ]
                .map((value) => `"${value}"`)
                .join(",");
            csvContent += csvRow + "\n";
        });

        csvContent += "\n"; // Add spacing between sections

        // 2. Add Excitation Table
        csvContent += "EXCITATION TABLE\n";

        // Create the excitation table header
        const bitIndices = Array.from(
            { length: numStateBits },
            (_, i) => numStateBits - 1 - i
        );
        const presentStateBits = bitIndices.map((i) => `Q${i}`).join("");
        const nextStateBits = bitIndices.map((i) => `Q${i}*`).join("");
        const inputBits = Array.from(
            { length: numInputs },
            (_, i) => `X${i}`
        ).join("");

        let excitationHeader;
        if (flipFlopType === "D") {
            excitationHeader = bitIndices.map((i) => `D${i}`).join(",");
        } else if (flipFlopType === "T") {
            excitationHeader = bitIndices.map((i) => `T${i}`).join(",");
        } else if (flipFlopType === "JK") {
            excitationHeader = bitIndices.map((i) => `J${i},K${i}`).join(",");
        }

        csvContent += `Present State (${presentStateBits}),Input (${
            inputBits || "X"
        }),Next State (${nextStateBits}),${excitationHeader},Output (Z)\n`;

        mergedExcitationTable.forEach((row) => {
            let excitationValues = row.excitation;
            if (flipFlopType === "JK") {
                // For JK flip-flops, split the excitation value (e.g., "1X X0") into separate columns
                const jkPairs = row.excitation.split(" ");
                excitationValues = jkPairs
                    .map((pair) => `"${pair[0]}","${pair[1]}"`)
                    .join(",");
            } else {
                // For D or T flip-flops, split the excitation value into individual bits
                excitationValues = row.excitation
                    .split("")
                    .map((bit) => `"${bit}"`)
                    .join(",");
            }

            const csvRow = [
                `"${row.presentState}"`,
                `"${row.input}"`,
                `"${row.nextState}"`,
                excitationValues,
                `"${row.output}"`,
            ].join(",");

            csvContent += csvRow + "\n";
        });

        csvContent += "\n"; // Add spacing between sections

        // 3. Add Equation Data
        csvContent += "BOOLEAN EQUATIONS\n";
        csvContent +=
            "Equation,Sum of Minterms,Product of Maxterms,Simplified Expression\n";

        // Generate variable list for displaying in the CSV
        const stateVars = Array.from(
            { length: numStateBits },
            (_, i) => `Q${numStateBits - 1 - i}`
        );
        const inputVars =
            numInputs > 1
                ? Array.from(
                      { length: numInputs },
                      (_, i) => `X${numInputs - 1 - i}`
                  )
                : ["X"];
        const allVars = [...stateVars, ...inputVars].join(", ");

        // Add each equation
        Object.keys(simplifiedEquations)
            .sort((a, b) => {
                // Handle Z equation (it should come after all flip-flop equations)
                if (a === "Z") return 1;
                if (b === "Z") return -1;

                // Extract the numeric part from the keys for flip-flop equations
                const numA = parseInt(a.match(/\d+/)?.[0] || "0");
                const numB = parseInt(b.match(/\d+/)?.[0] || "0");
                // Sort in descending order (higher numbers first)
                return numB - numA;
            })
            .forEach((key) => {
                // Get equation info
                const eqn = simplifiedEquations[key];

                // Get display name
                let displayName;
                if (key === "Z") {
                    displayName = `Z(${allVars})`;
                } else if (key.includes("_J")) {
                    const ffIndex = key.match(/\d+/)[0];
                    displayName = `J${ffIndex}(${allVars})`;
                } else if (key.includes("_K")) {
                    const ffIndex = key.match(/\d+/)[0];
                    displayName = `K${ffIndex}(${allVars})`;
                } else {
                    const ffIndex = key.match(/\d+/)[0];
                    displayName = `${getFlipFlopName(
                        ffIndex,
                        flipFlopType
                    )}(${allVars})`;
                }

                // Get user input values or calculated values
                const mintermKey = `${key}-minterms`;
                const maxtermKey = `${key}-maxterms`;
                const sopKey = `${key}-sop`;
                const isZeroMintermsKey = `${mintermKey}-isZero`;
                const isZeroMaxtermsKey = `${maxtermKey}-isZero`;

                const isZeroMinterms =
                    equationAnswers[isZeroMintermsKey] || false;
                const isZeroMaxterms =
                    equationAnswers[isZeroMaxtermsKey] || false;

                let minterms = equationAnswers[mintermKey] || "";
                let maxterms = equationAnswers[maxtermKey] || "";
                let sop = equationAnswers[sopKey] || eqn;

                // Create a CSV row
                const csvRow = [
                    `"${displayName}"`,
                    `"${isZeroMinterms ? "0" : "Σm(" + minterms + ")"}"`,
                    `"${isZeroMaxterms ? "1" : "ΠM(" + maxterms + ")"}"`,
                    `"${sop}"`,
                ].join(",");

                csvContent += csvRow + "\n";
            });

        // 4. Add Score Summary
        csvContent += "\n";
        csvContent += "SCORE SUMMARY\n";
        csvContent += `Correct Answers,Total Questions,Score Percentage\n`;
        csvContent += `${score},${total},${percentage}%\n`;

        // Create a hidden download link
        const encodedUri = encodeURI(
            "data:text/csv;charset=utf-8," + csvContent
        );
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute(
            "download",
            `fsm_${diagramType}_${flipFlopType}_complete_data_${new Date()
                .toISOString()
                .slice(0, 10)}.csv`
        );
        document.body.appendChild(link);

        // Trigger download and remove link
        link.click();
        document.body.removeChild(link);
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
                    <div className="circuit-diagram-container">
                        <h2>Generated Circuit Diagram</h2>
                        {isGenerated && (
                            <CircuitDiagram
                                numInputs={
                                    numInputs ? numInputs.toString() : "1"
                                }
                                flipFlopType={flipFlopType}
                                numFlipFlops={numStateBits.toString()}
                                fsmType={diagramType}
                                isGenerated={true}
                            />
                        )}
                    </div>
                    {isGenerated && renderScore()}
                </>
            )}
        </div>
    );
};

export default STCConversion;
