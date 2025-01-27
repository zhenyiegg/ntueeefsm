/* CTSConversion.jsx */
import React, { useEffect, useState } from "react";
import { dia, shapes } from "jointjs";
import "../styles/CTSConversion.css";

const CTSConversion = ({ stateTransitionTable, fsmType, numFlipFlops, numInputs }) => {
  const [popupData, setPopupData] = useState(null); 
  const [showTransitionPopup, setTransitionShowPopup] = useState(false); 
  const [diagramInfo, setDiagramInfo] = useState("");

  useEffect(() => {
    const graph = new dia.Graph();
    const paper = new dia.Paper({
      el: document.getElementById("stateDiagram-container"),
      model: graph,
      width: 1200,
      height: 1000,
      gridSize: 1,
      interactive: false,
    });

    const stateElements = {}; // Store references to state circles

    // Process transitions by grouping input/output combinations
    const groupedTransitions = {};
    stateTransitionTable.forEach((row) => {
      const key = `${row.currentState}->${row.nextState}`;
      if (!groupedTransitions[key]) {
        groupedTransitions[key] = [];
      }
      groupedTransitions[key].push({ input: row.input, output: row.output });
    });

    // Generate state positions based on the number of flip-flops
    const states = Array.from(new Set(stateTransitionTable.flatMap(row => [row.currentState, row.nextState])));
    const positions = calculateStatePositions(states, numFlipFlops, numInputs);

    // Identify unused states
    const incomingTransitions = {};
    const outgoingTransitions = {};

    // Initialize counts for incoming and outgoing transitions
    states.forEach(state => {
      incomingTransitions[state] = 0;
      outgoingTransitions[state] = 0;
    });

    // Count incoming and outgoing transitions
    stateTransitionTable.forEach(row => {
      incomingTransitions[row.nextState] += 1;
      outgoingTransitions[row.currentState] += 1;
    });

    const resetState = numFlipFlops === 2 ? "00" : "000";

    // 1. Identify Primary Unused States
    let primaryUnusedStates = states.filter(state => {
      if (state === resetState) {
        return false; // Reset state is never unused
      }

      let hasSelfLoop = false;
      let hasOutgoing = false;
      let hasIncoming = false;
    
      stateTransitionTable.forEach(row => {
        if (row.currentState === state && row.nextState === state) {
          hasSelfLoop = true; // Self-loop detected
        }
        if (row.currentState === state && row.nextState !== state) {
          hasOutgoing = true; // Outgoing transition detected
        }
        if (row.nextState === state && row.currentState !== state) {
          hasIncoming = true; // Incoming transition detected
        }
      });
    
      // Check unused state conditions
      return (
        (hasSelfLoop && !hasOutgoing && !hasIncoming) || // Only a self-loop, no incoming/outgoing
        (!hasSelfLoop && hasOutgoing && !hasIncoming) || // Only outgoing transitions, no incoming or self-loop
        (hasSelfLoop && hasOutgoing && !hasIncoming)    // Self-loop with outgoing transitions, no incoming
      );
    });

    // Check if a state is only reached by unused states
    const isReachedOnlyByUnused = (state, unusedStates) => {
      if (state === resetState) {
        return false;
      }
    
      const incomingStates = stateTransitionTable
        .filter(row => row.nextState === state)
        .map(row => row.currentState);
    
      return incomingStates.every(currentState => unusedStates.includes(currentState));
    };

    // 2. Identify Secondary Unused States (States Reached Only by Primary Unused)
    const getStatesReachedOnlyByPrimaryUnused = (states, primaryUnusedStates, stateTransitionTable) => {
      return states.filter(state => {
        if (primaryUnusedStates.includes(state)) {
          return false; // Already identified as unused
        }

        const incomingStates = stateTransitionTable
          .filter(row => row.nextState === state)
          .map(row => row.currentState);

        // Check if the state is ONLY reached by primary unused states
        const reachedByPrimaryUnused = incomingStates.every(currentState => primaryUnusedStates.includes(currentState));

        if (!reachedByPrimaryUnused) {
          return false; // Exclude if reached by any active state
        }

        // Check if the state has a self-loop or outgoing transitions
        const hasSelfLoop = stateTransitionTable.some(row => row.currentState === state && row.nextState === state);
        const hasOutgoingTransition = stateTransitionTable.some(row => row.currentState === state && row.nextState !== state);

        return (
          (hasSelfLoop && hasOutgoingTransition && reachedByPrimaryUnused) ||  // Self-loop and outgoing transition
          (hasSelfLoop && !hasOutgoingTransition && reachedByPrimaryUnused) || // Only self-loop
          (!hasSelfLoop && hasOutgoingTransition && reachedByPrimaryUnused)    // Only outgoing transition
        );
      });
    };

    // 3. Identify Cascading Unused States
    const getNewlyIdentifiedUnusedStates = (states, unusedStates, stateTransitionTable) => {
      return states.filter(
        state =>
          !unusedStates.includes(state) && // Not already marked as unused
          isReachedOnlyByUnused(state, unusedStates, stateTransitionTable) && // Only reached by unused states (cascading effect)
          (
            stateTransitionTable.some(row => row.currentState === state && row.nextState === state) || // Self-loop
            stateTransitionTable.some(row => row.currentState === state && row.nextState !== state) || // Outgoing transitions
            (
              stateTransitionTable.some(row => row.currentState === state && row.nextState === state) &&
              stateTransitionTable.some(row => row.currentState === state && row.nextState !== state)
            ) // Both self-loop and outgoing transitions
          )
      );
    };

    // Start identifying unused state
    let unusedStates = [...primaryUnusedStates];

    // Identify secondary unused states (Reached only by primary unused states)
    const primaryReachedUnusedStates = getStatesReachedOnlyByPrimaryUnused(states, primaryUnusedStates, stateTransitionTable);
    unusedStates = [...unusedStates, ...primaryReachedUnusedStates];

    // Identify cascading unused states iteratively
    let newlyIdentifiedUnusedStates;
    do {
      newlyIdentifiedUnusedStates = getNewlyIdentifiedUnusedStates(states, unusedStates, stateTransitionTable);
      unusedStates = [...unusedStates, ...newlyIdentifiedUnusedStates];
    } while (newlyIdentifiedUnusedStates.length > 0);
    
    // Ensure reset state is not marked as unused
    unusedStates = unusedStates.filter(state => state !== resetState);
    
    // Create state circles
    states.forEach((state) => {
      const position = positions[state];

      // For Moore FSM, collect unique outputs for the current state
      const uniqueOutputs =
        fsmType === "Moore"
        ? Array.from(new Set(stateTransitionTable.filter(row => row.currentState === state).map(row => row.output)))
        : [];
          
      const circle = new shapes.standard.Circle();
      circle.position(position.x, position.y);
      circle.resize(80, 80);
      circle.attr({
        body: {  
          fill: unusedStates.includes(state) ? "#cccccc" : "#e6d7f3", // Gray for unused states 
          stroke: "#333", 
          strokeWidth: 2 
        },
        label: {
          text: `${state}${fsmType === "Moore" && uniqueOutputs.length > 0 ? `\nZ=${uniqueOutputs.join(",")}` : ""}`,
          fill: "black",
          fontSize: 16,
        },
      });
      circle.addTo(graph);
      stateElements[state] = circle;
    });

    // Check if the reset state has no incoming transitions except itself
    const resetStateHasIncoming = stateTransitionTable.some(
      (row) => row.nextState === resetState && row.currentState !== resetState
    );

    // Display FSM information
    let explanation;
    if (unusedStates.length > 0 && !resetStateHasIncoming) {
      explanation = `State${unusedStates.length > 1 ? "s" : ""} ${unusedStates.join(", ")} ${unusedStates.length > 1 ? "are" : "is"} unused state${unusedStates.length > 1 ? "s" : ""} because no other state transitions into ${unusedStates.length > 1 ? "them" : "it"}.\nReset state is not an unused state because it is the FSM's starting point explicitly entered during initialization.`;
    } else if (unusedStates.length > 0) {
      explanation = `State${unusedStates.length > 1 ? "s" : ""} ${unusedStates.join(", ")} ${unusedStates.length > 1 ? "are" : "is"} unused state${unusedStates.length > 1 ? "s" : ""} because no other state transitions into ${unusedStates.length > 1 ? "them" : "it"}.`;
    } else if (unusedStates.length === 0 && !resetStateHasIncoming) {
      explanation = `All states are reachable except reset state.\nReset state is not an unused state because it is the FSM's starting point explicitly entered during initialization.`;
    } else {
      explanation = "All states are reachable.";
    }
    
    setDiagramInfo(`${fsmType} State Diagram\nAssume State ${resetState} is a reset state.\n${states.length - unusedStates.length} active states, ${unusedStates.length} unused states\n${explanation}`);
    
    // Add grouped transitions
    Object.entries(groupedTransitions).forEach(([key, transitions]) => {
      const [from, to] = key.split("->");

      const link = new shapes.standard.Link();
      // Single transitions
      link.source(stateElements[from]);
      link.target(stateElements[to]);

      // Check for bidirectional transitions
      const reverseKey = `${to}->${from}`;
      const isBidirectional = groupedTransitions[reverseKey];

      if (isBidirectional) {
        // Offset bidirectional transitions
        const deltaX = positions[to].x - positions[from].x;
        const deltaY = positions[to].y - positions[from].y;

        // Specific case for `110 <-> 010`
        if ((from === "110" && to === "010")) {
          const offset = 10; 
          link.source(stateElements[from], { anchor: { name: "center", args: { dx: -offset, dy: -offset } } });
          link.target(stateElements[to], { anchor: { name: "center", args: { dx: -offset, dy: -offset } } });
        } else if ((from === "010" && to === "110")) {
          const offset = 10; 
          link.source(stateElements[from], { anchor: { name: "center", args: { dx: +offset, dy: +offset } } });
          link.target(stateElements[to], { anchor: { name: "center", args: { dx: +offset, dy: +offset } } });
        } else if (deltaX !== 0 || deltaY !== 0) {
          // Adjust anchor points for offset
          const offset = 10; 
          if (deltaX === 0) {
            // Vertical line
            if (from < to) {
              link.source(stateElements[from], { anchor: { name: "center", args: { dx: -offset } } });
              link.target(stateElements[to], { anchor: { name: "center", args: { dx: -offset } } });
            } else {
              link.source(stateElements[from], { anchor: { name: "center", args: { dx: offset } } });
              link.target(stateElements[to], { anchor: { name: "center", args: { dx: offset } } });
            }
          } else if (deltaY === 0) {
            // Horizontal line
            if (from < to) {
              link.source(stateElements[from], { anchor: { name: "center", args: { dy: -offset } } });
              link.target(stateElements[to], { anchor: { name: "center", args: { dy: -offset } } });
            } else {
              link.source(stateElements[from], { anchor: { name: "center", args: { dy: offset } } });
              link.target(stateElements[to], { anchor: { name: "center", args: { dy: offset } } });
            }
          } else {
            // Diagonal line
            const slope = deltaY / deltaX;
            if (from < to) {
              link.source(stateElements[from], { anchor: { name: "center", args: { dx: -offset, dy: offset * slope } } });
              link.target(stateElements[to], { anchor: { name: "center", args: { dx: -offset, dy: offset * slope } } });
            } else {
              link.source(stateElements[from], { anchor: { name: "center", args: { dx: offset, dy: -offset * slope } } });
              link.target(stateElements[to], { anchor: { name: "center", args: { dx: offset, dy: -offset * slope } } });
            }
          }
        }
      }

      // Handle self-loop
      if (from === to) {
        configureSelfLoop(link, positions[from], from, numFlipFlops);
      } else {
        link.connector("normal");
      }

      // Create labels based on FSM type
      const labels =
        fsmType === "Mealy"
          ? transitions.map(t => `${t.input}/${t.output}`).join(", ")
          : Array.from(new Set(transitions.map(t => t.input))).join(", ");

      // Set transition labels based on FSM type
      link.labels([
        {
          position: 0.35,
          attrs: {
            text: {
              text: labels,
              fill: "black",
              fontSize: 14,
              textAnchor: "middle", // Center the text horizontally
              yAlignment: "middle", // Center the text vertically
            },
            rect: {
              fill: "#ffffff", 
              stroke: "#000000", 
              strokeWidth: 1,
              rx: 2, // Rounded corners 
              ry: 2, 
              refWidth: 6, // Scale relative to the text
              refHeight: 2, 
              refX: -2.5, // left padding
              width: "auto", 
              height: "auto", 
            },
          },
        },
      ]);

      link.attr({
        line: {
          stroke: "#000",
          strokeWidth: 2,
          targetMarker: {
            type: "path",
            fill: "#000",
            d: "M 10 -5 0 0 10 5 Z", 
          },
        },
      });

      // Hover and click events handled through Paper
      paper.on("link:mouseenter", (linkView) => {
        if (linkView.model === link) {
          linkView.model.attr({
            line: {
            stroke: "purple", 
            strokeWidth: 3.6,   
            targetMarker: { type: "path", fill: "purple", d: "M 14 -7 0 0 14 7 Z" }, 
            },
          });
        }
      });

      paper.on("link:mouseleave", (linkView) => {
        if (linkView.model === link) {
          linkView.model.attr({
            line: {
              stroke: "#000",  
              strokeWidth: 2,  
              targetMarker: { type: "path", fill: "#000", d: "M 10 -5 0 0 10 5 Z" }, 
            },
          });
        }
      });

      paper.on("link:pointerclick", (linkView) => {
        if (linkView.model === link) {
          setPopupData({
            from,
            to,
            transitions,
          });
          setTransitionShowPopup(true);
        }
      });

      link.addTo(graph);
    });
  }, [stateTransitionTable, fsmType, numFlipFlops, numInputs]);

  // Calculate positions for states
  const calculateStatePositions = (states, numFlipFlops, numInputs) => {
    const positions = {};
    const canvasWidth = 800; 
    const canvasHeight = 800; 
    const centerX = canvasWidth - 250 ; 
    const centerY = canvasHeight / 2; 
    const squareOffset = 180; // Distance from center to the square corners
  
    if (numFlipFlops === 2 && (numInputs === 1 || numInputs === 2)) {
      // Square arrangement for 4 states
      positions["11"] = { x: centerX - squareOffset, y: centerY - squareOffset }; // Top-left
      positions["00"] = { x: centerX + squareOffset, y: centerY - squareOffset }; // Top-right
      positions["10"] = { x: centerX - squareOffset, y: centerY + squareOffset }; // Bottom-left
      positions["01"] = { x: centerX + squareOffset, y: centerY + squareOffset }; // Bottom-right
    } else if (numFlipFlops === 3) {
      // Circular arrangement for 8 states in octagonal shape
      const radius = 300; 
      const orderedStates = ["000", "001", "010", "011", "100", "101", "110", "111"];
      orderedStates.forEach((state, index) => {
        const angle = ((index * 2 * Math.PI) / orderedStates.length) - Math.PI / 2; // Start at top
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        positions[state] = { x, y };
      });
    }
    
    return positions;
  };

  // Configure self-loop for a state
  const configureSelfLoop = (link, position, state, numFlipFlops) => {
    const loopRadius = numFlipFlops === 2 ? 60 : 80;
    const circleRadius = 40; 
    const cornerRadius = 100; // Smooth corners

    if (numFlipFlops === 2) {
      if (state === "00") {
        // Top-right self-loop
        link.vertices([
          { x: position.x + loopRadius + 40, y: position.y - loopRadius - 10 }, // Control point 
          { x: position.x + loopRadius + 100, y: position.y + 20 }, 
        ]);
        link.source({ x: position.x + circleRadius + 10, y: position.y }); // Starting point
        link.target({ x: position.x + circleRadius + 40, y: position.y + circleRadius }); // Arrowhead
      } else if (state === "01") {
        // Bottom-right self-loop
        link.vertices([
          { x: position.x + loopRadius + 100, y: position.y + loopRadius }, 
          { x: position.x + loopRadius + 40, y: position.y + loopRadius + 90 }, 
        ]);
        link.source({ x: position.x + loopRadius + 20, y: position.y + circleRadius }); // Starting point
        link.target({ x: position.x + circleRadius + 10, y: position.y + loopRadius + 20 }); // Arrowhead
      } else if (state === "10") {
        // Bottom-left self-loop
        link.vertices([
          { x: position.x - loopRadius - 20, y: position.y + loopRadius },
          { x: position.x - 20, y: position.y + loopRadius + 90 },
        ]);
        link.source({ x: position.x, y: position.y + circleRadius }); // Starting point
        link.target({ x: position.x + 30, y: position.y + loopRadius + 20 }); // Arrowhead
      } else if (state === "11") {
        // Top-left self-loop
        link.vertices([
          { x: position.x - loopRadius - 20, y: position.y + 20 }, 
          { x: position.x - 20, y: position.y - loopRadius - 10 }, 
        ]);
        link.source({ x: position.x, y: position.y  + circleRadius }); // Starting point
        link.target({ x: position.x + 30, y: position.y }); // Arrowhead
      }
    } else if (numFlipFlops === 3) {
      if (["000", "111"].includes(state)) {
        // Top self-loop
        link.vertices([
          { x: position.x - 10, y: position.y - 60 }, // Top control point
          { x: position.x + loopRadius, y: position.y - 60 }, // Right-top control point
        ]);
        link.source({ x: position.x + 15, y: position.y + 10 }); // Starting point
        link.target({ x: position.x + circleRadius + 25, y: position.y + 10 }); // Arrowhead
      } else if (["001", "010"].includes(state)) {
        // Right self-loop
        link.vertices([
          { x: position.x + loopRadius + circleRadius + 20, y: position.y - 10 }, // Right control point
          { x: position.x + loopRadius + circleRadius + 20, y: position.y + loopRadius }, // Right-bottom control point
        ]);
        link.source({ x: position.x + circleRadius + 30, y: position.y + 15 }); // Starting point
        link.target({ x: position.x + circleRadius + 35, y: position.y + circleRadius + 20 }); // Arrowhead
      } else if (["011", "100"].includes(state)) {
        // Bottom self-loop
        link.vertices([
          { x: position.x + circleRadius + 50, y: position.y + loopRadius + 60 }, // Bottom control point
          { x: position.x - circleRadius + 32, y: position.y + loopRadius + 60 }, // Left-bottom control point
        ]);
        link.source({ x: position.x + circleRadius + 25, y: position.y + circleRadius + 30 }); // Starting point 
        link.target({ x: position.x + 20, y: position.y + circleRadius + 35 }); // Arrowhead 
      } else if (["101", "110"].includes(state)) {
        // Left self-loop
        link.vertices([
          { x: position.x - circleRadius - 25, y: position.y + loopRadius}, // Left control point
          { x: position.x - circleRadius - 25, y: position.y - 10 }, // Left-top control point
        ]);
        link.source({ x: position.x + 6, y: position.y + circleRadius + 20 }); // Starting point 
        link.target({ x: position.x + 8, y: position.y + 15}); // Arrowhead 
      }
    }

    link.connector("rounded", { radius: cornerRadius }); // rounded corners
  };

  // Close popup function
  const closePopup = () => {
    setTransitionShowPopup(false);
    setPopupData(null);
  };

  // Render
  return (
    <div>
      <div id="stateDiagram-info">
        <pre>{diagramInfo}</pre>
      </div>
      <div id="stateDiagram-container" />
      {showTransitionPopup && popupData && (
        <div className="popup-container">
          <div className="popup-contentTransition">
            <button className="close-button" onClick={closePopup}>✖</button>
            <h3>State Transition</h3>
            <p>Q{numFlipFlops === 2 ? "1Q0" : "2Q1Q0"} ➔ Q{numFlipFlops === 2 ? "1'Q0'" : "2'Q1'Q0'"}</p>
            <p>{popupData.from} ➔ {popupData.to}</p>
            <p>X{numInputs === 2 ? "1X0" : "0"}: {popupData.transitions.map(t => t.input).join(", ")}</p>
            <p>Z: {popupData.transitions.map(t => t.output).join(", ")}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CTSConversion;


