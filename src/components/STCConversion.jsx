// STCConversion.jsx

import React, { useEffect, useRef } from "react";
import { dia, shapes } from "jointjs";
import { simplifyBooleanFunction } from "./kmap"; // Import the K-map solver

const STCConversion = ({ diagramType, flipFlopType, transitionTable }) => {
    const paperRef = useRef(null);
    const paperInstance = useRef(null);

    useEffect(() => {
        const convertToCircuit = () => {
            const graph = new dia.Graph();
            const paperWidth = 1200;
            const paperHeight = 1000;

            paperInstance.current = new dia.Paper({
                el: paperRef.current,
                model: graph,
                width: paperWidth,
                height: paperHeight,
                gridSize: 10,
                drawGrid: true,
                interactive: false,
            });

            // Step 1: Encode the States
            const states = {};
            transitionTable.forEach((row) => {
                const presentStateMatch =
                    row.presentState.match(/S(\d+)\s\((\d+)\)/);
                const nextStateMatch = row.nextState.match(/S(\d+)\s\((\d+)\)/);

                if (presentStateMatch && nextStateMatch) {
                    const presentState = presentStateMatch[1];
                    const presentStateCode = presentStateMatch[2];
                    const nextState = nextStateMatch[1];
                    const nextStateCode = nextStateMatch[2];

                    states[`S${presentState}`] = presentStateCode;
                    states[`S${nextState}`] = nextStateCode;
                }
            });

            // Get number of bits required for state encoding
            const numStateBits = Math.max(
                ...Object.values(states).map((code) => code.length)
            );

            // Step 2: Determine Flip-Flop Inputs (Excitation Equations)
            // Prepare data structures
            const flipFlopInputs = {}; // { Q0: [...], Q1: [...], ... }
            for (let i = 0; i < numStateBits; i++) {
                flipFlopInputs[`Q${i}`] = [];
            }

            // Build excitation tables
            transitionTable.forEach((row) => {
                const input = row.input;
                const presentStateId = row.presentState.split(" ")[0];
                const nextStateId = row.nextState.split(" ")[0];
                const presentStateCode = states[presentStateId].padStart(
                    numStateBits,
                    "0"
                );
                const nextStateCode = states[nextStateId].padStart(
                    numStateBits,
                    "0"
                );

                for (let i = 0; i < numStateBits; i++) {
                    const currentBit = presentStateCode[i];
                    const nextBit = nextStateCode[i];

                    // Determine flip-flop input based on flip-flop type
                    if (flipFlopType === "D" || flipFlopType === "T") {
                        let flipFlopInputValue;
                        if (flipFlopType === "D") {
                            flipFlopInputValue = nextBit === "1" ? 1 : 0;
                        } else if (flipFlopType === "T") {
                            flipFlopInputValue = currentBit === nextBit ? 0 : 1;
                        }

                        flipFlopInputs[`Q${i}`].push({
                            presentStateCode,
                            input,
                            flipFlopInputValue,
                        });
                    } else if (flipFlopType === "JK") {
                        // For JK flip-flops, store J and K inputs separately
                        let J, K;
                        if (currentBit === "0" && nextBit === "0") {
                            J = 0;
                            K = "X";
                        } else if (currentBit === "0" && nextBit === "1") {
                            J = 1;
                            K = "X";
                        } else if (currentBit === "1" && nextBit === "0") {
                            J = "X";
                            K = 1;
                        } else {
                            J = "X";
                            K = 0;
                        }

                        flipFlopInputs[`Q${i}`].push({
                            presentStateCode,
                            input,
                            J,
                            K,
                        });
                    }
                }
            });

            // Step 3: Simplify Excitation Equations
            const simplifiedEquations = {};

            Object.keys(flipFlopInputs).forEach((flipFlop) => {
                const excitationTable = flipFlopInputs[flipFlop];

                if (flipFlopType === "D" || flipFlopType === "T") {
                    const minterms = [];
                    const numVariables =
                        excitationTable[0].presentStateCode.length +
                        excitationTable[0].input.length;

                    excitationTable.forEach((entry) => {
                        const variables = entry.presentStateCode + entry.input;
                        if (entry.flipFlopInputValue === 1) {
                            const mintermIndex = parseInt(variables, 2);
                            minterms.push(mintermIndex);
                        }
                    });

                    const simplifiedEquation = simplifyBooleanFunction(
                        minterms,
                        numVariables
                    );
                    simplifiedEquations[flipFlop] = simplifiedEquation;
                } else if (flipFlopType === "JK") {
                    // Simplify J input
                    const mintermsJ = [];
                    const numVariables =
                        excitationTable[0].presentStateCode.length +
                        excitationTable[0].input.length;

                    excitationTable.forEach((entry) => {
                        const variables = entry.presentStateCode + entry.input;
                        if (entry.J === 1) {
                            const mintermIndex = parseInt(variables, 2);
                            mintermsJ.push(mintermIndex);
                        }
                    });

                    const simplifiedEquationJ = simplifyBooleanFunction(
                        mintermsJ,
                        numVariables
                    );
                    simplifiedEquations[`${flipFlop}_J`] = simplifiedEquationJ;

                    // Simplify K input
                    const mintermsK = [];
                    excitationTable.forEach((entry) => {
                        const variables = entry.presentStateCode + entry.input;
                        if (entry.K === 1) {
                            const mintermIndex = parseInt(variables, 2);
                            mintermsK.push(mintermIndex);
                        }
                    });

                    const simplifiedEquationK = simplifyBooleanFunction(
                        mintermsK,
                        numVariables
                    );
                    simplifiedEquations[`${flipFlop}_K`] = simplifiedEquationK;
                }
            });

            // Step 4: Generate Circuit Diagram
            // Create flip-flops
            const flipFlopElements = {};
            let flipFlopY = 200;
            for (let i = 0; i < numStateBits; i++) {
                const flipFlopElement = new shapes.standard.Rectangle();
                flipFlopElement.position(600, flipFlopY);
                flipFlopElement.resize(100, 60);
                flipFlopElement.attr({
                    body: {
                        fill: "#9CDBA8",
                    },
                    label: {
                        text: `${flipFlopType} Flip-Flop\nQ${i}`,
                        fill: "black",
                        fontSize: 14,
                    },
                });
                flipFlopElement.addTo(graph);
                flipFlopElements[`Q${i}`] = flipFlopElement;
                flipFlopY += 150;
            }

            // Create combinational logic
            Object.keys(simplifiedEquations).forEach((key) => {
                const [flipFlop, jk] = key.split("_"); // For JK flip-flops
                const equation = simplifiedEquations[key];

                const logicGate = new shapes.standard.Circle();
                let yOffset = 0;
                if (flipFlopType === "JK") {
                    yOffset = jk === "J" ? -50 : 50;
                }

                logicGate.position(
                    400,
                    flipFlopElements[flipFlop].position().y + yOffset
                );
                logicGate.resize(60, 60);
                logicGate.attr({
                    body: {
                        fill: "#FFFBCC",
                    },
                    label: {
                        text: `Logic for ${key}\n${equation}`,
                        fill: "black",
                        fontSize: 12,
                    },
                });
                logicGate.addTo(graph);

                // Connect logic gate to flip-flop
                const link = new shapes.standard.Link();
                link.source(logicGate);
                link.target(flipFlopElements[flipFlop]);
                link.addTo(graph);
            });

            // Create input node
            const inputNode = new shapes.standard.Circle();
            inputNode.position(200, 200);
            inputNode.resize(60, 60);
            inputNode.attr({
                body: {
                    fill: "#A8DADC",
                },
                label: {
                    text: `Input\nI`,
                    fill: "black",
                    fontSize: 14,
                },
            });
            inputNode.addTo(graph);

            // Connect input node to logic gates
            Object.keys(simplifiedEquations).forEach((key) => {
                const logicGate = graph.getElements().find((el) => {
                    return (
                        el.attributes.type === "standard.Circle" &&
                        el.attr("label/text").includes(`Logic for ${key}`)
                    );
                });

                const link = new shapes.standard.Link();
                link.source(inputNode);
                link.target(logicGate);
                link.attr({
                    line: {
                        strokeDasharray: "5,5",
                    },
                });
                link.addTo(graph);
            });

            // Step 5: Add Outputs (if any)
            if (diagramType === "Moore") {
                const outputNode = new shapes.standard.Circle();
                outputNode.position(800, 200);
                outputNode.resize(60, 60);
                outputNode.attr({
                    body: {
                        fill: "#F4A261",
                    },
                    label: {
                        text: `Output\nO`,
                        fill: "black",
                        fontSize: 14,
                    },
                });
                outputNode.addTo(graph);

                // Connect flip-flops to output node
                Object.keys(flipFlopElements).forEach((flipFlop) => {
                    const link = new shapes.standard.Link();
                    link.source(flipFlopElements[flipFlop]);
                    link.target(outputNode);
                    link.attr({
                        line: {
                            strokeDasharray: "5,5",
                        },
                    });
                    link.addTo(graph);
                });
            } else {
                // For Mealy machine, outputs are functions of current state and input
                // Implement the logic accordingly
                // For simplicity, we'll create a placeholder output node
                const outputNode = new shapes.standard.Circle();
                outputNode.position(800, 200);
                outputNode.resize(60, 60);
                outputNode.attr({
                    body: {
                        fill: "#F4A261",
                    },
                    label: {
                        text: `Output\nO`,
                        fill: "black",
                        fontSize: 14,
                    },
                });
                outputNode.addTo(graph);

                // Implement output logic based on current state and input
                // This requires additional logic gates
            }

            // Scale the content to fit within the paper
            paperInstance.current.scaleContentToFit({
                padding: 20,
                minScaleX: 0.5,
                minScaleY: 0.5,
                maxScaleX: 1,
                maxScaleY: 1,
            });
        };

        if (transitionTable.length > 0 && paperRef.current) {
            convertToCircuit();
        }
    }, [diagramType, flipFlopType, transitionTable]);

    return (
        <div>
            <h2>Generated Circuit Diagram</h2>
            <div
                ref={paperRef}
                style={{
                    width: "1200px",
                    height: "800px",
                    border: "1px solid black",
                }}
            ></div>
        </div>
    );
};

export default STCConversion;
