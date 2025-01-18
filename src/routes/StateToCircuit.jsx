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
        setShouldGenerate(false); // Reset the generation flag after generating
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

            <StateDiagram
                diagramType={diagramType}
                flipFlopType={flipFlopType}
                numStates={numStates}
                numInputs={numInputs}
                shouldGenerate={shouldGenerate}
                onDiagramGenerated={handleDiagramGenerated}
            />

            {transitionTable.length > 0 && (
                <div style={{ marginTop: "20px" }}>
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
                            {transitionTable.map((row, i) => (
                                <tr key={i}>
                                    <td>{row.presentState}</td>
                                    <td>{row.input}</td>
                                    <td>{row.nextState}</td>
                                    <td>{row.output}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div>
                {/* Add Convert Button */}
                {transitionTable.length > 0 && (
                    <button onClick={handleConvert} className="convert-button">
                        Convert to Circuit
                    </button>
                )}

                {/* Conversion Logic */}
                {shouldConvert && (
                    <STCConversion
                        diagramType={diagramType}
                        flipFlopType={flipFlopType}
                        transitionTable={transitionTable}
                    />
                )}
            </div>
        </div>
    );
};

export default StateToCircuit;
