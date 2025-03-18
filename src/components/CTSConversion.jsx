/* CTSConversion.jsx */
import React, { useEffect, useState } from "react";
import { dia, shapes } from "jointjs";
import "../styles/CTSConversion.css";

const CTSConversion = ({ stateTransitionTable, fsmType, numFlipFlops, numInputs }) => {
  const [diagramInfo, setDiagramInfo] = useState("");
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupContent, setPopupContent] = useState("");
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const closePopup = (event) => {
    if (!event || event.target.classList.contains("popup-overlay")) {
      setPopupVisible(false);
    }
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
      event.preventDefault(); // Prevent scrolling or tabbing effect
      closePopup();
    };
  
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, []);

  useEffect(() => {

    const paperHeight = (() => {
      if (numFlipFlops === 2) {
        return 800; // Shorter height for 2 flip-flops (either 1 or 2 inputs)
      } else if (numFlipFlops === 3 && numInputs === 1) {
        return 860; 
      }
      return 1000; // Default height
    })();

    const graph = new dia.Graph();
    const paper = new dia.Paper({
      el: document.getElementById("stateDiagram-container"),
      model: graph,
      width: 1000,
      height: paperHeight,
      gridSize: 1,
      interactive: false,
    });

    const stateElements = {}; // Store references to state circles

    // Determine reset state based on flip-flops
    const resetState = numFlipFlops === 2 ? "00" : "000";

    // Position "Any state" oval above the diagram
    const anyStatePos = (() => {
      if (numFlipFlops === 2) {
        return { x: 350, y: 40 }; 
      } else if (numFlipFlops === 3) {
        if (numInputs === 1) {
          return { x: 750, y: 40 }; 
        } else {
          return { x: 750, y: 40 }; 
        }
      }
      return { x: 350, y: 50 }; // Default fallback
    })();

    // "Any state" oval 
    const anyState = new shapes.standard.Ellipse();
    anyState.position(anyStatePos.x, anyStatePos.y);
    anyState.resize(150, 60);
    anyState.attr({
      body: {
        fill: "#ffffff",
        stroke: "#000",
        strokeWidth: 2,
        strokeDasharray: "5,5", // Dashed border
      },
      label: {
        text: "Any state",
        fill: "#000",
        fontSize: 16,
      },
    });
    anyState.addTo(graph);

    // Store reference to "Any state"
    stateElements["AnyState"] = anyState;

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
    
    // Create state circles
    states.forEach((state) => {
      const position = positions[state];

      // For Moore FSM, collect unique outputs for the current state
      const mooreOutput =
        fsmType === "Moore"
        ? Array.from(new Set(stateTransitionTable.filter(row => row.currentState === state).map(row => row.output)))
        : [];

      const stateLabel = fsmType === "Moore"
        ? `${state}\n───\n${mooreOutput}` // Line Separator + Output Below
        : `${state}`; // Default for Mealy (no output)
          
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
          text: stateLabel,
          fill: "black",
          fontSize: 16,
        },
      });
      circle.addTo(graph);
      stateElements[state] = circle;
    });

    if (stateElements[resetState]) {
      const resetArrow = new shapes.standard.Link();
      resetArrow.source(stateElements["AnyState"]); // Link from "Any state"
      resetArrow.target(stateElements[resetState]); // Link to the reset state

      resetArrow.attr({
        line: {
          stroke: "#000",
          strokeWidth: 2,
          targetMarker: { type: "path", fill: "#000", d: "M 10 -5 0 0 10 5 Z" },
        },
      });

      // Add "RESET" label with overline
      resetArrow.labels([
        {
          position: 0.5,
          attrs: {
            text: {
              text: "RESET",
              fill: "#000",
              fontSize: 16,
              textDecoration: "overline",
            },
            rect: {
              fill: "#ffffff", 
              stroke: "#000000", 
              strokeWidth: 1,
              rx: 2, 
              ry: 2, 
              refWidth: 6, 
              refHeight: 8, 
              refX: -3, 
              refY: -6,
            },
          },
        },
      ]);

      resetArrow.addTo(graph);
    } else {
      console.error("❌ Reset state not found in stateElements. Cannot create reset arrow.");
    }

    /**
     * Verify Correctness:
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

    setDiagramInfo(`${fsmType}`);

    // Scroll Event
    const handleScroll = () => {
      setTooltipVisible(false);
      document.removeEventListener("mousemove", handleMouseMove);
    
      // Reset all arrows to black when scrolling
      graph.getLinks().forEach((link) => {
        link.attr({
          line: {
            stroke: "#000",
            strokeWidth: 2,
            targetMarker: { type: "path", fill: "#000", d: "M 10 -5 0 0 10 5 Z" },
          },
        });
      });
    };

    // Attach scroll event only once
    window.addEventListener("scroll", handleScroll);

    // Mouse move function (Used for tooltip tracking)
    const handleMouseMove = (event) => {
      setTooltipPosition({
        x: event.clientX + 15, 
        y: event.clientY + 25, 
      });
    };
    
    // Iterate transitions
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
              fontSize: 18,
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
              refY: -2,
              width: "auto", 
              height: "auto", 
            },
          },
        },
      ]);

      // Hover event to show tooltip
      paper.on("link:mouseenter", (linkView) => {
        if (linkView.model === link) {
          linkView.model.attr({
            line: {
            stroke: "#5e35b1", 
            strokeWidth: 4,   
            targetMarker: { type: "path", fill: "#5e35b1", d: "M 14 -8 -2 0 14 8 Z" }, 
            },
          });

          linkView.model.labels([{
            position: 0.35,
            attrs: {
              text: {
                text: labels,
                fill: "black",
                fontSize: 18,
                textAnchor: "middle", 
                yAlignment: "middle",
              },
              rect: {
                fill: "#d1b3ff", 
                stroke: "#5e35b1", 
                strokeWidth: 1,
                rx: 2, 
                ry: 2, 
                refWidth: 6, 
                refHeight: 2, 
                refX: -3, 
                refY: -2,
                width: "auto", 
                height: "auto", 
              },
            },
          }]);

          const stateLabel = `Q${numFlipFlops === 2 ? "1Q0" : "2Q1Q0"} ➔ Q${numFlipFlops === 2 ? "1⁺Q0⁺" : "2⁺Q1⁺Q0⁺"}`;
          const transitionLabel = `${from} ➔ ${to}`;
          const inputLabel = `X${numInputs === 2 ? "1X0" : "0"}`;

          const isMealy = fsmType === "Mealy";
          const transitionDetails = transitions
            .map((t) => isMealy ? `${inputLabel}: ${t.input}, Z: ${t.output}` : `${inputLabel}: ${t.input}`)
            .join("\n");

          setTooltipContent(`${stateLabel}\n${transitionLabel}\n${transitionDetails}`);

          setTooltipVisible(true);

          // Attach Global Mouse Move Event Once
          document.addEventListener("mousemove", handleMouseMove);
        }
      });

      // Mouse leave event to hide tooltip
      paper.on("link:mouseleave", (linkView) => {
        if (linkView.model === link) {
          linkView.model.attr({
            line: {
              stroke: "#000",  
              strokeWidth: 2,  
              targetMarker: { type: "path", fill: "#000", d: "M 10 -5 0 0 10 5 Z" }, 
            },
          });

          linkView.model.labels([{
            position: 0.35,
            attrs: {
              text: {
                text: labels,
                fill: "black",
                fontSize: 18,
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
                refY: -2,
                width: "auto", 
                height: "auto", 
              },
            },
          }]);

          setTooltipVisible(false);

          // Remove mouse tracking event
          document.removeEventListener("mousemove", handleMouseMove);
        }
      });

      // Click to Open Popup
      paper.on("link:pointerclick", (linkView, evt) => {
        if (linkView.model === link) {
          evt.stopPropagation(); // Prevents event bubbling
          evt.preventDefault(); // Prevents accidental page actions

          const stateLabel = `Q${numFlipFlops === 2 ? "1Q0" : "2Q1Q0"} ➔ Q${numFlipFlops === 2 ? "1⁺Q0⁺" : "2⁺Q1⁺Q0⁺"}`;
          const transitionLabel = `${from} ➔ ${to}`;
          const inputLabel = `X${numInputs === 2 ? "1X0" : "0"}`;

          const transitionDetails = transitions
            .map((t) => fsmType === "Mealy" ? `${inputLabel}: ${t.input}, Z: ${t.output}` : `${inputLabel}: ${t.input}`)
            .join("\n");

          setPopupContent(`${stateLabel}\n${transitionLabel}\n${transitionDetails}`);
          setPopupVisible(true);
        }
      });

      link.addTo(graph);
    });

    // Cleanup function (removes event listeners on unmount)
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [stateTransitionTable, fsmType, numFlipFlops, numInputs]);

  // Calculate positions for states
  const calculateStatePositions = (states, numFlipFlops, numInputs) => {
    const positions = {};
    const canvasWidth = 700; 
    //const canvasHeight = 900; 
    const baseHeight = numFlipFlops === 3 ? 750 : 710;
    const centerX = canvasWidth - 250 ; 
    const centerY = baseHeight / 2; 
    const squareOffset = 180;
  
    if (numFlipFlops === 2 && (numInputs === 1 || numInputs === 2)) {
      // Square arrangement for 4 states
      positions["11"] = { x: centerX - squareOffset, y: centerY - squareOffset }; // Top-left
      positions["00"] = { x: centerX + squareOffset, y: centerY - squareOffset }; // Top-right
      positions["10"] = { x: centerX - squareOffset, y: centerY + squareOffset }; // Bottom-left
      positions["01"] = { x: centerX + squareOffset, y: centerY + squareOffset }; // Bottom-right
    } else if (numFlipFlops === 3) {
      // Circular arrangement for 8 states in octagonal shape
      const radius = 260; 
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

  // Render
  return (
    <div>
      <div id="stateDiagram-info">
        <pre>{diagramInfo}</pre>
      </div>
      <div className="state-diagram-wrapper">
        <div id="stateDiagram-container" />
      </div>
      {tooltipVisible && (
        <div 
          className="tooltip-cts"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
          }}
        >
          {tooltipContent}
        </div>
      )}
      {popupVisible && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-transition">
            <h2>State Transition</h2>
            <pre>{popupContent}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default CTSConversion;


