//StateToCircuit.jsx

import React, { useState, useEffect } from "react";
import StateDiagram from "../components/StateDiagram";
import STCConversion from "../components/STCConversion";
import "../styles/StateToCircuit.css"; // Import your CSS file
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowRight,
    faCircleInfo,
    faDownload,
} from "@fortawesome/free-solid-svg-icons"; // Added faDownload
import UserInputState from "../components/UserInputState";

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
    const [isUserInputMode, setIsUserInputMode] = useState(false);
    const [difficulty, setDifficulty] = useState("medium");

    // Add userInputTransitionTable state
    const [userInputTransitionTable, setUserInputTransitionTable] =
        useState(null);

    // Add resetFlag state to trigger resets in the UserInputState component
    const [userInputResetFlag, setUserInputResetFlag] = useState(0);

    // Add click-outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                !event.target.closest(".info-button") &&
                !event.target.closest(".info-tooltip")
            ) {
                setShowTableInfo(false);
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
    }, [showPaper, transitionTable?.length, shouldGenerate]);

    const handleGenerate = () => {
        // Set diagram parameters from temporary values
        setDiagramType(tempDiagramType);
        setFlipFlopType(tempFlipFlopType);
        setNumStates(tempNumStates);
        setNumInputs(tempNumInputs);

        // Show the paper after Generate is clicked
        setShowPaper(true);

        // Reset user answers and validation states
        setUserAnswers({});
        setCellValidation({});
        setBlankCells(new Set());
        setHasGivenUp({ transitionTable: false });
        setIncorrectAttempts({ transitionTable: 0 });

        // Make sure we're resetting the conversion state
        setShouldConvert(false);

        // Reset user input table and diagram if in User Input mode
        if (isUserInputMode) {
            setUserInputTransitionTable(null);
            // Increment resetFlag to trigger reset in UserInputState
            setUserInputResetFlag((prev) => prev + 1);
        }

        // Trigger the generation after updating state - don't clear the table first
        setTimeout(() => {
            setShouldGenerate(true);
        }, 0);
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

        // Make sure we're resetting the conversion state
        setShouldConvert(false);

        // Reset user input table and diagram if in User Input mode
        if (isUserInputMode) {
            setUserInputTransitionTable(null);
            // Increment resetFlag to trigger reset in UserInputState
            setUserInputResetFlag((prev) => prev + 1);
        }

        // Trigger the generation after updating state
        setTimeout(() => {
            setShouldGenerate(true);
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

        // Generate and store blank cell positions based on difficulty
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
                blankProbability = 1.0; // 100% chance of being blank (0% pre-filled)
                break;
            default:
                blankProbability = 0.5; // Default to medium
        }

        sortedTable.forEach((_, rowIndex) => {
            // For expert mode, make all cells blank
            if (difficulty === "expert") {
                ["input", "nextState", "output"].forEach((column) => {
                    newBlankCells.add(`${rowIndex}-${column}`);
                });
            } else {
                // For other difficulty levels, use probability-based approach
                // Track blanks in this row (only used for easy/medium)
                let blanksInRow = 0;

                // Try each column in random order
                const columns = ["input", "nextState", "output"].sort(
                    () => Math.random() - 0.5
                );

                for (const column of columns) {
                    // Only apply max blanks per row limit for easy and medium difficulties
                    if (difficulty !== "hard" && blanksInRow >= 2) break;

                    // Chance of being blank based on difficulty
                    if (Math.random() < blankProbability) {
                        newBlankCells.add(`${rowIndex}-${column}`);
                        blanksInRow++;
                    }
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

    const handleUserInputToggle = () => {
        // If turning on User Input Mode, reset everything to defaults
        if (!isUserInputMode) {
            // Reset table and states
            setTransitionTable([]);
            setShouldGenerate(false);
            setShouldConvert(false);
            setUserAnswers({});
            setCellValidation({});
            setIsTableComplete(false);
            setBlankCells(new Set());
            setHasGivenUp({ transitionTable: false });
            setIncorrectAttempts({ transitionTable: 0 });

            // Reset user input transition table
            setUserInputTransitionTable(null);

            // Increment resetFlag to trigger reset in UserInputState
            setUserInputResetFlag((prev) => prev + 1);

            // Don't show the paper/diagram yet - wait for Generate button click
            setShowPaper(false);
        } else {
            // When turning off User Input mode, reset to default state just like when toggling to User Input mode
            // Reset table and states
            setTransitionTable([]);
            setShouldGenerate(false);
            setShouldConvert(false);
            setUserAnswers({});
            setCellValidation({});
            setIsTableComplete(false);
            setBlankCells(new Set());
            setHasGivenUp({ transitionTable: false });
            setIncorrectAttempts({ transitionTable: 0 });

            // Reset user input transition table
            setUserInputTransitionTable(null);

            // Increment resetFlag to trigger reset in UserInputState
            setUserInputResetFlag((prev) => prev + 1);

            // Don't show the paper/diagram yet - wait for Generate button click
            setShowPaper(false);
        }

        setIsUserInputMode(!isUserInputMode);
    };

    // Handle function for when Generate Diagram is clicked in User Input mode
    const handleUserInputDiagram = (transitionTable) => {
        setUserInputTransitionTable(transitionTable);
        // Make sure the paper is shown
        setShowPaper(true);
    };

    // Handle function for when Next button is clicked in User Input mode
    const handleUserInputNext = () => {
        // Trigger the conversion process
        setShouldConvert(true);
    };

    // Function to generate standardized filename format
    const getStandardizedFilename = (fileType) => {
        const today = new Date();
        const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, "");

        const fsmType = diagramType.toLowerCase();
        const ffTypeMap = { D: "dff", T: "tff", JK: "jkff" };
        const ffType = ffTypeMap[flipFlopType] || flipFlopType.toLowerCase();

        // File type description
        const fileTypeDesc =
            {
                transitionTable: "TT",
                stateDiagram: "SD",
                all: "all",
            }[fileType] || fileType;

        return `fsm_${fsmType}_${ffType}_${numStates}_${numInputs}_${yyyymmdd}_${fileTypeDesc}`;
    };

    // Function to download state transition table as CSV
    const downloadStateTableCSV = () => {
        // Create CSV header with UTF-8 BOM
        let csvContent = "\uFEFF"; // Add UTF-8 BOM
        csvContent += "Present State,Input,Next State,Output\n";

        // Add each row to CSV
        transitionTable.forEach((row, rowIndex) => {
            // Get user input for blank cells or use original values
            const inputKey = `${rowIndex}-input`;
            const nextStateKey = `${rowIndex}-nextState`;
            const outputKey = `${rowIndex}-output`;

            const input = blankCells.has(inputKey)
                ? userAnswers[inputKey] || ""
                : row.input;
            const nextState = blankCells.has(nextStateKey)
                ? userAnswers[nextStateKey] || ""
                : row.nextState;
            const output = blankCells.has(outputKey)
                ? userAnswers[outputKey] || ""
                : row.output;

            // Create a CSV row and escape any commas in the data
            const csvRow = [row.presentState, input, nextState, output]
                .map((value) => `"${value}"`)
                .join(",");

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
            `${getStandardizedFilename("transitionTable")}.csv`
        );
        document.body.appendChild(link);

        // Trigger download and remove link
        link.click();
        document.body.removeChild(link);
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

                <div>
                    <label>Difficulty: </label>
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="difficulty-select"
                    >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                        <option value="expert">Expert</option>
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
                    <div className="user-input-toggle">
                        <span className="toggle-label">User Input</span>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={isUserInputMode}
                                onChange={handleUserInputToggle}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Only show paper when showPaper is true */}
            {showPaper && (
                <div className="diagram-table-wrapper">
                    <div className="diagram-table-container">
                        {/* Only show diagram in User Input mode if we have a transition table */}
                        {(!isUserInputMode ||
                            (isUserInputMode && userInputTransitionTable)) && (
                            <div className="diagram-section">
                                <StateDiagram
                                    diagramType={diagramType}
                                    flipFlopType={flipFlopType}
                                    numStates={numStates}
                                    numInputs={numInputs}
                                    shouldGenerate={shouldGenerate}
                                    onDiagramGenerated={handleDiagramGenerated}
                                    isUserInputMode={isUserInputMode}
                                    userInputTransitionTable={
                                        userInputTransitionTable
                                    }
                                />
                            </div>
                        )}

                        {/* Show original transition table if not in User Input Mode */}
                        {transitionTable.length > 0 && !isUserInputMode && (
                            <div className="table-section">
                                <div className="table-header-container">
                                    <h2>State Transition Table</h2>
                                    <div className="button-container">
                                        <button
                                            className="info-button"
                                            onClick={() =>
                                                setShowTableInfo(!showTableInfo)
                                            }
                                        >
                                            <FontAwesomeIcon
                                                icon={faCircleInfo}
                                            />
                                        </button>
                                        <button
                                            className="download-button"
                                            onClick={downloadStateTableCSV}
                                            title="Download as CSV"
                                            disabled={!isTableComplete}
                                        >
                                            <FontAwesomeIcon
                                                icon={faDownload}
                                            />
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

                        {/* Show User Input transition table if in User Input Mode */}
                        {isUserInputMode && (
                            <UserInputState
                                diagramType={diagramType}
                                numStates={numStates}
                                numInputs={numInputs}
                                isUserInputMode={isUserInputMode}
                                onGenerateDiagram={handleUserInputDiagram}
                                onNext={handleUserInputNext}
                                resetFlag={userInputResetFlag}
                            />
                        )}
                    </div>
                </div>
            )}

            {shouldConvert && (
                <STCConversion
                    diagramType={diagramType}
                    flipFlopType={flipFlopType}
                    transitionTable={
                        isUserInputMode
                            ? userInputTransitionTable
                            : transitionTable
                    }
                    numInputs={numInputs}
                    cellValidation={isUserInputMode ? {} : cellValidation}
                    blankCells={isUserInputMode ? new Set() : blankCells}
                    difficulty={difficulty}
                />
            )}
        </div>
    );
};

export default StateToCircuit;
