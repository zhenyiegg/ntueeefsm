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
    const paperInstance = useRef(null);

    const [selectedTransition, setSelectedTransition] = useState(null);

    // State for managing tooltip visibility and content
    const [tooltip, setTooltip] = useState({
        visible: false,
        content: "",
        position: { x: 0, y: 0 },
    });

    // Ref to handle the tooltip timeout
    const tooltipTimeout = useRef(null);

    // Define getLoopVertices with adaptive offsets
    const getLoopVertices = useCallback(
        (state, stateNumber, transitionIndex = 0, totalTransitions = 1) => {
            const baseLoopOffset = 120; // Base offset for loops
            const loopOffsetFactor = 20; // Factor to adjust the loop offset
            const loopOffset =
                baseLoopOffset +
                (transitionIndex - (totalTransitions - 1) / 2) *
                    loopOffsetFactor;

            switch (stateNumber) {
                case 0:
                    return [
                        {
                            x: state.position().x + loopOffset + 100,
                            y: state.position().y,
                        },
                        {
                            x: state.position().x + loopOffset + 50,
                            y: state.position().y + loopOffset,
                        },
                    ];
                case 3:
                    return [
                        {
                            x: state.position().x + loopOffset + 100,
                            y: state.position().y + 100,
                        },
                        {
                            x: state.position().x + loopOffset + 50,
                            y: state.position().y + loopOffset + 100,
                        },
                    ];
                case 6:
                    return [
                        {
                            x: state.position().x + 100,
                            y: state.position().y + loopOffset + 50,
                        },
                        {
                            x: state.position().x - loopOffset + 100,
                            y: state.position().y + loopOffset + 50,
                        },
                    ];
                case 1:
                    return [
                        {
                            x: state.position().x + 20,
                            y: state.position().y + loopOffset + 50,
                        },
                        {
                            x: state.position().x - loopOffset,
                            y: state.position().y + loopOffset - 50,
                        },
                    ];
                case 4:
                    return [
                        {
                            x: state.position().x - loopOffset,
                            y: state.position().y + 50,
                        },
                        {
                            x: state.position().x - loopOffset + 100,
                            y: state.position().y - loopOffset + 30,
                        },
                    ];
                case 7:
                    return [
                        {
                            x: state.position().x,
                            y: state.position().y - loopOffset,
                        },
                        {
                            x: state.position().x + loopOffset,
                            y: state.position().y - loopOffset,
                        },
                    ];
                case 2:
                    return [
                        {
                            x: state.position().x - 50,
                            y: state.position().y - loopOffset + 50,
                        },
                        {
                            x: state.position().x + loopOffset,
                            y: state.position().y - loopOffset + 50,
                        },
                    ];
                case 5:
                    return [
                        {
                            x: state.position().x + loopOffset + 50,
                            y: state.position().y,
                        },
                        {
                            x: state.position().x + loopOffset + 50,
                            y: state.position().y + loopOffset,
                        },
                    ];
                default:
                    return [];
            }
        },
        []
    );

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

            const radius = Math.min(paperWidth, paperHeight) / 2 - 120;

            const centerX = paperWidth / 2;
            const centerY = paperHeight / 2;

            const stateOrder = [0, 3, 6, 1, 4, 7, 2, 5];

            // State creation and placement
            for (let i = 0; i < TOTAL_STATES; i++) {
                const stateNumber = stateOrder[i];
                const stateId = `S${stateNumber}`;

                const angle =
                    ((2 * Math.PI) / Math.max(numStates, TOTAL_STATES)) * i; // [Modified]
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);

                const state = new shapes.standard.Circle();
                state.position(x, y);
                state.resize(100, 100);

                // Determine if the state is active or inactive
                const isActive = stateNumber < numStates;

                // Assign the unique stateId to the element's data
                state.set("stateId", stateId);
                state.set("stateNumber", stateNumber);

                // Adjust font size
                const minFontSize = 20;
                const maxFontSize = 24;
                const fontSize =
                    maxFontSize - (numStates - 3) > minFontSize // [Modified]
                        ? maxFontSize - (numStates - 3)
                        : minFontSize;

                state.attr({
                    body: {
                        fill: isActive ? "#6FC3DF" : "none",
                        opacity: isActive ? 1 : 0,
                        "pointer-events": isActive ? "visiblePainted" : "none",
                    },
                    label: {
                        text: isActive ? `${stateId}` : "",
                        fill: isActive ? "white" : "none",
                        fontSize: fontSize,
                    },
                });

                // Add output label if it's a Moore machine and the state is active
                if (diagramType === "Moore" && isActive) {
                    state.attr({
                        label: {
                            text: `${stateId}\n―\n${stateNumber % 2}`,
                            fill: "white",
                            fontSize: fontSize,
                            "text-anchor": "middle",
                            "y-alignment": "middle",
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
                // Get array of possible next states (0 to numStates-1)
                const possibleStates = Array.from(
                    { length: numStates },
                    (_, i) => i
                );

                // For D flip-flop, we want to ensure the input value influences the next state
                // but not completely determine it like before
                if (flipFlopType === "D") {
                    // 70% chance to follow input value (for some predictability)
                    if (Math.random() < 0.7) {
                        return inputValue % numStates;
                    }
                    // 30% chance to pick any valid state randomly
                    return possibleStates[
                        Math.floor(Math.random() * numStates)
                    ];
                }

                // For T flip-flop, we'll maintain the toggle behavior but with randomness
                else if (flipFlopType === "T") {
                    if (inputValue === 1) {
                        // On toggle (input=1), randomly select any state except current
                        const otherStates = possibleStates.filter(
                            (state) => state !== currentStateNumber
                        );
                        return otherStates[
                            Math.floor(Math.random() * otherStates.length)
                        ];
                    } else {
                        // On no toggle (input=0), 80% chance to stay, 20% chance to move
                        return Math.random() < 0.8
                            ? currentStateNumber
                            : possibleStates[
                                  Math.floor(Math.random() * numStates)
                              ];
                    }
                }

                // For JK flip-flop, maintain JK behavior but with randomness
                else if (flipFlopType === "JK") {
                    if (inputValue === 0) {
                        // No change (J=K=0)
                        return currentStateNumber;
                    } else if (inputValue === 1) {
                        // Toggle (J=K=1)
                        const otherStates = possibleStates.filter(
                            (state) => state !== currentStateNumber
                        );
                        return otherStates[
                            Math.floor(Math.random() * otherStates.length)
                        ];
                    } else if (inputValue === 2) {
                        // Set (J=1,K=0)
                        const higherStates = possibleStates.filter(
                            (state) => state > currentStateNumber
                        );
                        return higherStates.length > 0
                            ? higherStates[
                                  Math.floor(
                                      Math.random() * higherStates.length
                                  )
                              ]
                            : possibleStates[
                                  Math.floor(Math.random() * numStates)
                              ];
                    } else {
                        // Reset (J=0,K=1)
                        const lowerStates = possibleStates.filter(
                            (state) => state < currentStateNumber
                        );
                        return lowerStates.length > 0
                            ? lowerStates[
                                  Math.floor(Math.random() * lowerStates.length)
                              ]
                            : possibleStates[
                                  Math.floor(Math.random() * numStates)
                              ];
                    }
                }

                // Fallback: return random valid state
                return Math.floor(Math.random() * numStates);
            };

            const transitionDataList = [];

            activeStates.forEach((state) => {
                const currentStateNumber = state.get("stateNumber");
                const stateEncoding = getStateEncoding(
                    currentStateNumber,
                    numStates
                );
                const currentStateId = state.get("stateId");

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

                    if (!nextState) continue;

                    const nextStateId = nextState.get("stateId");
                    const nextStateEncoding = getStateEncoding(
                        nextStateNumber,
                        numStates
                    );

                    const outputValue =
                        diagramType === "Mealy"
                            ? nextStateNumber % 2
                            : currentStateNumber % 2;

                    const output =
                        outputValue >= 2
                            ? outputValue.toString(2)
                            : `${outputValue}`;

                    // Store transition data for later processing
                    const transitionData = {
                        fromState: currentStateId,
                        toState: nextStateId,
                        input: binaryInput,
                        output: output,
                        fromStateNumber: currentStateNumber,
                        toStateNumber: nextStateNumber,
                    };

                    transitionDataList.push(transitionData);

                    // Populate transition table
                    newTransitionTable.push({
                        presentState: `${currentStateId} (${stateEncoding})`,
                        input: binaryInput,
                        nextState: `${nextStateId} (${nextStateEncoding})`,
                        output,
                    });
                }
            });

            // Process transitions to adjust curvature
            const transitionGroups = {};

            transitionDataList.forEach((data) => {
                // Change the key to be directional - only combine transitions going the same direction
                const key = `${data.fromStateNumber}->${data.toStateNumber}`;
                if (!transitionGroups[key]) {
                    transitionGroups[key] = [];
                }
                transitionGroups[key].push(data);
            });

            Object.values(transitionGroups).forEach((group) => {
                const firstTransition = group[0];

                // All transitions in this group have the same from/to states
                const state = activeStates.find(
                    (s) =>
                        s.get("stateNumber") === firstTransition.fromStateNumber
                );
                const nextState = activeStates.find(
                    (s) =>
                        s.get("stateNumber") === firstTransition.toStateNumber
                );

                // Create single transition link for this direction
                const transition = new shapes.standard.Link();
                transition.source(state);
                transition.target(nextState);

                if (firstTransition.fromState !== firstTransition.toState) {
                    // Single curve for transitions between different states
                    const curvatureFactor =
                        flipFlopType === "JK" || flipFlopType === "T" ? 40 : 20;
                    const curveOffset = curvatureFactor;

                    const midPoint = {
                        x: (state.position().x + nextState.position().x) / 2,
                        y: (state.position().y + nextState.position().y) / 2,
                    };

                    const dx = nextState.position().x - state.position().x;
                    const dy = nextState.position().y - state.position().y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const normal = {
                        x: -dy / distance,
                        y: dx / distance,
                    };

                    const offsetX = midPoint.x + normal.x * curveOffset;
                    const offsetY = midPoint.y + normal.y * curveOffset;

                    transition.vertices([{ x: offsetX, y: offsetY }]);
                    transition.connector("smooth");
                } else {
                    // Self-loops still need individual positioning
                    const loopVertices = getLoopVertices(
                        state,
                        state.get("stateNumber"),
                        0,
                        1 // Only one loop per direction now
                    );
                    transition.vertices(loopVertices);
                    transition.connector("smooth");
                }

                // Combine all input/output pairs into one label
                const labelText = group
                    .map(
                        (t) =>
                            `${t.input}${
                                diagramType === "Mealy" ? `/${t.output}` : ""
                            }`
                    )
                    .join(", ");

                // Add combined label to transition
                transition.appendLabel({
                    attrs: {
                        text: {
                            text: labelText,
                            fill: "#FF0000",
                            fontSize: 28,
                            "font-weight": "bold",
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

                // Store all transition data for this arrow
                transition.set("transitionData", group);

                transition.addTo(graph);
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
                tooltipTimeout.current = setTimeout(() => {
                    const transitionGroup =
                        linkView.model.get("transitionData");
                    if (transitionGroup) {
                        // Create different tooltip text based on machine type
                        const transitionsText = transitionGroup
                            .map((t) =>
                                diagramType === "Mealy"
                                    ? `Input: ${t.input}, Output: ${t.output}`
                                    : `Input: ${t.input}`
                            )
                            .join("\n");

                        // Get the bounding rectangle of the container
                        const containerRect =
                            paperRef.current.getBoundingClientRect();

                        setTooltip({
                            visible: true,
                            content: transitionsText,
                            position: {
                                x: evt.clientX - containerRect.left + 10,
                                y: evt.clientY - containerRect.top + 10,
                            },
                        });

                        // Highlight the arrow in green
                        linkView.model.attr({
                            line: {
                                stroke: "green",
                                "stroke-width": 4,
                            },
                        });
                    }
                }, 300);
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
                        stroke: "#000000",
                        "stroke-width": 2,
                    },
                });
            });

            // Replace the existing fitToContent function with this new cropToContent function
            const cropToContent = () => {
                if (paperInstance.current) {
                    // Get the bounding box of all diagram elements
                    const bbox = paperInstance.current.getContentBBox();
                    const padding = 80; // Adjust padding as needed

                    // Translate the paper so the content appears at (padding, padding)
                    paperInstance.current.translate(
                        -bbox.x + padding,
                        -bbox.y + padding
                    );

                    // Optional: Update container size to match content
                    if (paperRef.current) {
                        paperRef.current.style.width =
                            bbox.width + padding * 2 + "px";
                        paperRef.current.style.height =
                            bbox.height + padding * 2 + "px";
                    }
                }
            };

            // Call cropToContent instead of fitToContent
            cropToContent();
            window.addEventListener("resize", cropToContent);

            return () => {
                window.removeEventListener("resize", cropToContent);
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

    const closeModal = (e) => {
        // Prevent any default behavior that might cause scrolling
        if (e) {
            e.preventDefault();
        }
        setSelectedTransition(null);
    };

    return (
        <>
            <div ref={paperRef} className="initial-paper-container"></div>

            {tooltip.visible && (
                <div
                    className={`tooltip ${tooltip.visible ? "visible" : ""}`}
                    style={{
                        top: tooltip.position.y,
                        left: tooltip.position.x,
                        whiteSpace: "pre-line", // Allow line breaks in tooltip
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
                shouldCloseOnOverlayClick={true}
                shouldReturnFocusAfterClose={false}
                preventScroll={true}
            >
                {selectedTransition && (
                    <div>
                        <h2>Transition Details</h2>
                        <p>
                            <strong>
                                {selectedTransition[0].fromState} ➡️{" "}
                                {selectedTransition[0].toState}
                            </strong>
                        </p>
                        <div className="transition-list">
                            {selectedTransition.map((transition, index) => (
                                <div key={index} className="transition-item">
                                    <p>
                                        <strong>Input:</strong>{" "}
                                        {transition.input}
                                    </p>
                                    <p>
                                        <strong>Output:</strong>{" "}
                                        {transition.output}
                                    </p>
                                    {index < selectedTransition.length - 1 && (
                                        <hr />
                                    )}
                                </div>
                            ))}
                        </div>
                        <button onClick={closeModal}>Close</button>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default StateDiagram;
