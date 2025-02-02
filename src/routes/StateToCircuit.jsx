//StateToCircuit.jsx

import React, { useState } from "react";
import StateDiagram from "../components/StateDiagram";
import STCConversion from "../components/STCConversion";
import "../styles/StateToCircuit.css"; // Import your CSS file
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons"; // FontAwesome Arrow

const StateToCircuit = () => {
    const [diagramType, setDiagramType] = useState("Mealy");
    const [flipFlopType, setFlipFlopType] = useState("D");
    const [numStates, setNumStates] = useState(3);
    const [numInputs, setNumInputs] = useState(1);
    const [transitionTable, setTransitionTable] = useState([]);
    const [shouldGenerate, setShouldGenerate] = useState(false);
    const [shouldConvert, setShouldConvert] = useState(false);
    const [userAnswers, setUserAnswers] = useState({});
    const [cellValidation, setCellValidation] = useState({});
    const [isTableComplete, setIsTableComplete] = useState(false);
    const [tooltipMessage, setTooltipMessage] = useState({});
    const [blankCells, setBlankCells] = useState(new Set());
    const [focusedCell, setFocusedCell] = useState(null);

    const handleGenerate = () => {
        setShouldGenerate(true); // Trigger the generation
        setShouldConvert(false); // Reset the conversion flag
    };

    const handleAutoGenerate = () => {
        // Randomly select values from the provided ranges
        const diagramTypes = ["Mealy", "Moore"];
        const flipFlopTypes = ["D", "T", "JK"];
        const numStatesOptions = [3, 4, 5, 6, 7, 8];
        const numInputsOptions = [1, 2];

        const randomDiagramType =
            diagramTypes[Math.floor(Math.random() * diagramTypes.length)];
        const randomFlipFlopType =
            flipFlopTypes[Math.floor(Math.random() * flipFlopTypes.length)];
        const randomNumStates =
            numStatesOptions[
                Math.floor(Math.random() * numStatesOptions.length)
            ];
        const randomNumInputs =
            numInputsOptions[
                Math.floor(Math.random() * numInputsOptions.length)
            ];

        // Update the state variables
        setDiagramType(randomDiagramType);
        setFlipFlopType(randomFlipFlopType);
        setNumStates(randomNumStates);
        setNumInputs(randomNumInputs);

        // Trigger the generation after updating state
        // We need to ensure that the state updates have taken place before triggering generation
        setTimeout(() => {
            setShouldGenerate(true); // Trigger the generation
            setShouldConvert(false); // Reset the conversion flag
        }, 0);
    };

    const handleConvert = () => {
        setShouldConvert(true); // Trigger the conversion
    };

    const handleDiagramGenerated = (table) => {
        // Make a copy of the table and sort by the numeric portion of the "S#"
        const sortedTable = [...table].sort((a, b) => {
            // Extract the state numbers from something like "S3 (11)"
            const aPresentStateNum = parseInt(
                a.presentState.match(/S(\d+)/)[1],
                10
            );
            const bPresentStateNum = parseInt(
                b.presentState.match(/S(\d+)/)[1],
                10
            );

            if (aPresentStateNum !== bPresentStateNum) {
                return aPresentStateNum - bPresentStateNum;
            }
            // (Optional) Secondary sort by input in numeric order (binary -> decimal)
            const aInputNum = parseInt(a.input, 2);
            const bInputNum = parseInt(b.input, 2);
            return aInputNum - bInputNum;
        });

        setTransitionTable(sortedTable);
        setShouldGenerate(false);

        // Generate and store blank cell positions
        const newBlankCells = new Set();
        sortedTable.forEach((_, rowIndex) => {
            // Track blanks in this row
            let blanksInRow = 0;

            // Try each column in random order
            const columns = ["input", "nextState", "output"].sort(
                () => Math.random() - 0.5
            );

            for (const column of columns) {
                if (blanksInRow >= 2) break; // Max 2 blanks per row

                // 30% chance of being blank
                if (Math.random() < 0.3) {
                    newBlankCells.add(`${rowIndex}-${column}`);
                    blanksInRow++;
                }
            }
        });

        setBlankCells(newBlankCells);
        // Reset other states
        setUserAnswers({});
        setCellValidation({});
        setIsTableComplete(false);
        setTooltipMessage({});
    };

    // Update validation function
    const validateInput = (value, column) => {
        if (value === "") return true;

        if (column === "nextState") {
            // Always return true to allow free typing
            return true;
        } else if (column === "input" || column === "output") {
            // Allow single digits (0,1) and double digits (00,01,10,11)
            return /^[01]$|^[01]{2}$/.test(value);
        }
        return false;
    };

    // Update cell change handler
    const handleCellChange = (rowIndex, column, value) => {
        const key = `${rowIndex}-${column}`;

        // For nextState, show tooltip if format is wrong but allow typing
        if (column === "nextState") {
            setUserAnswers((prev) => ({
                ...prev,
                [key]: value,
            }));

            // Check format and show/hide tooltip
            const statePattern = /^S[0-7]\s\([01]{2,3}\)$/;
            if (value !== "" && !statePattern.test(value)) {
                setTooltipMessage((prev) => ({
                    ...prev,
                    [key]: "Format should be: S# (##) or S# (###) - e.g., S0 (00) or S0 (001)",
                }));
            } else {
                setTooltipMessage((prev) => ({
                    ...prev,
                    [key]: "",
                }));
            }
        } else {
            // For input/output
            if (validateInput(value, column)) {
                setUserAnswers((prev) => ({
                    ...prev,
                    [key]: value,
                }));
                setTooltipMessage((prev) => ({
                    ...prev,
                    [key]: "",
                }));
            } else if (value !== "") {
                setTooltipMessage((prev) => ({
                    ...prev,
                    [key]: "Only 0, 1, 00, 01, 10, or 11 allowed",
                }));
            }
        }
    };

    // Update handleConfirm function
    const handleConfirm = () => {
        const newValidation = {};
        let allCorrect = true;

        // Check all blank cells
        blankCells.forEach((key) => {
            const [rowIndex, column] = key.split("-");
            const correctValue = transitionTable[rowIndex][column];
            const userAnswer = userAnswers[key];

            // Check if the cell is filled and correct
            const isCorrect = userAnswer && userAnswer === correctValue;
            newValidation[key] = isCorrect;

            // If any blank cell is empty or incorrect, allCorrect should be false
            if (!isCorrect) {
                allCorrect = false;
            }
        });

        setCellValidation(newValidation);
        setIsTableComplete(allCorrect);
    };

    // Update shouldBeBlank function to use the stored positions
    const shouldBeBlank = (rowIndex, column) => {
        return blankCells.has(`${rowIndex}-${column}`);
    };

    // Helper function to get cell className based on validation
    const getCellClassName = (rowIndex, column) => {
        const key = `${rowIndex}-${column}`;
        if (!cellValidation.hasOwnProperty(key)) return "table-input";
        return `table-input ${cellValidation[key] ? "correct" : "incorrect"}`;
    };

    // Add handlers for focus and blur
    const handleInputFocus = (rowIndex, column) => {
        setFocusedCell(`${rowIndex}-${column}`);
    };

    const handleInputBlur = () => {
        setFocusedCell(null);
    };

    // Update renderCell to disable correct inputs
    const renderCell = (row, rowIndex, column, value) => {
        const key = `${rowIndex}-${column}`;
        const isBlank = shouldBeBlank(rowIndex, column);
        const isCorrect = cellValidation[key];

        if (!isBlank) return value;

        return (
            <div className="input-container">
                <input
                    type="text"
                    maxLength={column === "nextState" ? 8 : 2}
                    value={userAnswers[key] || ""}
                    onChange={(e) =>
                        handleCellChange(rowIndex, column, e.target.value)
                    }
                    onFocus={() => handleInputFocus(rowIndex, column)}
                    onBlur={handleInputBlur}
                    className={getCellClassName(rowIndex, column)}
                    disabled={isCorrect} // Disable input if correct
                />
                {tooltipMessage[key] && focusedCell === key && (
                    <div className="input-tooltip">{tooltipMessage[key]}</div>
                )}
            </div>
        );
    };

    return (
        <div className="state-to-circuit-container">
            <header>
                <h1>
                    State <FontAwesomeIcon icon={faArrowRight} /> Circuit
                    Diagram
                </h1>
            </header>

            <div className="control-panel">
                <div>
                    <label>Diagram Type: </label>
                    <select
                        value={diagramType}
                        onChange={(e) => setDiagramType(e.target.value)}
                    >
                        <option value="Mealy">Mealy</option>
                        <option value="Moore">Moore</option>
                    </select>
                </div>

                <div>
                    <label>Flip-Flop Type: </label>
                    <select
                        value={flipFlopType}
                        onChange={(e) => setFlipFlopType(e.target.value)}
                    >
                        <option value="D">D Flip-Flop</option>
                        <option value="T">T Flip-Flop</option>
                        <option value="JK">JK Flip-Flop</option>
                    </select>
                </div>

                <div>
                    <label>Number of States: </label>
                    <select
                        value={numStates}
                        onChange={(e) => setNumStates(parseInt(e.target.value))}
                    >
                        {[...Array(6)].map((_, i) => (
                            <option key={i + 3} value={i + 3}>
                                {i + 3}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>Number of Inputs: </label>
                    <select
                        value={numInputs}
                        onChange={(e) => setNumInputs(parseInt(e.target.value))}
                    >
                        {[...Array(2)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {i + 1}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="button-group">
                    <button
                        onClick={handleGenerate}
                        className="generate-button"
                    >
                        Generate
                    </button>
                    <button
                        onClick={handleAutoGenerate}
                        className="auto-generate-button"
                    >
                        Auto-Generate
                    </button>
                </div>
            </div>

            <div className="diagram-table-container">
                <div className="diagram-section">
                    <StateDiagram
                        diagramType={diagramType}
                        flipFlopType={flipFlopType}
                        numStates={numStates}
                        numInputs={numInputs}
                        shouldGenerate={shouldGenerate}
                        onDiagramGenerated={handleDiagramGenerated}
                    />
                </div>

                {transitionTable.length > 0 && (
                    <div className="table-section">
                        <h2>State Transition Table</h2>
                        <table className="state-transition-table">
                            <thead>
                                <tr>
                                    <th>Present State</th>
                                    <th>Input</th>
                                    <th>Next State</th>
                                    <th>
                                        {diagramType === "Mealy"
                                            ? "Output"
                                            : "State Output"}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {transitionTable.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        <td>{row.presentState}</td>
                                        <td>
                                            {renderCell(
                                                row,
                                                rowIndex,
                                                "input",
                                                row.input
                                            )}
                                        </td>
                                        <td>
                                            {renderCell(
                                                row,
                                                rowIndex,
                                                "nextState",
                                                row.nextState
                                            )}
                                        </td>
                                        <td>
                                            {renderCell(
                                                row,
                                                rowIndex,
                                                "output",
                                                row.output
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="convert-button-container">
                            {isTableComplete ? (
                                <button
                                    onClick={handleConvert}
                                    className="convert-button"
                                >
                                    Convert to Circuit
                                </button>
                            ) : (
                                <button
                                    onClick={handleConfirm}
                                    className="confirm-button"
                                >
                                    Confirm
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {shouldConvert && (
                <STCConversion
                    diagramType={diagramType}
                    flipFlopType={flipFlopType}
                    transitionTable={transitionTable}
                />
            )}
        </div>
    );
};

export default StateToCircuit;
