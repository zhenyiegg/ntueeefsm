import React, { useEffect, useRef } from "react";
import { dia, shapes } from "jointjs";

const StateDiagram = ({
    diagramType,
    flipFlopType,
    numStates,
    numInputs,
    shouldGenerate,
    onDiagramGenerated,
}) => {
    const paperRef = useRef(null);
    const paperInstance = useRef(null); // Ref to hold the paper instance

    useEffect(() => {
        if (shouldGenerate && numStates && numInputs && paperRef.current) {
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
            const radius = Math.min(paperWidth, paperHeight) / 2 - 120;

            // State creation and placement
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
                        text: `S${i}`, // This ensures only the state name appears.
                        fill: "white",
                        fontSize: 16,
                    },
                });

                // Only add output label if it's a Moore machine
                if (diagramType === "Moore") {
                    state.attr({
                        label: {
                            text: `S${i}\nOut=${i % 2}`, // This will show only for Moore.
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

            const calculateNextState = (currentState, input) => {
                let nextState;
                switch (flipFlopType) {
                    case "D":
                        nextState = input; // D Flip-Flop directly follows the input
                        break;
                    case "T":
                        nextState = currentState === input ? 0 : 1; // T Flip-Flop toggles if input is 1
                        break;
                    case "JK":
                        if (input === 0) nextState = currentState; // No change
                        else nextState = currentState === 1 ? 0 : 1; // Toggle state
                        break;
                    default:
                        nextState = input;
                        break;
                }
                return nextState % 2; // Ensure the next state is always binary
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

                    const currentState = parseInt(stateEncoding, 2);
                    const nextState = calculateNextState(
                        currentState,
                        parseInt(binaryInput, 2)
                    );
                    const nextStateIndex = nextState % numStates;
                    const nextStateEncoding = getStateEncoding(
                        nextStateIndex,
                        numStates
                    );

                    const output =
                        diagramType === "Mealy" ? `${nextState}` : ""; // No output on transitions in Moore

                    const transition = new shapes.standard.Link();
                    transition.source(state);
                    transition.target(states[nextStateIndex]);

                    if (index !== nextStateIndex) {
                        const offsetAmount = 60;
                        const offsetDirection = j % 2 === 0 ? 1 : -1;
                        transition.connector("smooth");
                        transition.vertices([
                            {
                                x:
                                    (state.position().x +
                                        states[nextStateIndex].position().x) /
                                        2 +
                                    offsetAmount * offsetDirection,
                                y:
                                    (state.position().y +
                                        states[nextStateIndex].position().y) /
                                    2,
                            },
                        ]);
                    }

                    if (nextStateIndex === index) {
                        const loopVertices = getLoopVertices(state, index);
                        transition.vertices(loopVertices);
                        transition.connector("smooth");
                    }

                    transition.appendLabel({
                        attrs: {
                            text: {
                                text: `${binaryInput}${
                                    output ? `/${output}` : ""
                                }`,
                                fill: "black",
                                fontSize: 28,
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

            onDiagramGenerated(newTransitionTable);

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
    }, [
        shouldGenerate,
        numStates,
        numInputs,
        diagramType,
        flipFlopType,
        onDiagramGenerated,
    ]);

    return <div ref={paperRef} className="paper-container"></div>;
};

export default StateDiagram;
