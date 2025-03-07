//StateToCircuit.jsx

import React, { useState, useEffect } from "react";
import StateDiagram from "../components/StateDiagram";
import STCConversion from "../components/STCConversion";
import "../styles/StateToCircuit.css"; // Import your CSS file
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowRight,
    faCircleInfo,
    faGear,
    faTimes,
} from "@fortawesome/free-solid-svg-icons"; // Added faGear and faTimes icons

const StateToCircuit = () => {
    const [diagramType, setDiagramType] = useState("Mealy");
    const [flipFlopType, setFlipFlopType] = useState("D");
    const [numStates, setNumStates] = useState(3);
    const [numInputs, setNumInputs] = useState(1);

    // Add temporary configuration state variables
    const [tempDiagramType, setTempDiagramType] = useState("Mealy");
    const [tempFlipFlopType, setTempFlipFlopType] = useState("D");
    const [tempNumStates, setTempNumStates] = useState(3);
    const [tempNumInputs, setTempNumInputs] = useState(1);

    const [transitionTable, setTransitionTable] = useState([]);
    const [shouldGenerate, setShouldGenerate] = useState(false);
    const [shouldConvert, setShouldConvert] = useState(false);
    const [userAnswers, setUserAnswers] = useState({});
    const [cellValidation, setCellValidation] = useState({});
    const [isTableComplete, setIsTableComplete] = useState(false);
    const [tooltipMessage, setTooltipMessage] = useState({});
    const [blankCells, setBlankCells] = useState(new Set());
    const [focusedCell, setFocusedCell] = useState(null);
    const [showTableInfo, setShowTableInfo] = useState(false);
    const [showPaper, setShowPaper] = useState(false);
    const [hasGivenUp, setHasGivenUp] = useState({ transitionTable: false });
    const [incorrectAttempts, setIncorrectAttempts] = useState({
        transitionTable: 0,
    });
    // Add state for settings popup
    const [showSettings, setShowSettings] = useState(false);

    // Add click-outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                !event.target.closest(".info-button") &&
                !event.target.closest(".info-tooltip") &&
                !event.target.closest(".settings-button") &&
                !event.target.closest(".settings-popup")
            ) {
                setShowTableInfo(false);
                setShowSettings(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Ensure temporary config states are in sync with actual config states initially
    useEffect(() => {
        setTempDiagramType(diagramType);
        setTempFlipFlopType(flipFlopType);
        setTempNumStates(numStates);
        setTempNumInputs(numInputs);
    }, [diagramType, flipFlopType, numStates, numInputs]);

    // Add this code near the other useEffect hooks
    useEffect(() => {
        if (showPaper) {
            // Use setTimeout to ensure rendering has completed
            const timer = setTimeout(() => {
                const container = document.querySelector(
                    ".diagram-table-container"
                );
                const wrapper = document.querySelector(
                    ".diagram-table-wrapper"
                );

                if (container && wrapper) {
                    // Calculate the height based on the scale factor (0.65)
                    const scaledHeight = container.offsetHeight * 0.65;
                    wrapper.style.height = `${scaledHeight}px`;
                }
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [showPaper, transitionTable.length, shouldGenerate]);

    const handleGenerate = () => {
        // Apply the temporary configuration to the actual configuration
        setDiagramType(tempDiagramType);
        setFlipFlopType(tempFlipFlopType);
        setNumStates(tempNumStates);
        setNumInputs(tempNumInputs);

        setShowPaper(true);
        setShouldGenerate(true);
        setShouldConvert(false);
        // Reset states
        setUserAnswers({});
        setCellValidation({});
        setIsTableComplete(false);
        setTooltipMessage({});
        setBlankCells(new Set());
        setHasGivenUp({ transitionTable: false }); // Reset give up state
    };

    const handleAutoGenerate = () => {
        setShowPaper(true);

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

        // Update both the temporary and actual configuration
        setTempDiagramType(randomDiagramType);
        setTempFlipFlopType(randomFlipFlopType);
        setTempNumStates(randomNumStates);
        setTempNumInputs(randomNumInputs);

        // Also update the actual configuration
        setDiagramType(randomDiagramType);
        setFlipFlopType(randomFlipFlopType);
        setNumStates(randomNumStates);
        setNumInputs(randomNumInputs);

        // Reset all states
        setUserAnswers({});
        setCellValidation({});
        setIsTableComplete(false);
        setTooltipMessage({});
        setBlankCells(new Set());
        setHasGivenUp({ transitionTable: false }); // Reset give up state

        // Trigger the generation after updating state
        setTimeout(() => {
            setShouldGenerate(true);
            setShouldConvert(false);
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
            // For nextState dropdown, we accept values like "S0 (00)" format
            return /^S\d+\s\(\d+\)$/.test(value);
        } else if (column === "input") {
            // Accept valid input values from dropdown
            const validInputs = getInputOptions();
            return validInputs.includes(value);
        } else if (column === "output") {
            // Accept valid output values from dropdown
            const validOutputs = getOutputOptions();
            return validOutputs.includes(value);
        }
        return false;
    };

    // Update cell change handler
    const handleCellChange = (rowIndex, column, value) => {
        const key = `${rowIndex}-${column}`;

        // No need to capitalize for dropdown selections
        if (validateInput(value, column)) {
            setUserAnswers((prev) => ({
                ...prev,
                [key]: value,
            }));
        }

        // Tooltip message for dropdown selects are not as necessary
        const message =
            column === "nextState"
                ? "Select the next state"
                : column === "input"
                ? "Select the input value"
                : "Select the output value";
        setTooltipMessage((prev) => ({
            ...prev,
            [key]: message,
        }));
    };

    // Update handleConfirm function
    const handleConfirm = () => {
        const newValidation = {};
        let allCorrect = true;
        let hasIncorrect = false;

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
                hasIncorrect = true;
            }
        });

        setCellValidation(newValidation);
        setIsTableComplete(allCorrect);

        // Increment incorrect attempts counter if any answers are incorrect
        if (hasIncorrect) {
            setIncorrectAttempts((prev) => ({
                ...prev,
                transitionTable: prev.transitionTable + 1,
            }));
        }
    };

    // Add focus handler
    const handleInputFocus = (rowIndex, column) => {
        const key = `${rowIndex}-${column}`;
        setFocusedCell(key);

        // Set initial tooltip message when focusing
        const message =
            column === "nextState"
                ? "Format should be: S# (##) or S# (###) - e.g., S0 (00) or S0 (001)"
                : "Enter 0, 1, 00, 01, 10, or 11";
        setTooltipMessage((prev) => ({
            ...prev,
            [key]: message,
        }));
    };

    // Add a function to get active states
    const getActiveStates = () => {
        return Array.from({ length: numStates }, (_, i) => {
            const stateBits = Math.ceil(Math.log2(numStates));
            const binaryCode = i.toString(2).padStart(stateBits, "0");
            return `S${i} (${binaryCode})`;
        });
    };

    // Function to generate input options based on numInputs
    const getInputOptions = () => {
        if (numInputs === 1) {
            return ["0", "1"];
        } else {
            return ["00", "01", "10", "11"];
        }
    };

    // Function to generate output options (binary output options)
    const getOutputOptions = () => {
        // Both Mealy and Moore typically have binary outputs (0, 1)
        // For systems with more output bits, we can provide more options
        if (numInputs === 1) {
            // When there's only 1 input bit, we typically have 1 output bit
            return ["0", "1"];
        } else {
            // When there are 2 input bits, we could have up to 2 output bits
            return ["0", "1", "00", "01", "10", "11"];
        }
    };

    // Add handleGiveUp function near other handlers
    const handleGiveUp = () => {
        setHasGivenUp((prev) => ({
            ...prev,
            transitionTable: true,
        }));

        // Fill in only incorrect or missing answers
        const newAnswers = { ...userAnswers }; // Preserve existing answers
        blankCells.forEach((key) => {
            const [rowIndex, column] = key.split("-");
            // Only update if the answer is incorrect or missing
            if (!cellValidation[key]) {
                newAnswers[key] = transitionTable[rowIndex][column];
            }
        });
        setUserAnswers(newAnswers);
        // Don't clear validations - preserve correct answers' validation state
        setIsTableComplete(true);
    };

    // Update renderCell to include incorrect class
    const renderCell = (row, rowIndex, column, value) => {
        const key = `${rowIndex}-${column}`;
        const isBlank = blankCells.has(`${rowIndex}-${column}`);
        const isCorrect = cellValidation[key];
        const isGivenUp = hasGivenUp.transitionTable;
        const isIncorrect = cellValidation.hasOwnProperty(key) && !isCorrect;

        // Only show given-up state for cells that were not correct when give up was pressed
        const showGivenUp = isGivenUp && !isCorrect;

        if (!isBlank) return value;

        if (column === "nextState") {
            const activeStates = getActiveStates();
            return (
                <div className="input-container">
                    <select
                        value={userAnswers[key] || ""}
                        onChange={(e) =>
                            handleCellChange(rowIndex, column, e.target.value)
                        }
                        onFocus={() => setFocusedCell(null)}
                        onBlur={() => setFocusedCell(null)}
                        className={`table-input select ${
                            isCorrect ? "correct" : ""
                        } ${isIncorrect ? "incorrect" : ""} ${
                            showGivenUp ? "given-up" : ""
                        }`}
                        disabled={isCorrect || isGivenUp}
                    >
                        <option value=""></option>
                        {activeStates.map((state) => (
                            <option key={state} value={state}>
                                {state}
                            </option>
                        ))}
                    </select>
                </div>
            );
        } else if (column === "input") {
            const inputOptions = getInputOptions();
            return (
                <div className="input-container">
                    <select
                        value={userAnswers[key] || ""}
                        onChange={(e) =>
                            handleCellChange(rowIndex, column, e.target.value)
                        }
                        onFocus={() => setFocusedCell(null)}
                        onBlur={() => setFocusedCell(null)}
                        className={`table-input select ${
                            isCorrect ? "correct" : ""
                        } ${isIncorrect ? "incorrect" : ""} ${
                            showGivenUp ? "given-up" : ""
                        }`}
                        disabled={isCorrect || isGivenUp}
                    >
                        <option value=""></option>
                        {inputOptions.map((input) => (
                            <option key={input} value={input}>
                                {input}
                            </option>
                        ))}
                    </select>
                </div>
            );
        } else if (column === "output") {
            const outputOptions = getOutputOptions();
            return (
                <div className="input-container">
                    <select
                        value={userAnswers[key] || ""}
                        onChange={(e) =>
                            handleCellChange(rowIndex, column, e.target.value)
                        }
                        onFocus={() => setFocusedCell(null)}
                        onBlur={() => setFocusedCell(null)}
                        className={`table-input select ${
                            isCorrect ? "correct" : ""
                        } ${isIncorrect ? "incorrect" : ""} ${
                            showGivenUp ? "given-up" : ""
                        }`}
                        disabled={isCorrect || isGivenUp}
                    >
                        <option value=""></option>
                        {outputOptions.map((output) => (
                            <option key={output} value={output}>
                                {output}
                            </option>
                        ))}
                    </select>
                </div>
            );
        }

        return (
            <div className="input-container">
                <input
                    type="text"
                    maxLength={2}
                    value={userAnswers[key] || ""}
                    onChange={(e) =>
                        handleCellChange(rowIndex, column, e.target.value)
                    }
                    onFocus={() => handleInputFocus(rowIndex, column)}
                    onBlur={() => setFocusedCell(null)}
                    className={`table-input ${isCorrect ? "correct" : ""} ${
                        isIncorrect ? "incorrect" : ""
                    } ${showGivenUp ? "given-up" : ""}`}
                    disabled={isCorrect || isGivenUp}
                />
                {focusedCell === key && (
                    <div className="input-tooltip">{tooltipMessage[key]}</div>
                )}
            </div>
        );
    };

    // Toggle settings popup
    const toggleSettings = () => {
        setShowSettings(!showSettings);
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
                        value={tempDiagramType}
                        onChange={(e) => setTempDiagramType(e.target.value)}
                    >
                        <option value="Mealy">Mealy</option>
                        <option value="Moore">Moore</option>
                    </select>
                </div>

                <div>
                    <label>Flip-Flop Type: </label>
                    <select
                        value={tempFlipFlopType}
                        onChange={(e) => setTempFlipFlopType(e.target.value)}
                    >
                        <option value="D">D Flip-Flop</option>
                        <option value="T">T Flip-Flop</option>
                        <option value="JK">JK Flip-Flop</option>
                    </select>
                </div>

                <div>
                    <label>Number of States: </label>
                    <select
                        value={tempNumStates}
                        onChange={(e) =>
                            setTempNumStates(parseInt(e.target.value))
                        }
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
                        value={tempNumInputs}
                        onChange={(e) =>
                            setTempNumInputs(parseInt(e.target.value))
                        }
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
                    <button
                        onClick={toggleSettings}
                        className="settings-button"
                    >
                        <FontAwesomeIcon icon={faGear} />
                    </button>
                </div>
            </div>

            {/* Settings Popup */}
            {showSettings && (
                <div
                    className="settings-popup-overlay"
                    onClick={toggleSettings}
                >
                    <div
                        className="settings-popup"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="settings-popup-header">
                            <h2>Settings</h2>
                            <button
                                className="close-button"
                                onClick={toggleSettings}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <div className="settings-popup-content">
                            <p>
                                Configure additional settings for the
                                application here.
                            </p>
                            {/* Add settings options here */}
                        </div>
                    </div>
                </div>
            )}

            {showPaper && (
                <div className="diagram-table-wrapper">
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
                                <div className="button-container">
                                    <button
                                        className="info-button"
                                        onClick={() =>
                                            setShowTableInfo(!showTableInfo)
                                        }
                                    >
                                        <FontAwesomeIcon icon={faCircleInfo} />
                                    </button>
                                    <button
                                        className="give-up-button"
                                        onClick={handleGiveUp}
                                        disabled={
                                            hasGivenUp.transitionTable ||
                                            isTableComplete ||
                                            incorrectAttempts.transitionTable <
                                                2
                                        }
                                    >
                                        Give Up
                                    </button>
                                </div>
                                {showTableInfo && (
                                    <div className="info-tooltip">
                                        <h2>State Encoding Information</h2>
                                        <p>
                                            States are encoded in binary format:
                                        </p>
                                        <ul>
                                            <li>
                                                S0 to S{numStates - 1} are
                                                represented using{" "}
                                                {Math.ceil(
                                                    Math.log2(numStates)
                                                )}{" "}
                                                bits
                                            </li>
                                            <li>
                                                Format: S# (binary) - e.g., S0
                                                (00), S1 (01), etc.
                                            </li>
                                            <li>
                                                Binary values increase
                                                sequentially with state numbers
                                            </li>
                                        </ul>
                                        <p>Fill in the blanks using:</p>
                                        <ul>
                                            <li>
                                                Input/Output: Binary digits
                                                (0,1) or pairs (00,01,10,11)
                                            </li>
                                            <li>
                                                Next State: State format S# (##)
                                                - e.g., S0 (00)
                                            </li>
                                        </ul>
                                    </div>
                                )}
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
                                        {transitionTable.map(
                                            (row, rowIndex) => (
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
                                            )
                                        )}
                                    </tbody>
                                </table>
                                <div className="convert-button-container">
                                    {isTableComplete ? (
                                        <button
                                            onClick={handleConvert}
                                            className="convert-button"
                                        >
                                            Next
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
                </div>
            )}

            {shouldConvert && (
                <STCConversion
                    diagramType={diagramType}
                    flipFlopType={flipFlopType}
                    transitionTable={transitionTable}
                    numInputs={numInputs}
                    cellValidation={cellValidation}
                    blankCells={blankCells}
                />
            )}
        </div>
    );
};

export default StateToCircuit;
