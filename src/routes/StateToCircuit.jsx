import React, { useState } from "react";
import StateDiagram from "../components/StateDiagram";
import "../styles/StateToCircuit.css"; // Import your CSS file

const StateToCircuit = () => {
    const [diagramType, setDiagramType] = useState("Mealy");
    const [flipFlopType, setFlipFlopType] = useState("D");
    const [numStates, setNumStates] = useState(3);
    const [numInputs, setNumInputs] = useState(1);
    const [transitionTable, setTransitionTable] = useState([]);
    const [shouldGenerate, setShouldGenerate] = useState(false);

    const handleGenerate = () => {
        setShouldGenerate(true); // Trigger the generation
    };

    const handleDiagramGenerated = (table) => {
        setTransitionTable(table);
        setShouldGenerate(false); // Reset the generation flag after generating
    };

    return (
        <div className="state-to-circuit-container">
            <h1>{diagramType} State Diagram ➡️ Circuit</h1>

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
                        {[...Array(4)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {i + 1}
                            </option>
                        ))}
                    </select>
                </div>

                <button onClick={handleGenerate} className="generate-button">
                    Generate
                </button>
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
        </div>
    );
};

export default StateToCircuit;
