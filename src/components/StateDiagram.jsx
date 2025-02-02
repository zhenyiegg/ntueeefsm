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
                            y: state.position().y,
                        },
                        {
                            x: state.position().x - loopOffset,
                            y: state.position().y - loopOffset,
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

            const paperWidth = 1400;
            const paperHeight = 1200;

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
                state.resize(120, 120);

                // Determine if the state is active or inactive
                const isActive = stateNumber < numStates;

                // Assign the unique stateId to the element's data
                state.set("stateId", stateId);
                state.set("stateNumber", stateNumber);

                // Adjust font size
                const minFontSize = 22; // [Modified]
                const maxFontSize = 26; // [Modified]
                const fontSize =
                    maxFontSize - (numStates - 3) > minFontSize // [Modified]
                        ? maxFontSize - (numStates - 3)
                        : minFontSize;

                state.attr({
                    body: {
                        fill: isActive ? "#6FC3DF" : "#CCCCCC",
                        opacity: isActive ? 1 : 0.1,
                        "pointer-events": isActive ? "visiblePainted" : "none",
                    },
                    label: {
                        text: isActive ? `${stateId}` : "",
                        fill: isActive ? "white" : "#666666",
                        fontSize: fontSize, // [Modified]
                    },
                });

                // Add output label if it's a Moore machine and the state is active
                if (diagramType === "Moore" && isActive) {
                    state.attr({
                        label: {
                            text: `${stateId}\nOut=${stateNumber % 2}`,
                            fill: "white",
                            fontSize: fontSize, // [Modified]
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
                        nextStateNumber = inputValue;
                        break;
                    case "T":
                        nextStateNumber =
                            currentStateNumber === inputValue ? 0 : 1;
                        break;
                    case "JK":
                        if (inputValue === 0)
                            nextStateNumber = currentStateNumber;
                        else nextStateNumber = currentStateNumber === 1 ? 0 : 1;
                        break;
                    default:
                        nextStateNumber = inputValue;
                        break;
                }
                return nextStateNumber % numStates;
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
                const totalTransitions = group.length;
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
                        // Create a list of all transitions in this group
                        const transitionsText = transitionGroup
                            .map(
                                (t) => `Input: ${t.input}, Output: ${t.output}`
                            )
                            .join("\n");

                        setTooltip({
                            visible: true,
                            content: transitionsText,
                            position: {
                                x: evt.clientX + 10,
                                y: evt.clientY + 10,
                            },
                        });
                        // Highlight the transition arrow in green
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

            // Adjust the view to fit all content
            const fitToContent = () => {
                if (paperInstance.current) {
                    paperInstance.current.scaleContentToFit({
                        minScaleX: 0.3,
                        minScaleY: 0.3,
                        maxScaleX: 0.7,
                        maxScaleY: 0.7,
                        padding: 100,
                    });

                    // Apply centering adjustment only for D and T flip-flops
                    if (flipFlopType === "D" || flipFlopType === "T") {
                        // Center the content manually
                        const paperWidth = paperInstance.current.options.width;
                        const paperHeight =
                            paperInstance.current.options.height;
                        const contentBBox =
                            paperInstance.current.getContentBBox();
                        const contentCenterX =
                            contentBBox.x + contentBBox.width / 2;
                        const contentCenterY =
                            contentBBox.y + contentBBox.height / 2;

                        const paperCenterX = paperWidth / 2;
                        const paperCenterY = paperHeight / 2;

                        // Add offsets to deltaX and deltaY
                        const offsetX = -135; // Positive value moves diagram right
                        const offsetY = -20; // Negative value moves diagram up

                        const deltaX = paperCenterX - contentCenterX + offsetX;
                        const deltaY = paperCenterY - contentCenterY + offsetY;

                        paperInstance.current.translate(deltaX, deltaY);
                    }

                    // Apply centering adjustment only for D and T flip-flops
                    if (flipFlopType === "JK") {
                        // Center the content manually
                        const paperWidth = paperInstance.current.options.width;
                        const paperHeight =
                            paperInstance.current.options.height;
                        const contentBBox =
                            paperInstance.current.getContentBBox();
                        const contentCenterX =
                            contentBBox.x + contentBBox.width / 2;
                        const contentCenterY =
                            contentBBox.y + contentBBox.height / 2;

                        const paperCenterX = paperWidth / 2;
                        const paperCenterY = paperHeight / 2;

                        // Add offsets to deltaX and deltaY
                        const offsetX = -75; // Positive value moves diagram right
                        const offsetY = 50; // Negative value moves diagram up

                        const deltaX = paperCenterX - contentCenterX + offsetX;
                        const deltaY = paperCenterY - contentCenterY + offsetY;

                        paperInstance.current.translate(deltaX, deltaY);
                    }
                }
            };

            fitToContent();
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

    const closeModal = (e) => {
        // Prevent any default behavior that might cause scrolling
        if (e) {
            e.preventDefault();
        }
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
