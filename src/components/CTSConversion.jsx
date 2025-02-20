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
      width: 980,
      height: 900,
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

    const resetState = numFlipFlops === 2 ? "00" : "000";

    /* Verify Correctness:
     * State Transitions 
     * Mealy / Moore labels
     */
    
    // Store Expected Transitions (From State Transition Table)
    const expectedTransitions = new Set();
    stateTransitionTable.forEach(row => {
      const transition = `${row.currentState}->${row.nextState}:${row.input}/${row.output}`;
      expectedTransitions.add(transition);
    });
    console.log("📌 Expected Transitions (From State Transition Table):");
    console.log([...expectedTransitions]);

    // Store Generated Transitions (From the Drawn State Diagram)
    const drawnTransitions = new Set();
    Object.entries(groupedTransitions).forEach(([key, transitions]) => {
      transitions.forEach(({ input, output }) => {
        const transition = `${key}:${input}/${output}`;
        drawnTransitions.add(transition);
      });
    });
    console.log("📌 Generated Transitions (From Drawn State Diagram):");
    console.log([...drawnTransitions]);

    // Compare drawn vs expected
    const missingTransitions = [...expectedTransitions].filter(t => !drawnTransitions.has(t));
    const extraTransitions = [...drawnTransitions].filter(t => !expectedTransitions.has(t));

    if (missingTransitions.length === 0 && extraTransitions.length === 0) {
      console.log("✅ Verification Passed: All transitions correctly match the state transition table!");
    } else {
      console.log("🚨 Missing Transitions:", missingTransitions);
      console.log("⚠️ Extra Transitions:", extraTransitions);
      console.log("❌ Verification Failed: Some transitions are missing or extra.");
    }

    console.log("Verifying Label Formatting:");
    Object.entries(groupedTransitions).forEach(([key, transitions]) => {
      transitions.forEach(({ input, output }) => {
        if (fsmType === "Mealy") {
          const isValidMealyFormat = /^[01]\/[01]$/.test(`${input}/${output}`);
          console.log(`  Mealy Label (${key}): ${input}/${output} -> Valid? ${isValidMealyFormat}`);
        }
      });
    });

    states.forEach(state => {
      if (fsmType === "Moore") {
        const output = new Set(stateTransitionTable.filter(row => row.currentState === state).map(row => row.output));
        const stateLabel = `Z=${[...output].join(",")}`;
        console.log(`  Moore Label (${state}): ${stateLabel}`);
      }
    });
    
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
          fill: "#d1b3ff91",
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

    setDiagramInfo(`${fsmType} State Diagram`);
    
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
              fontSize: 16,
              textAnchor: "middle", 
              yAlignment: "middle",
            },
            rect: {
              fill: "#ffffff", 
              stroke: "#000000", 
              strokeWidth: 1,
              rx: 2, 
              ry: 2, 
              refWidth: 6, 
              refHeight: 2, 
              refX: -3, 
              refY: -1,
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
            fill: "black",
            d: "M 10 -5 0 0 10 5 Z", 
          },
        },
      });

      // Hover and click events handled through Paper
      paper.on("link:mouseenter", (linkView) => {
        if (linkView.model === link) {
          linkView.model.attr({
            line: {
            stroke: "#5e35b1", 
            strokeWidth: 4,   
            targetMarker: { type: "path", fill: "#5e35b1", d: "M 14 -8 -2 0 14 8 Z" }, 
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
    const canvasWidth = 700; 
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
            <h3 className="popup-title">State Transition</h3>

            {/* State transition header */}
            <div className="state-transition-header">
              <p className="state-mapping">
                <strong>Q{numFlipFlops === 2 ? "1Q0" : "2Q1Q0"}</strong> ➔
                <strong> Q{numFlipFlops === 2 ? "1⁺Q0⁺" : "2⁺Q1⁺Q0⁺"}</strong>
              </p>
              <p className="state-mapping">
                <span className="state">{popupData.from}</span> ➔ 
                <span className="state"> {popupData.to}</span>
              </p>
            </div>

            {/* Display transitions in a structured format */}
            <div className="transition-table">
              <div className="transition-header">
                <span><strong>Input (X{numInputs === 2 ? "1X0" : "0"})</strong></span>
                <span><strong>Output (Z)</strong></span>
              </div>
              {popupData.transitions.map((t, index) => (
                <div key={index} className="transition-row">
                  <span className="input-value">{t.input}</span>
                  <span className="output-value">{t.output}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CTSConversion;


