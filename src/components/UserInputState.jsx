import React, { useState, useEffect, useCallback } from "react";
import "../styles/StateToCircuit.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";

const UserInputState = ({
    diagramType,
    numStates,
    numInputs,
    isUserInputMode,
    onGenerateDiagram,
    onNext,
    resetFlag = 0,
}) => {
    const [transitionTable, setTransitionTable] = useState([]);
    const [userInputs, setUserInputs] = useState({});
    const [showInfo, setShowInfo] = useState(false);
    const [isValid, setIsValid] = useState(false);
    const [diagramGenerated, setDiagramGenerated] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

    // Function to get the state options for dropdowns
    const getStateOptions = useCallback(() => {
        return Array.from({ length: numStates }, (_, i) => {
            const stateBits = Math.ceil(Math.log2(numStates));
            const binaryCode = i.toString(2).padStart(stateBits, "0");
            return `S${i} (${binaryCode})`;
        });
    }, [numStates]);

    // Function to get input options based on number of inputs
    const getInputOptions = useCallback(() => {
        if (numInputs === 1) {
            return ["0", "1"];
        } else {
            return ["00", "01", "10", "11"];
        }
    }, [numInputs]);

    // Function to get output options
    const getOutputOptions = useCallback(() => {
        if (numInputs === 1) {
            return ["0", "1"];
        } else {
            return ["0", "1", "00", "01", "10", "11"];
        }
    }, [numInputs]);

    // Function to generate a basic transition table structure
    const generateTransitionTable = useCallback(() => {
        const newTable = [];
        const stateOptions = getStateOptions();
        const inputOptions = getInputOptions();

        // Generate one row for each state-input combination
        stateOptions.forEach((state, stateIndex) => {
            inputOptions.forEach((input, inputIndex) => {
                newTable.push({
                    presentState: state,
                    input: input,
                    nextState: "",
                    output: "",
                });
            });
        });

        setTransitionTable(newTable);
        setUserInputs({}); // Reset user inputs when table structure changes
        setDiagramGenerated(false); // Reset diagram generated state
    }, [getStateOptions, getInputOptions]);

    // Reset diagram generated state when component mounts or when parameters change
    useEffect(() => {
        setDiagramGenerated(false);
        setIsLocked(false);
    }, [numStates, numInputs, diagramType]);

    // Reset everything when resetFlag changes
    useEffect(() => {
        if (resetFlag > 0) {
            generateTransitionTable();
            setDiagramGenerated(false);
            setIsLocked(false);
            setShowInfo(false);
        }
    }, [resetFlag, generateTransitionTable]);

    // Generate the transition table based on configuration
    useEffect(() => {
        generateTransitionTable();
    }, [generateTransitionTable]);

    // Add a click-outside handler to close the info tooltip
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                showInfo &&
                !event.target.closest(".info-button") &&
                !event.target.closest(".info-tooltip")
            ) {
                setShowInfo(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showInfo]);

    // Check if all fields in the table are filled
    useEffect(() => {
        if (transitionTable.length === 0) {
            setIsValid(false);
            return;
        }

        // Check if all cells have values
        const allFilled = transitionTable.every((row, rowIndex) => {
            const nextStateKey = `${rowIndex}-nextState`;
            const outputKey = `${rowIndex}-output`;
            return userInputs[nextStateKey] && userInputs[outputKey];
        });

        setIsValid(allFilled);
    }, [userInputs, transitionTable]);

    // Handle cell change
    const handleCellChange = (rowIndex, column, value) => {
        const key = `${rowIndex}-${column}`;
        setUserInputs((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    // Handle generate diagram click
    const handleGenerateDiagram = () => {
        if (!isValid) {
            alert(
                "Please fill in all fields in the table before generating the diagram."
            );
            return;
        }

        // Create a complete transition table from user inputs
        const completedTable = transitionTable.map((row, rowIndex) => {
            const nextStateKey = `${rowIndex}-nextState`;
            const outputKey = `${rowIndex}-output`;

            return {
                presentState: row.presentState,
                input: row.input,
                nextState: userInputs[nextStateKey] || "",
                output: userInputs[outputKey] || "",
            };
        });

        // Pass the completed table to the parent component
        onGenerateDiagram(completedTable);

        // Mark diagram as generated
        setDiagramGenerated(true);
    };

    // Handle the Next button click
    const handleNext = () => {
        setIsLocked(true);
        onNext();
    };

    // Render a cell with appropriate dropdown
    const renderCell = (rowIndex, column) => {
        const key = `${rowIndex}-${column}`;
        const value = userInputs[key] || "";

        if (column === "nextState") {
            return (
                <div className="input-container">
                    <select
                        value={value}
                        onChange={(e) =>
                            handleCellChange(rowIndex, column, e.target.value)
                        }
                        className={`table-input select ${
                            isLocked ? "given-up" : ""
                        }`}
                        disabled={isLocked}
                    >
                        <option value=""></option>
                        {getStateOptions().map((state) => (
                            <option key={state} value={state}>
                                {state}
                            </option>
                        ))}
                    </select>
                </div>
            );
        } else if (column === "output") {
            return (
                <div className="input-container">
                    <select
                        value={value}
                        onChange={(e) =>
                            handleCellChange(rowIndex, column, e.target.value)
                        }
                        className={`table-input select ${
                            isLocked ? "given-up" : ""
                        }`}
                        disabled={isLocked}
                    >
                        <option value=""></option>
                        {getOutputOptions().map((output) => (
                            <option key={output} value={output}>
                                {output}
                            </option>
                        ))}
                    </select>
                </div>
            );
        }

        return null;
    };

    // Don't need to check isUserInputMode since component is conditionally rendered
    if (transitionTable.length === 0) {
        return null;
    }

    return (
        <div className="table-section">
            <div className="table-header-container">
                <h2>Custom State Transition Table</h2>
                <button
                    className="info-button"
                    onClick={() => setShowInfo(!showInfo)}
                    disabled={isLocked}
                >
                    <FontAwesomeIcon icon={faCircleInfo} />
                </button>
                {showInfo && !isLocked && (
                    <div className="info-tooltip">
                        <h3>Custom State Transition Table Help</h3>
                        <p>
                            In this mode, you can create your own state machine:
                        </p>
                        <ul>
                            <li>Select next states from the dropdown menus</li>
                            <li>Define outputs for each state transition</li>
                            <li>
                                Complete the table to create a valid state
                                machine
                            </li>
                            <li>
                                Use the Generate Diagram button to see your
                                state machine in action
                            </li>
                        </ul>
                    </div>
                )}
            </div>

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
                            <td>{row.input}</td>
                            <td>{renderCell(rowIndex, "nextState")}</td>
                            <td>{renderCell(rowIndex, "output")}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="generate-button-container">
                <button
                    className={`generate-diagram-button ${
                        !isValid ? "disabled" : ""
                    } ${diagramGenerated ? "generated" : ""} ${
                        isLocked ? "given-up" : ""
                    }`}
                    onClick={handleGenerateDiagram}
                    disabled={!isValid || isLocked}
                >
                    {diagramGenerated ? "Update Diagram" : "Generate Diagram"}
                </button>
                <button
                    className={`next-button ${
                        !diagramGenerated ? "disabled" : ""
                    } ${isLocked ? "given-up" : ""}`}
                    onClick={handleNext}
                    disabled={!diagramGenerated || isLocked}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default UserInputState;
