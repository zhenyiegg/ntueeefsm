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

            const calculateNextState = (currentState, input) => {
                switch (flipFlopType) {
                    case "D":
                        return input; // D Flip-Flop directly follows the input
                    case "T":
                        return currentState === input ? 0 : 1; // T Flip-Flop toggles if input is 1
                    case "JK":
                        if (input === 0) return currentState; // No change
                        return currentState === 1 ? 0 : 1; // Toggle state
                    default:
                        return input;
                }
            };

            const getLoopVertices = (state, index) => {
                const loopOffset = 120;
                switch (index) {
                    case 0:
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
                    // Add other cases here as needed
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
