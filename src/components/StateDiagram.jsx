import React, { useCallback, useEffect, useRef, useState } from "react";
import { dia, shapes } from "jointjs";
import Modal from "react-modal";
import "../styles/StateDiagram.css";

Modal.setAppElement("#root");

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

    const [selectedTransition, setSelectedTransition] = useState(null);

    // State for managing tooltip visibility and content
    const [tooltip, setTooltip] = useState({
        visible: false,
        content: "",
        position: { x: 0, y: 0 },
    });

    // Ref to handle the tooltip timeout
    const tooltipTimeout = useRef(null);

    // Define getLoopVertices here, at the top level
    const getLoopVertices = useCallback((state, stateNumber) => {
        const loopOffset = 120; // Adjusted to ensure loops are drawn further from the state
        switch (stateNumber) {
            case 0:
                return [
                    {
                        x: state.position().x + loopOffset + 60,
                        y: state.position().y,
                    },
                    {
                        x: state.position().x + loopOffset + 30,
                        y: state.position().y + loopOffset,
                    },
                ];
            case 3:
            case 6:
                // S3, S6: Loop on the bottom side
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
            case 1:
            case 4:
                // S1, S4: Loop on the left side
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
            case 7:
                // S7: Loop on the top side
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
            case 2:
                return [
                    {
                        x: state.position().x,
                        y: state.position().y - loopOffset + 30,
                    },
                    {
                        x: state.position().x + loopOffset - 40,
                        y: state.position().y - loopOffset,
                    },
                ];
            case 5:
                // S5: Loop on the right side
                return [
                    {
                        x: state.position().x + loopOffset,
                        y: state.position().y,
                    },
                    {
                        x: state.position().x + loopOffset + 30,
                        y: state.position().y - loopOffset,
                    },
                ];
            default:
                return [];
        }
    }, []);

    useEffect(() => {
        if (shouldGenerate && numStates && numInputs && paperRef.current) {
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

            const TOTAL_STATES = 8; // Always create 8 states
            const states = [];
            const centerX = paperWidth / 2;
            const centerY = paperHeight / 2;
            const radius = Math.min(paperWidth, paperHeight) / 2 - 120;

            const stateOrder = [0, 3, 6, 1, 4, 7, 2, 5]; // Custom arrangement order

            // State creation and placement
            for (let i = 0; i < TOTAL_STATES; i++) {
                const stateNumber = stateOrder[i];
                const stateId = `S${stateNumber}`; // Assign labeled IDs based on stateOrder

                const angle = ((2 * Math.PI) / TOTAL_STATES) * i;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);

                const state = new shapes.standard.Circle();
                state.position(x, y);
                state.resize(100, 100);

                // Determine if the state is active or inactive
                const isActive = stateNumber < numStates;

                // Assign the unique stateId to the element's data
                state.set("stateId", stateId);
                state.set("stateNumber", stateNumber); // Store stateNumber for easy access

                state.attr({
                    body: {
                        fill: isActive ? "#6FC3DF" : "#CCCCCC", // Active: blue, Inactive: gray
                        opacity: isActive ? 1 : 0.1, // Fully opaque for active states, transparent for inactive
                        "pointer-events": isActive ? "visiblePainted" : "none",
                    },
                    label: {
                        text: isActive ? `${stateId}` : "", // Display the stateId as the label
                        fill: isActive ? "white" : "#666666",
                        fontSize: 16,
                    },
                });

                // Add output label if it's a Moore machine and the state is active
                if (diagramType === "Moore" && isActive) {
                    state.attr({
                        label: {
                            text: `${stateId}\nOut=${stateNumber % 2}`, // Moore output based on state number
                            fill: "white",
                            fontSize: 16,
                        },
                    });
                }

                state.addTo(graph);
                states.push(state);
            }

            const activeStates = states.filter((state) => {
                const stateNumber = state.get("stateNumber");
                return stateNumber < numStates;
            });

            const newTransitionTable = [];

            const getStateEncoding = (stateNumber, numStates) => {
                const numBits = Math.ceil(Math.log2(numStates));
                return stateNumber.toString(2).padStart(numBits, "0");
            };

            const calculateNextState = (currentStateNumber, inputValue) => {
                let nextStateNumber;
                switch (flipFlopType) {
                    case "D":
                        nextStateNumber = inputValue; // D Flip-Flop directly follows the input
                        break;
                    case "T":
                        nextStateNumber =
                            currentStateNumber === inputValue ? 0 : 1; // T Flip-Flop toggles if input is 1
                        break;
                    case "JK":
                        if (inputValue === 0)
                            nextStateNumber = currentStateNumber; // No change
                        else nextStateNumber = currentStateNumber === 1 ? 0 : 1; // Toggle state
                        break;
                    default:
                        nextStateNumber = inputValue;
                        break;
                }
                return nextStateNumber % numStates; // Ensure the next state is within active states
            };

            const transitionsBetweenStates = {};
            const totalTransitionsBetweenStates = {};

            activeStates.forEach((state) => {
                const currentStateNumber = state.get("stateNumber");
                const stateEncoding = getStateEncoding(
                    currentStateNumber,
                    numStates
                );
                const currentStateId = state.get("stateId"); // e.g., 'S0', 'S1', 'S2'

                for (let j = 0; j < Math.pow(2, numInputs); j++) {
                    const binaryInput = j.toString(2).padStart(numInputs, "0");
                    const inputValue = parseInt(binaryInput, 2);

                    const nextStateNumber = calculateNextState(
                        currentStateNumber,
                        inputValue
                    );

                    // Ensure the next state number is within active states
                    const nextState = activeStates.find(
                        (s) => s.get("stateNumber") === nextStateNumber
                    );

                    if (!nextState) continue; // Skip if the next state is not active

                    const nextStateId = nextState.get("stateId");
                    const nextStateEncoding = getStateEncoding(
                        nextStateNumber,
                        numStates
                    );

                    const outputValue =
                        diagramType === "Mealy"
                            ? nextStateNumber
                            : currentStateNumber % 2; // Moore output based on current state

                    // Convert output to binary if it's 2 or higher
                    const output =
                        outputValue >= 2
                            ? outputValue.toString(2)
                            : `${outputValue}`;

                    const transitionKey = `${currentStateId}->${nextStateId}`;
                    const transitionPairKey = [currentStateId, nextStateId]
                        .sort()
                        .join("-");

                    // Initialize or increment the total count of transitions between the states
                    if (!totalTransitionsBetweenStates[transitionPairKey]) {
                        totalTransitionsBetweenStates[transitionPairKey] = 0;
                    }
                    totalTransitionsBetweenStates[transitionPairKey]++;

                    // Assign an index to the current transition
                    if (!transitionsBetweenStates[transitionKey]) {
                        transitionsBetweenStates[transitionKey] = [];
                    }
                    transitionsBetweenStates[transitionKey].push({
                        input: binaryInput,
                        output,
                        index: totalTransitionsBetweenStates[transitionPairKey], // 1-based index
                    });

                    const transitionIndex =
                        transitionsBetweenStates[transitionKey].length;
                    const totalTransitions =
                        totalTransitionsBetweenStates[transitionPairKey];

                    // Create transition link
                    const transition = new shapes.standard.Link();
                    transition.source(state);
                    transition.target(nextState);

                    // Adjust transition curvature
                    if (currentStateId !== nextStateId) {
                        const dx = nextState.position().x - state.position().x;
                        const dy = nextState.position().y - state.position().y;
                        const baseAngle = Math.atan2(dy, dx);

                        const angleIncrement =
                            Math.PI / 1 / (totalTransitions - 1 || 1); // Adjust the denominator as needed
                        const angleOffset =
                            angleIncrement *
                            (transitionIndex - 1 - (totalTransitions - 1) / 2);

                        const radius = 100; // Adjust as needed for curvature
                        const adjustedAngle =
                            baseAngle + Math.PI / 2 + angleOffset;

                        const midX =
                            (state.position().x + nextState.position().x) / 2;
                        const midY =
                            (state.position().y + nextState.position().y) / 2;

                        const offsetX = midX + radius * Math.cos(adjustedAngle);
                        const offsetY = midY + radius * Math.sin(adjustedAngle);

                        transition.vertices([{ x: offsetX, y: offsetY }]);
                        transition.connector("smooth");

                        // Log curvature adjustment details
                        // console.log(
                        //     `Creating transition from ${currentStateId} to ${nextStateId} with input ${binaryInput} and output ${output}. Angle offset: ${angleOffset}, Position offset: (${offsetX}, ${offsetY})`
                        // );
                    } else {
                        // Handle self-loop transitions
                        const loopVertices = getLoopVertices(
                            state,
                            currentStateNumber
                        );
                        transition.vertices(loopVertices);
                        transition.connector("smooth");

                        // Log self-loop creation
                        // console.log(
                        //     `Creating self-loop on ${currentStateId} with input ${binaryInput} and output ${output}`
                        // );
                    }

                    // Add label to transition
                    transition.appendLabel({
                        attrs: {
                            text: {
                                text: `${binaryInput}${
                                    diagramType === "Mealy" ? `/${output}` : ""
                                }`, // Only show output in Mealy machine
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

                    transition.set("transitionData", {
                        fromState: currentStateId,
                        toState: nextStateId,
                        input: binaryInput,
                        output: output,
                    });

                    transition.addTo(graph);

                    // Populate transition table
                    newTransitionTable.push({
                        presentState: `${currentStateId} (${stateEncoding})`,
                        input: binaryInput,
                        nextState: `${nextStateId} (${nextStateEncoding})`,
                        output,
                    });
                }
            });

            onDiagramGenerated(newTransitionTable);

            paperInstance.current.on("link:pointerclick", (linkView) => {
                const linkModel = linkView.model;
                const transitionData = linkModel.get("transitionData");
                if (transitionData) {
                    setSelectedTransition(transitionData);
                }
            });

            paperInstance.current.on("link:mouseenter", (linkView, evt) => {
                // Start a 0.5s timer to show the tooltip
                tooltipTimeout.current = setTimeout(() => {
                    const transitionData = linkView.model.get("transitionData");
                    if (transitionData) {
                        setTooltip({
                            visible: true,
                            content: `Input: ${transitionData.input}, Output: ${transitionData.output}`,
                            position: {
                                x: evt.clientX + 10,
                                y: evt.clientY + 10,
                            }, // Slight offset
                        });
                        // Highlight the transition arrow in green
                        linkView.model.attr({
                            line: {
                                stroke: "green",
                                "stroke-width": 4,
                            },
                        });
                    }
                }, 300); // 0.3 seconds delay
            });

            paperInstance.current.on("link:mouseleave", (linkView) => {
                // Clear the tooltip timeout if mouse leaves before 0.5s
                clearTimeout(tooltipTimeout.current);
                // Hide the tooltip
                setTooltip({
                    visible: false,
                    content: "",
                    position: { x: 0, y: 0 },
                });
                // Remove the highlight by resetting to original styles
                linkView.model.attr({
                    line: {
                        stroke: "#000000", // Replace with your original stroke color if different
                        "stroke-width": 2,
                    },
                });
            });

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
        getLoopVertices,
    ]);

    const closeModal = () => {
        setSelectedTransition(null);
    };

    return (
        <>
            <div ref={paperRef} className="paper-container"></div>

            {tooltip.visible && (
                <div
                    className={`tooltip ${tooltip.visible ? "visible" : ""}`}
                    style={{
                        top: tooltip.position.y,
                        left: tooltip.position.x,
                    }}
                >
                    {tooltip.content}
                </div>
            )}

            <Modal
                isOpen={!!selectedTransition}
                onRequestClose={closeModal}
                contentLabel="Transition Details"
                className="transition-modal"
                overlayClassName="transition-modal-overlay"
            >
                {selectedTransition && (
                    <div>
                        <h2>Transition Details</h2>
                        <p>
                            <strong>
                                {selectedTransition.fromState}
                                {"➡️"}
                                {selectedTransition.toState}
                            </strong>
                        </p>
                        <p>
                            <strong>Input:</strong> {selectedTransition.input}
                        </p>
                        <p>
                            <strong>Output:</strong> {selectedTransition.output}
                        </p>
                        <button onClick={closeModal}>Close</button>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default StateDiagram;
