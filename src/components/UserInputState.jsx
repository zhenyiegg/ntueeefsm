import React, { useState, useEffect, useCallback } from "react";
import "../styles/StateToCircuit.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo, faDownload } from "@fortawesome/free-solid-svg-icons";

const UserInputState = ({
    diagramType,
    numStates,
    numInputs,
    isUserInputMode,
    onGenerateDiagram,
    onNext,
    resetFlag = 0,
    flipFlopType = "D",
}) => {
    const [transitionTable, setTransitionTable] = useState([]);
    const [userInputs, setUserInputs] = useState({});
    const [showInfo, setShowInfo] = useState(false);
    const [isValid, setIsValid] = useState(false);
    const [diagramGenerated, setDiagramGenerated] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [validationErrors, setValidationErrors] = useState(null);

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
        setValidationErrors(null); // Reset validation errors
    }, [getStateOptions, getInputOptions]);

    // Reset diagram generated state when component mounts or when parameters change
    useEffect(() => {
        setDiagramGenerated(false);
        setIsLocked(false);
        setValidationErrors(null);
    }, [numStates, numInputs, diagramType]);

    // Reset everything when resetFlag changes
    useEffect(() => {
        if (resetFlag > 0) {
            generateTransitionTable();
            setDiagramGenerated(false);
            setIsLocked(false);
            setShowInfo(false);
            setValidationErrors(null);
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

        // If this is a Moore machine and we're changing an output,
        // update all outputs for the same present state
        if (diagramType === "Moore" && column === "output" && value) {
            const updatedInputs = { ...userInputs };

            // Get the present state of this row
            const currentState = transitionTable[rowIndex].presentState;

            // Find all rows with the same present state and update their outputs
            transitionTable.forEach((row, idx) => {
                if (row.presentState === currentState) {
                    const outputKey = `${idx}-output`;
                    updatedInputs[outputKey] = value;
                }
            });

            setUserInputs(updatedInputs);
        } else {
            // Standard behavior for all other cases
            setUserInputs((prev) => ({
                ...prev,
                [key]: value,
            }));
        }

        // Clear validation errors when user changes inputs
        if (validationErrors) {
            setValidationErrors(null);
        }
    };

    // Validate Moore machine outputs
    const validateMooreOutputs = () => {
        if (diagramType !== "Moore") return true;

        // Group outputs by present state to check consistency
        const stateOutputs = {};
        let validationResult = { valid: true };

        for (let rowIndex = 0; rowIndex < transitionTable.length; rowIndex++) {
            const row = transitionTable[rowIndex];
            const outputKey = `${rowIndex}-output`;
            const outputValue = userInputs[outputKey] || "";
            const presentState = row.presentState;

            if (!stateOutputs[presentState]) {
                stateOutputs[presentState] = outputValue;
            } else if (stateOutputs[presentState] !== outputValue) {
                validationResult = {
                    valid: false,
                    state: presentState,
                    outputs: [stateOutputs[presentState], outputValue],
                };
                break; // Exit the loop once we find an inconsistency
            }
        }

        return validationResult;
    };

    // Handle generate diagram click
    const handleGenerateDiagram = () => {
        if (!isValid) {
            alert(
                "Please fill in all fields in the table before generating the diagram."
            );
            return;
        }

        // For Moore machines, validate that outputs are consistent for each state
        if (diagramType === "Moore") {
            const mooreValidation = validateMooreOutputs();
            if (!mooreValidation.valid) {
                setValidationErrors({
                    message: `Error: Moore machines must have the same output for all inputs to the same state. 
                    State ${
                        mooreValidation.state
                    } has different outputs: ${mooreValidation.outputs.join(
                        ", "
                    )}.`,
                });
                return;
            }
        }

        // Clear any previous validation errors
        setValidationErrors(null);

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

    // Function to generate standardized filename format
    const getStandardizedFilename = () => {
        const today = new Date();
        const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, "");

        const fsmType = diagramType.toLowerCase();
        const ffTypeMap = { D: "dff", T: "tff", JK: "jkff" };
        const ffType = ffTypeMap[flipFlopType] || "dff"; // Use the provided flipFlopType

        return `fsm_${fsmType}_${ffType}_${numStates}_${numInputs}_${yyyymmdd}_TT`;
    };

    // Function to handle CSV download
    const downloadCSV = () => {
        // Create CSV header with UTF-8 BOM
        let csvContent = "\uFEFF"; // Add UTF-8 BOM
        csvContent += "Present State,Input,Next State,Output\n";

        // Add each row to CSV
        transitionTable.forEach((row) => {
            const nextStateKey = `${transitionTable.indexOf(row)}-nextState`;
            const outputKey = `${transitionTable.indexOf(row)}-output`;
            const nextState = userInputs[nextStateKey] || "";
            const output = userInputs[outputKey] || "";

            // Create a CSV row and escape any commas in the data
            const csvRow = [row.presentState, row.input, nextState, output]
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
        link.setAttribute("download", `${getStandardizedFilename()}.csv`);
        document.body.appendChild(link);

        // Trigger download and remove link
        link.click();
        document.body.removeChild(link);
    };

    // Don't need to check isUserInputMode since component is conditionally rendered
    if (transitionTable.length === 0) {
        return null;
    }

    return (
        <div className="table-section">
            <div className="table-header-container">
                <h2>Custom State Transition Table</h2>
                <div className="button-container">
                    <button
                        className="info-button"
                        onClick={() => setShowInfo(!showInfo)}
                        disabled={isLocked}
                    >
                        <FontAwesomeIcon icon={faCircleInfo} />
                    </button>
                    <button
                        className="download-button"
                        onClick={() => downloadCSV()}
                        disabled={!diagramGenerated || isLocked}
                        title="Download as CSV"
                    >
                        <FontAwesomeIcon icon={faDownload} />
                    </button>
                </div>
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

                        {diagramType === "Moore" && (
                            <div className="moore-note">
                                <p>
                                    <strong>
                                        Important Note for Moore Machines:
                                    </strong>
                                </p>
                                <p>
                                    In Moore machines, the output depends only
                                    on the present state, not on the input. This
                                    means you must use the same output value for
                                    all rows with the same present state.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Display validation errors */}
            {validationErrors && (
                <div className="validation-error">
                    {validationErrors.message}
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
