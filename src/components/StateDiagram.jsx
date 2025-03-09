import React, { useCallback, useEffect, useRef, useState } from "react";
import { dia, shapes } from "jointjs";
import Modal from "react-modal";
import "../styles/StateDiagram.css";

Modal.setAppElement("#root");

// Add these functions at the top level, before the StateDiagram component

// Helper functions for the StateDiagram component
const StateDiagram = ({
    diagramType,
    flipFlopType,
    numStates,
    numInputs,
    shouldGenerate,
    onDiagramGenerated,
    isUserInputMode = false,
    userInputTransitionTable = null,
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

    // Function to update tooltip with transition data
    // Marked as used by callback refs
    // eslint-disable-next-line no-unused-vars
    const updateTooltip = useCallback((transition) => {
        if (!transition.transitionData) return;

        const content = transition.transitionData
            .map((data) => `${data.input}/${data.output}`)
            .join(", ");

        // Get position from mouse event or transition center
        const bbox = transition.getBBox();
        const position = {
            x: bbox.x + bbox.width / 2,
            y: bbox.y + bbox.height / 2,
        };

        setTooltip({
            visible: true,
            content,
            position,
        });

        // Clear any existing timeout
        if (tooltipTimeout.current) {
            clearTimeout(tooltipTimeout.current);
        }
    }, []);

    // Function to hide tooltip
    // Marked as used by callback refs
    // eslint-disable-next-line no-unused-vars
    const hideTooltip = useCallback(() => {
        tooltipTimeout.current = setTimeout(() => {
            setTooltip((prev) => ({ ...prev, visible: false }));
        }, 200);
    }, []);

    // Function to crop the diagram to content
    const cropToContent = useCallback(() => {
        if (!paperInstance.current) return;

        // Add padding around the content
        const padding = 50;
        paperInstance.current.scaleContentToFit({
            padding,
            minScaleX: 0.5,
            minScaleY: 0.5,
            maxScaleX: 1,
            maxScaleY: 1,
        });
    }, []);

    // Helper function to check if a line crosses a circle
    const doesLineCrossCircle = useCallback(
        (lineStart, lineEnd, circlePos, circleRadius) => {
            // Vector from line start to circle center
            const dx = circlePos.x - lineStart.x;
            const dy = circlePos.y - lineStart.y;

            // Vector representing the line
            const lineVectorX = lineEnd.x - lineStart.x;
            const lineVectorY = lineEnd.y - lineStart.y;

            // Length of the line
            const lineLength = Math.sqrt(
                lineVectorX * lineVectorX + lineVectorY * lineVectorY
            );

            // Normalize the line vector
            const unitLineVectorX = lineVectorX / lineLength;
            const unitLineVectorY = lineVectorY / lineLength;

            // Project vector from line start to circle center onto the line
            const projection = dx * unitLineVectorX + dy * unitLineVectorY;

            // Get the closest point on the line to the circle center
            const closestPointX =
                lineStart.x +
                unitLineVectorX * Math.max(0, Math.min(lineLength, projection));
            const closestPointY =
                lineStart.y +
                unitLineVectorY * Math.max(0, Math.min(lineLength, projection));

            // Calculate distance from closest point to circle center
            const distanceX = circlePos.x - closestPointX;
            const distanceY = circlePos.y - closestPointY;
            const distance = Math.sqrt(
                distanceX * distanceX + distanceY * distanceY
            );

            // Check if the distance is less than the circle radius
            return distance < circleRadius;
        },
        []
    );

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

    // Original useEffect for auto-generated diagrams
    useEffect(() => {
        if (
            shouldGenerate &&
            numStates &&
            numInputs &&
            paperRef.current &&
            !isUserInputMode
        ) {
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

                // Store the state number for later use
                state.set("stateNumber", stateNumber);
                state.set("stateId", stateId);

                // Style the state based on active status - match original implementation
                state.attr({
                    body: {
                        fill: isActive ? "#6FC3DF" : "none",
                        opacity: isActive ? 1 : 0,
                        "pointer-events": isActive ? "visiblePainted" : "none",
                        stroke: isActive ? "#2980b9" : "none",
                        strokeWidth: 2,
                    },
                });

                // Calculate fontSize based on number of states
                const fontSize = numStates > 4 ? 24 : 28;

                // Add state label
                state.attr({
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
                        fromState: `${currentStateId} (${stateEncoding})`,
                        toState: `${nextStateId} (${nextStateEncoding})`,
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

            // Helper function to check if a line crosses a circle
            const doesLineCrossCircle = (
                lineStart,
                lineEnd,
                circlePos,
                circleRadius
            ) => {
                // Vector from line start to circle center
                const dx = circlePos.x - lineStart.x;
                const dy = circlePos.y - lineStart.y;

                // Vector representing the line
                const lineVectorX = lineEnd.x - lineStart.x;
                const lineVectorY = lineEnd.y - lineStart.y;

                // Length of the line
                const lineLength = Math.sqrt(
                    lineVectorX * lineVectorX + lineVectorY * lineVectorY
                );

                // Normalize the line vector
                const unitLineVectorX = lineVectorX / lineLength;
                const unitLineVectorY = lineVectorY / lineLength;

                // Project vector from line start to circle center onto the line
                const projection = dx * unitLineVectorX + dy * unitLineVectorY;

                // Get the closest point on the line to the circle center
                const closestPointX =
                    lineStart.x +
                    unitLineVectorX *
                        Math.max(0, Math.min(lineLength, projection));
                const closestPointY =
                    lineStart.y +
                    unitLineVectorY *
                        Math.max(0, Math.min(lineLength, projection));

                // Calculate distance from closest point to circle center
                const distanceX = circlePos.x - closestPointX;
                const distanceY = circlePos.y - closestPointY;
                const distance = Math.sqrt(
                    distanceX * distanceX + distanceY * distanceY
                );

                // Check if the distance is less than the circle radius
                return distance < circleRadius;
            };

            // Function to calculate custom connection points on the circle's edge based on angle
            const getConnectionPoint = (center, radius, angle) => {
                return {
                    x: center.x + radius * Math.cos(angle),
                    y: center.y + radius * Math.sin(angle),
                };
            };

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

                // Skip if either state is not found
                if (!state || !nextState) return;

                // Create single transition link for this direction
                const transition = new shapes.standard.Link();

                // Get centers of source and target states
                const sourceCenter = {
                    x: state.position().x + state.size().width / 2,
                    y: state.position().y + state.size().height / 2,
                };

                const targetCenter = {
                    x: nextState.position().x + nextState.size().width / 2,
                    y: nextState.position().y + nextState.size().height / 2,
                };

                const stateRadius = state.size().width / 2;

                if (firstTransition.fromState !== firstTransition.toState) {
                    // Check if the direct path crosses any other states
                    const otherStates = activeStates.filter(
                        (s) =>
                            s.get("stateNumber") !==
                                firstTransition.fromStateNumber &&
                            s.get("stateNumber") !==
                                firstTransition.toStateNumber
                    );

                    let isDirectPathBlocked = false;
                    for (const obstacle of otherStates) {
                        const obstacleCenter = {
                            x:
                                obstacle.position().x +
                                obstacle.size().width / 2,
                            y:
                                obstacle.position().y +
                                obstacle.size().height / 2,
                        };

                        if (
                            doesLineCrossCircle(
                                sourceCenter,
                                targetCenter,
                                obstacleCenter,
                                stateRadius * 0.9
                            )
                        ) {
                            isDirectPathBlocked = true;
                            break;
                        }
                    }

                    // If the direct path is blocked, use diagonal connection points and add vertices for routing
                    if (isDirectPathBlocked) {
                        // Determine diagonal angles for better routing
                        const diagonalAngles = {
                            topRight: Math.PI * 0.25,
                            bottomRight: Math.PI * 0.75,
                            bottomLeft: Math.PI * 1.25,
                            topLeft: Math.PI * 1.75,
                        };

                        // Determine which diagonal to use for source and target based on their relative positions
                        let sourceOffset, targetOffset;

                        if (targetCenter.x > sourceCenter.x) {
                            if (targetCenter.y > sourceCenter.y) {
                                // Target is to bottom-right
                                sourceOffset = diagonalAngles.bottomRight;
                                targetOffset = diagonalAngles.topLeft;
                            } else {
                                // Target is to top-right
                                sourceOffset = diagonalAngles.topRight;
                                targetOffset = diagonalAngles.bottomLeft;
                            }
                        } else {
                            if (targetCenter.y > sourceCenter.y) {
                                // Target is to bottom-left
                                sourceOffset = diagonalAngles.bottomLeft;
                                targetOffset = diagonalAngles.topRight;
                            } else {
                                // Target is to top-left
                                sourceOffset = diagonalAngles.topLeft;
                                targetOffset = diagonalAngles.bottomRight;
                            }
                        }

                        // Get connection points
                        const sourcePoint = getConnectionPoint(
                            sourceCenter,
                            stateRadius,
                            sourceOffset
                        );
                        const targetPoint = getConnectionPoint(
                            targetCenter,
                            stateRadius,
                            targetOffset
                        );

                        // Set custom source and target points
                        transition.source(sourcePoint);
                        transition.target(targetPoint);

                        // Calculate intermediate points for routing around obstacles
                        // We'll create a curved path using multiple vertices
                        const controlPoint1 = {
                            x:
                                sourcePoint.x +
                                (targetPoint.x - sourcePoint.x) * 0.33,
                            y:
                                sourcePoint.y +
                                (targetPoint.y - sourcePoint.y) * 0.33,
                        };

                        const controlPoint2 = {
                            x:
                                sourcePoint.x +
                                (targetPoint.x - sourcePoint.x) * 0.66,
                            y:
                                sourcePoint.y +
                                (targetPoint.y - sourcePoint.y) * 0.66,
                        };

                        // Add vertices for a smoother curve
                        transition.vertices([controlPoint1, controlPoint2]);
                    } else {
                        // Direct path is clear, use standard connection with a slight curve
                        transition.source(state);
                        transition.target(nextState);

                        const curvatureFactor =
                            flipFlopType === "JK" || flipFlopType === "T"
                                ? 40
                                : 20;
                        const curveOffset = curvatureFactor;

                        const midPoint = {
                            x: (sourceCenter.x + targetCenter.x) / 2,
                            y: (sourceCenter.y + targetCenter.y) / 2,
                        };

                        const dx = targetCenter.x - sourceCenter.x;
                        const dy = targetCenter.y - sourceCenter.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const normal = {
                            x: -dy / distance,
                            y: dx / distance,
                        };

                        const offsetX = midPoint.x + normal.x * curveOffset;
                        const offsetY = midPoint.y + normal.y * curveOffset;

                        transition.vertices([{ x: offsetX, y: offsetY }]);
                    }

                    // Set connector type
                    transition.connector("smooth");
                } else {
                    // Self-loops still need individual positioning
                    const loopVertices = getLoopVertices(
                        state,
                        state.get("stateNumber"),
                        0,
                        1 // Only one loop per direction now
                    );
                    transition.source(state);
                    transition.target(nextState);
                    transition.vertices(loopVertices);
                    transition.connector("smooth");
                }

                // Combine all input/output pairs into one label, matching original implementation
                const labelText = group
                    .map(
                        (t) =>
                            `${t.input}${
                                diagramType === "Mealy" ? `/${t.output}` : ""
                            }`
                    )
                    .join(", ");

                // Add combined label to transition using appendLabel like original implementation
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

                // Store all transition data for this arrow using set method like original
                transition.set("transitionData", group);

                transition.addTo(graph);
            });

            onDiagramGenerated(newTransitionTable);

            paperInstance.current.on("link:pointerclick", (linkView) => {
                const linkModel = linkView.model;
                const transitionData = linkModel.get("transitionData");
                if (transitionData) {
                    console.log(
                        "User Input Transition clicked:",
                        transitionData
                    );
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

                        // Account for the scaling factor of 0.65 applied to the container
                        const scaleFactor = 1 / 0.65; // Inverse of the scale to adjust coordinates

                        // Calculate the position relative to the container, adjusted for scaling
                        // Also account for any scrolling within the container
                        const scrollLeft = paperRef.current.scrollLeft || 0;
                        const scrollTop = paperRef.current.scrollTop || 0;

                        // Determine complexity of the diagram based on number of states and transitions
                        const graph = paperInstance.current.model;
                        const transitionCount = graph.getLinks().length;

                        // Calculate horizontal offset based on complexity scale
                        // As complexity increases, we progressively shift more to the left
                        let horizontalOffset = 15; // Default offset for simple diagrams

                        if (transitionCount > 10) {
                            horizontalOffset = -45; // Significant shift for very complex diagrams
                        } else if (transitionCount > 7) {
                            horizontalOffset = -30; // Medium shift for moderately complex diagrams
                        } else if (transitionCount > 4) {
                            horizontalOffset = -15; // Small shift for slightly complex diagrams
                        }

                        // If diagram has many states, add additional leftward shift
                        if (numStates > 5) {
                            horizontalOffset -= 15;
                        }

                        // Calculate position for tooltip
                        let xPos =
                            (evt.clientX - containerRect.left + scrollLeft) *
                                scaleFactor +
                            horizontalOffset;
                        let yPos =
                            (evt.clientY - containerRect.top + scrollTop) *
                                scaleFactor +
                            15;

                        // Get window dimensions to check boundaries
                        const windowWidth = window.innerWidth;
                        const windowHeight = window.innerHeight;

                        // Estimate tooltip width and height (adjust these values based on your actual tooltip size)
                        const estimatedTooltipWidth = 300; // Max width defined in CSS
                        const estimatedTooltipHeight =
                            transitionsText.split("\n").length * 30; // Rough estimate

                        // Check if tooltip would appear off-screen and adjust if needed
                        // Right edge check
                        if (
                            evt.clientX +
                                estimatedTooltipWidth +
                                horizontalOffset >
                            windowWidth
                        ) {
                            xPos =
                                (evt.clientX -
                                    containerRect.left +
                                    scrollLeft) *
                                    scaleFactor -
                                estimatedTooltipWidth -
                                15;
                        }

                        // Bottom edge check
                        if (
                            evt.clientY + estimatedTooltipHeight + 15 >
                            windowHeight
                        ) {
                            yPos =
                                (evt.clientY - containerRect.top + scrollTop) *
                                    scaleFactor -
                                estimatedTooltipHeight -
                                15;
                        }

                        setTooltip({
                            visible: true,
                            content: transitionsText,
                            position: {
                                x: xPos,
                                y: yPos,
                            },
                        });

                        // Highlight the arrow in green, matching original implementation
                        linkView.model.attr({
                            line: {
                                stroke: "green",
                                "stroke-width": 4,
                            },
                            // Also highlight the label rectangle in green
                            ".label rect": {
                                stroke: "green",
                                "stroke-width": 2,
                                fill: "#e6ffe6", // Light green background
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

                // Reset the arrow style
                linkView.model.attr({
                    line: {
                        stroke: "#000", // Default color
                        "stroke-width": 2, // Default width
                    },
                    // Reset the label rectangle style
                    ".label rect": {
                        stroke: "black",
                        "stroke-width": 1,
                        fill: "white", // Reset to default
                    },
                });
            });

            // Replace the existing fitToContent function with this new cropToContent function
            cropToContent();
            window.addEventListener("resize", cropToContent);

            return () => {
                window.removeEventListener("resize", cropToContent);
            };
        }
    }, [
        shouldGenerate,
        getLoopVertices,
        diagramType,
        flipFlopType,
        numInputs,
        numStates,
        onDiagramGenerated,
        isUserInputMode,
        cropToContent,
    ]);

    // New useEffect for user input diagrams
    useEffect(() => {
        // Add a check to ensure userInputTransitionTable is not null and has length
        if (
            isUserInputMode &&
            userInputTransitionTable &&
            Array.isArray(userInputTransitionTable) &&
            userInputTransitionTable.length > 0 &&
            paperRef.current
        ) {
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

            // Add paper-level event handlers for hover and click
            paperInstance.current.on("link:pointerclick", (linkView) => {
                const linkModel = linkView.model;
                const transitionData = linkModel.get("transitionData");
                if (transitionData) {
                    console.log(
                        "User Input Transition clicked:",
                        transitionData
                    );
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

                        // Account for the scaling factor of 0.65 applied to the container
                        const scaleFactor = 1 / 0.65; // Inverse of the scale to adjust coordinates

                        // Calculate the position relative to the container, adjusted for scaling
                        // Also account for any scrolling within the container
                        const scrollLeft = paperRef.current.scrollLeft || 0;
                        const scrollTop = paperRef.current.scrollTop || 0;

                        // Determine complexity of the diagram based on number of states and transitions
                        const graph = paperInstance.current.model;
                        const transitionCount = graph.getLinks().length;

                        // Calculate horizontal offset based on complexity scale
                        // As complexity increases, we progressively shift more to the left
                        let horizontalOffset = 15; // Default offset for simple diagrams

                        if (transitionCount > 10) {
                            horizontalOffset = -45; // Significant shift for very complex diagrams
                        } else if (transitionCount > 7) {
                            horizontalOffset = -30; // Medium shift for moderately complex diagrams
                        } else if (transitionCount > 4) {
                            horizontalOffset = -15; // Small shift for slightly complex diagrams
                        }

                        // If diagram has many states, add additional leftward shift
                        if (numStates > 5) {
                            horizontalOffset -= 15;
                        }

                        // Calculate position for tooltip
                        let xPos =
                            (evt.clientX - containerRect.left + scrollLeft) *
                                scaleFactor +
                            horizontalOffset;
                        let yPos =
                            (evt.clientY - containerRect.top + scrollTop) *
                                scaleFactor +
                            15;

                        // Get window dimensions to check boundaries
                        const windowWidth = window.innerWidth;
                        const windowHeight = window.innerHeight;

                        // Estimate tooltip width and height (adjust these values based on your actual tooltip size)
                        const estimatedTooltipWidth = 300; // Max width defined in CSS
                        const estimatedTooltipHeight =
                            transitionsText.split("\n").length * 30; // Rough estimate

                        // Check if tooltip would appear off-screen and adjust if needed
                        // Right edge check
                        if (
                            evt.clientX +
                                estimatedTooltipWidth +
                                horizontalOffset >
                            windowWidth
                        ) {
                            xPos =
                                (evt.clientX -
                                    containerRect.left +
                                    scrollLeft) *
                                    scaleFactor -
                                estimatedTooltipWidth -
                                15;
                        }

                        // Bottom edge check
                        if (
                            evt.clientY + estimatedTooltipHeight + 15 >
                            windowHeight
                        ) {
                            yPos =
                                (evt.clientY - containerRect.top + scrollTop) *
                                    scaleFactor -
                                estimatedTooltipHeight -
                                15;
                        }

                        setTooltip({
                            visible: true,
                            content: transitionsText,
                            position: {
                                x: xPos,
                                y: yPos,
                            },
                        });

                        // Highlight the arrow in green, matching original implementation
                        linkView.model.attr({
                            line: {
                                stroke: "green",
                                "stroke-width": 4,
                            },
                            // Also highlight the label rectangle in green
                            ".label rect": {
                                stroke: "green",
                                "stroke-width": 2,
                                fill: "#e6ffe6", // Light green background
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

                // Reset the arrow style
                linkView.model.attr({
                    line: {
                        stroke: "#000", // Default color
                        "stroke-width": 2, // Default width
                    },
                    // Reset the label rectangle style
                    ".label rect": {
                        stroke: "black",
                        "stroke-width": 1,
                        fill: "white", // Reset to default
                    },
                });
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
                    ((2 * Math.PI) / Math.max(numStates, TOTAL_STATES)) * i;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);

                const state = new shapes.standard.Circle();
                state.position(x, y);
                state.resize(100, 100);

                // Determine if the state is active or inactive
                const isActive = stateNumber < numStates;

                // Store the state number for later use
                state.set("stateNumber", stateNumber);
                state.set("stateId", stateId);

                // Style the state based on active status - match original implementation
                state.attr({
                    body: {
                        fill: isActive ? "#6FC3DF" : "none",
                        opacity: isActive ? 1 : 0,
                        "pointer-events": isActive ? "visiblePainted" : "none",
                        stroke: isActive ? "#2980b9" : "none",
                        strokeWidth: 2,
                    },
                });

                // Calculate fontSize based on number of states
                const fontSize = numStates > 4 ? 16 : 20;

                // Add state label
                state.attr({
                    label: {
                        text: isActive ? `${stateId}` : "",
                        fill: isActive ? "white" : "none",
                        fontSize: fontSize,
                    },
                });

                // Add output label if it's a Moore machine and the state is active
                if (diagramType === "Moore" && isActive) {
                    // Find the output for this state by checking transitions to this state in the user's table
                    let stateOutput = "0"; // Default value
                    // In Moore machines, output is determined by the state
                    // Find an entry in the transition table for this state
                    const stateEntries = userInputTransitionTable.filter(
                        (entry) =>
                            entry.presentState.startsWith(`S${stateNumber}`)
                    );

                    if (stateEntries.length > 0) {
                        stateOutput = stateEntries[0].output;
                    }

                    state.attr({
                        label: {
                            text: `${stateId}\n―\n${stateOutput}`,
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

            // Filter to get only active states for transition creation
            const activeStates = states.filter((state) => {
                const stateNumber = state.get("stateNumber");
                return stateNumber < numStates;
            });

            // Create transitions based on user input transition table
            const transitionDataList = [];

            userInputTransitionTable.forEach((row) => {
                const fromStateMatch = row.presentState.match(/S(\d+)/);
                const toStateMatch = row.nextState.match(/S(\d+)/);

                if (fromStateMatch && toStateMatch) {
                    const fromStateNumber = parseInt(fromStateMatch[1], 10);
                    const toStateNumber = parseInt(toStateMatch[1], 10);
                    const input = row.input;
                    const output = row.output;

                    // Add fromState and toState properties needed for modal display
                    // Use the full state identifier from the row data, including binary encoding
                    const fromState = row.presentState; // This has format like "S0 (00)"
                    const toState = row.nextState; // This has format like "S1 (01)"

                    transitionDataList.push({
                        fromStateNumber,
                        toStateNumber,
                        fromState,
                        toState,
                        input,
                        output,
                    });
                }
            });

            // Process transitions to adjust curvature (same as original code)
            const transitionGroups = {};

            transitionDataList.forEach((data) => {
                // Change the key to be directional - only combine transitions going the same direction
                const key = `${data.fromStateNumber}->${data.toStateNumber}`;
                if (!transitionGroups[key]) {
                    transitionGroups[key] = [];
                }
                transitionGroups[key].push(data);
            });

            // Create transitions (use existing transition creation code)
            Object.values(transitionGroups).forEach((group) => {
                if (!group.length) return;

                const fromStateNumber = group[0].fromStateNumber;
                const toStateNumber = group[0].toStateNumber;

                // Skip if either state is inactive
                if (
                    fromStateNumber >= numStates ||
                    toStateNumber >= numStates
                ) {
                    return;
                }

                // Use activeStates to find the states by number
                const fromState = activeStates.find(
                    (s) => s.get("stateNumber") === fromStateNumber
                );
                const toState = activeStates.find(
                    (s) => s.get("stateNumber") === toStateNumber
                );

                if (!fromState || !toState) return;

                // Is this a self-loop?
                const isSelfLoop = fromStateNumber === toStateNumber;

                const sourceCenter = fromState.getBBox().center();
                const targetCenter = toState.getBBox().center();

                // Create the link
                const transition = new shapes.standard.Link({
                    z: 1,
                    attrs: {
                        line: {
                            stroke: "#333",
                            strokeWidth: 2,
                            targetMarker: {
                                type: "path",
                                d: "M 10 -5 0 0 10 5 z",
                                fill: "#333",
                            },
                        },
                    },
                });

                // For self loops
                if (isSelfLoop) {
                    // Position the self loop based on state number
                    const loopVertices = getLoopVertices(
                        fromState,
                        fromStateNumber,
                        0,
                        group.length
                    );
                    transition.source(fromState);
                    transition.target(toState);
                    transition.vertices(loopVertices);
                } else {
                    // Check if there's another state that the direct path would intersect with
                    const otherStates = activeStates.filter(
                        (s) =>
                            s.get("stateNumber") !== fromStateNumber &&
                            s.get("stateNumber") !== toStateNumber &&
                            s.get("stateNumber") < numStates
                    );

                    let needsDetour = false;
                    for (const otherState of otherStates) {
                        const otherCenter = otherState.getBBox().center();
                        const otherRadius = otherState.getBBox().width / 2;

                        if (
                            doesLineCrossCircle(
                                sourceCenter,
                                targetCenter,
                                otherCenter,
                                otherRadius
                            )
                        ) {
                            needsDetour = true;
                            break;
                        }
                    }

                    if (needsDetour) {
                        // Create a curved path that avoids the obstacle
                        transition.source(fromState);
                        transition.target(toState);

                        // Calculate control points for a significant curve
                        const controlPoint1 = {
                            x:
                                sourceCenter.x +
                                (targetCenter.x - sourceCenter.x) * 0.33,
                            y:
                                sourceCenter.y -
                                100 +
                                (targetCenter.y - sourceCenter.y) * 0.33,
                        };
                        const controlPoint2 = {
                            x:
                                sourceCenter.x +
                                (targetCenter.x - sourceCenter.x) * 0.66,
                            y:
                                sourceCenter.y +
                                (targetCenter.y - sourceCenter.y) * 0.66,
                        };

                        // Add vertices for a smoother curve
                        transition.vertices([controlPoint1, controlPoint2]);
                    } else {
                        // Direct path is clear, use standard connection with a slight curve
                        transition.source(fromState);
                        transition.target(toState);

                        const curvatureFactor =
                            flipFlopType === "JK" || flipFlopType === "T"
                                ? 40
                                : 20;
                        const curveOffset = curvatureFactor;

                        const midPoint = {
                            x: (sourceCenter.x + targetCenter.x) / 2,
                            y: (sourceCenter.y + targetCenter.y) / 2,
                        };

                        const dx = targetCenter.x - sourceCenter.x;
                        const dy = targetCenter.y - sourceCenter.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const normal = {
                            x: -dy / distance,
                            y: dx / distance,
                        };

                        const offsetX = midPoint.x + normal.x * curveOffset;
                        const offsetY = midPoint.y + normal.y * curveOffset;

                        transition.vertices([{ x: offsetX, y: offsetY }]);
                    }
                }

                // Set connector type
                transition.connector("smooth");

                // Combine all input/output pairs into one label, matching original implementation
                const labelText = group
                    .map(
                        (t) =>
                            `${t.input}${
                                diagramType === "Mealy" ? `/${t.output}` : ""
                            }`
                    )
                    .join(", ");

                // Add combined label to transition using appendLabel like original implementation
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

                // Store all transition data for this arrow using set method like original
                transition.set("transitionData", group);

                transition.addTo(graph);
            });

            // Use the same cropToContent logic as in the original
            setTimeout(() => {
                cropToContent();
            }, 100);
        }
    }, [
        isUserInputMode,
        userInputTransitionTable,
        numStates,
        numInputs,
        diagramType,
        flipFlopType,
        cropToContent,
        doesLineCrossCircle,
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
                        <div className="modal-header">
                            <h2>Transition Details</h2>
                            <button
                                className="modal-close-button"
                                onClick={closeModal}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>
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
                    </div>
                )}
            </Modal>
        </>
    );
};

export default StateDiagram;
