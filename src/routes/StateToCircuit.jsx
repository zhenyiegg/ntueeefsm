import React, { useState, useEffect, useRef } from "react";
import { dia, shapes } from "jointjs";
import "../styles/StateToCircuit.css"; // Import your CSS file

function StateToCircuit() {
    const [diagramType, setDiagramType] = useState("Mealy");
    const [flipFlopType, setFlipFlopType] = useState("D");
    const [numStates, setNumStates] = useState(7);
    const [numInputs, setNumInputs] = useState(1);
    const [transitionTable, setTransitionTable] = useState([]);
    const paperRef = useRef(null);
    const paperInstance = useRef(null); // Ref to hold the paper instance

    useEffect(() => {
        if (numStates && numInputs && paperRef.current) {
            const graph = new dia.Graph();

            let paperWidth = 1200;
            let paperHeight = 1000;

            paperInstance.current = new dia.Paper({
                el: paperRef.current,
                model: graph,
                width: paperWidth,
                height: paperHeight,
                gridSize: 10,
                drawGrid: true,
                interactive: false,
            });

            const states = [];
            const centerX = paperWidth / 2;
            const centerY = paperHeight / 2;
            const radius = Math.min(paperWidth, paperHeight) / 2 - 120; // Decreased to provide more space for loops

            for (let i = 0; i < numStates; i++) {
                const angle = ((2 * Math.PI) / numStates) * i;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);

                const state = new shapes.standard.Circle();
                state.position(x, y);
                state.resize(100, 100);
                state.attr({
                    body: {
                        fill: "#6FC3DF",
                    },
                    label: {
                        text: `S${i}`,
                        fill: "white",
                        fontSize: 16,
                    },
                });

                if (diagramType === "Moore") {
                    state.attr({
                        label: {
                            text: `S${i}\nOut=${i % 2}`,
                            fill: "white",
                            fontSize: 16,
                        },
                    });
                }

                state.addTo(graph);
                states.push(state);
            }

            const newTransitionTable = [];

            const getStateEncoding = (stateIndex, numStates) => {
                const numBits = Math.ceil(Math.log2(numStates));
                return stateIndex.toString(2).padStart(numBits, "0");
            };

            const getLoopVertices = (state, index) => {
                const loopOffset = 120; // Adjusted to ensure loops are drawn further from the state
                switch (index) {
                    case 0: // S0: Loop on the right side
                        return [
                            {
                                x: state.position().x + loopOffset,
                                y: state.position().y,
                            },
                            {
                                x: state.position().x + loopOffset + 30,
                                y: state.position().y + loopOffset,
                            },
                        ];
                    case 1:
                    case 2:
                        // S1, S2: Loop on the bottom side
                        // Conditional loop placement for 3, 4, or 5 states
                        if (
                            numStates === 3 ||
                            numStates === 4 ||
                            numStates === 5
                        ) {
                            return [
                                {
                                    x: state.position().x,
                                    y: state.position().y + loopOffset,
                                },
                                {
                                    x: state.position().x - loopOffset + 80,
                                    y: state.position().y + loopOffset - 50,
                                },
                            ];
                        } else {
                            // Default bottom loop for other state counts
                            return [
                                {
                                    x: state.position().x,
                                    y: state.position().y + loopOffset,
                                },
                                {
                                    x: state.position().x + loopOffset - 50,
                                    y: state.position().y + loopOffset + 30,
                                },
                            ];
                        }
                    case 3: // S3: Loop on the left side
                        return [
                            {
                                x: state.position().x - loopOffset,
                                y: state.position().y + 50,
                            },
                            {
                                x: state.position().x - loopOffset,
                                y: state.position().y + loopOffset,
                            },
                        ];
                    case 4: // S4: Loop on the left side
                        if (numStates === 5) {
                            return [
                                {
                                    x: state.position().x,
                                    y: state.position().y - loopOffset,
                                },
                                {
                                    x: state.position().x + loopOffset,
                                    y: state.position().y - loopOffset - 30,
                                },
                            ];
                        } else {
                            return [
                                {
                                    x: state.position().x - loopOffset,
                                    y: state.position().y,
                                },
                                {
                                    x: state.position().x - loopOffset - 30,
                                    y: state.position().y + loopOffset,
                                },
                            ];
                        }
                    case 5:
                    case 6:
                    case 7: // S5, S6, S7: Loop on the top side
                        return [
                            {
                                x: state.position().x,
                                y: state.position().y - loopOffset,
                            },
                            {
                                x: state.position().x + loopOffset,
                                y: state.position().y - loopOffset - 30,
                            },
                        ];
                    default:
                        return [];
                }
            };

            states.forEach((state, index) => {
                const stateEncoding = getStateEncoding(index, numStates);
                for (let j = 0; j < Math.pow(2, numInputs); j++) {
                    const binaryInput = j.toString(2).padStart(numInputs, "0");

                    const nextStateIndex = (index + j) % numStates;
                    const nextStateEncoding = getStateEncoding(
                        nextStateIndex,
                        numStates
                    );

                    const output =
                        diagramType === "Mealy"
                            ? `${index % 2}`
                            : `${nextStateIndex % 2}`;

                    const transition = new shapes.standard.Link();
                    transition.source(state);
                    transition.target(states[nextStateIndex]);

                    if (nextStateIndex === index) {
                        const loopVertices = getLoopVertices(state, index);
                        transition.vertices(loopVertices);
                        transition.connector("smooth");
                    }

                    transition.appendLabel({
                        attrs: {
                            text: {
                                text: `${binaryInput}/${output}`,
                                fill: "black",
                                fontSize: 24,
                            },
                            rect: {
                                fill: "white",
                                stroke: "black",
                                "stroke-width": 1,
                                rx: 5,
                                ry: 5,
                            },
                        },
                    });
                    transition.addTo(graph);

                    newTransitionTable.push({
                        presentState: `S${index} (${stateEncoding})`,
                        input: binaryInput,
                        nextState: `S${nextStateIndex} (${nextStateEncoding})`,
                        output: output,
                    });
                }
            });

            setTransitionTable(newTransitionTable);

            // Adjust the view to fit all content
            const fitToContent = () => {
                if (paperInstance.current) {
                    paperInstance.current.scaleContentToFit({
                        minScaleX: 0.5,
                        minScaleY: 0.5,
                        maxScaleX: 1.0,
                        maxScaleY: 1.0,
                        padding: 50,
                    });
                }
            };

            fitToContent(); // Call initially to fit the content
            window.addEventListener("resize", fitToContent);

            return () => {
                window.removeEventListener("resize", fitToContent);
            };
        }
    }, [numStates, numInputs, diagramType, flipFlopType]);

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
            </div>

            <div ref={paperRef} className="paper-container"></div>

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
        </div>
    );
}

export default StateToCircuit;
