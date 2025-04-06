/* CircuitDiagram.jsx */
import React, { useEffect, useRef } from 'react';
import p5 from 'p5';
import '../styles/CircuitToState.css';

function CircuitDiagram({  
  numInputs,
  flipFlopType,
  numFlipFlops,
  fsmType,
  isGenerated,
  netlistImages = [],
  setPopupContent,
  setPopupVisible,
  netlistEquations,
  fetchImagesFromNetlists,
  isFetchingImagesRef,
  popupVisible
 }) {
  const canvasRef = useRef(null); // Reference for the canvas container
  const p5InstanceRef = useRef(null); // Store the p5 instance to manage updates and cleanup

  const hoveredBoxRef = useRef(null);

  useEffect(() => {
    // Define the p5 sketch
    const sketch = (p) => {
      const boxWidth = 145;
      const boxHeight = 60;
      const startX = 127;
      const startY = 60;
      const flipFlopSpacing = 140;

      let hoveredBox = null; // track which block is hovered
      let nextStateBox = {};
      let outputLogicBox = {};

      p.setup = () => {
        const canvasHeight = numFlipFlops === '3' ? 530 : 430;
        p.createCanvas(1000, canvasHeight).parent(canvasRef.current);
        p.background(255); // White background
        p.strokeWeight(1.5);

        // Draw diagram only if `isGenerated` is true
        if (isGenerated) {
          p.noLoop();

          // Next State Logic Box
          const nslHeight = (numFlipFlops === '2') ? boxHeight + 200 : boxHeight + 340;
          if (hoveredBox === "nextState") {
            p.fill(178, 102, 255, 140); // Brighter purple when hovered
          } else {
            p.fill(209, 179, 255, 104); // Normal color
          }

          p.rect(startX, startY, boxWidth, nslHeight);
          p.fill(0);
          p.textSize(16);
          p.text('Next State Logic', startX + 15, startY + 100);

          // Save bounding box for hover
          nextStateBox = { x: startX, y: startY, w: boxWidth, h: nslHeight };

          // Draw Inputs (X1, X2)
          for (let i = 0; i < numInputs; i++) {
            if (i === 1) {
              // X1 connects to Next State Logic
              p.line(startX - 100, startY + boxHeight + 110, startX, startY + boxHeight + 110); 
              p.text(`X${i}`, startX - 100, startY + boxHeight + 110 - 10); 

              // Arrowhead X1
              const arrowX1 = startX - 10; 
              const arrowY1 = startY + boxHeight + 110; 
              p.triangle(arrowX1, arrowY1 - 5, arrowX1, arrowY1 + 5, arrowX1 + 10, arrowY1); 

            } else if (i === 0) {
              // X2 connects to Next State Logic
              p.line(startX - 100, startY + boxHeight + 160, startX, startY + boxHeight + 160);
              p.text(`X${i}`, startX - 100, startY + boxHeight + 160 - 10); 

              // Arrowhead X0
              const arrowX0 = startX - 10; 
              const arrowY0 = startY + boxHeight + 160; 
              p.triangle(arrowX0, arrowY0 - 5, arrowX0, arrowY0 + 5, arrowX0 + 10, arrowY0); 
            }
          }

          // Draw Flip-Flops and connections
          for (let i = 0; i < numFlipFlops; i++) {
            const flipFlopIndex = numFlipFlops - 1 - i;
            const flipFlopX = startX + 320;
            const flipFlopY = startY + i * flipFlopSpacing;
            const flipFlopWidth = boxWidth - 35;
            const flipFlopHeight = boxHeight + 60;

            const flipFlopLabelX = flipFlopX + 15;

            const topLabelX = flipFlopX + 80;
            const topLabelY = flipFlopY + 35;

            const bottomLabelX = flipFlopX + 80;
            const bottomLabelY = flipFlopY + 100;

            // Draw Flip-Flop Box
            p.fill("#AD86E6");
            p.rect(flipFlopX, flipFlopY, flipFlopWidth, flipFlopHeight);
            p.fill(0);

            // JK Flip-Flop connections 
            if (flipFlopType === 'JK') {

              p.text(`J`, flipFlopLabelX, topLabelY);
              p.text(`K`, flipFlopLabelX, bottomLabelY);
              p.text(`Q`, topLabelX, topLabelY);
              p.text(`Q’`, bottomLabelX, bottomLabelY);

              // J input (top line) 
              p.line(flipFlopX, topLabelY - 6, startX + boxWidth, topLabelY - 6); 
              p.text(`J${flipFlopIndex}`, startX + boxWidth + 10, topLabelY - 15); 
      

              // K input (bottom line)
              p.line(flipFlopX, bottomLabelY - 6, startX + boxWidth, bottomLabelY - 6);
              p.text(`K${flipFlopIndex}`, startX + boxWidth + 10, bottomLabelY - 15); 

              p.push(); // Save current style settings
              p.fill(0) // fill for J and K arrowhead

              // Arrowhead J
              const arrowXJ = flipFlopX - 10; 
              const arrowYJ = topLabelY - 6; 
              p.triangle(arrowXJ, arrowYJ - 5, arrowXJ, arrowYJ + 5, arrowXJ + 10, arrowYJ); 

              // Arrowhead K
              const arrowXK = flipFlopX - 10; 
              const arrowYK = bottomLabelY - 6; 
              p.triangle(arrowXK, arrowYK - 5, arrowXK, arrowYK + 5, arrowXK + 10, arrowYK); 

              p.push(); 
              p.noFill(); // no fill for the clk triangle
              
              // Arrowhead for clk
              const arrowX1 = flipFlopX; 
              const arrowY1 = flipFlopY + 60; 
              p.triangle(arrowX1, arrowY1 - 5, arrowX1, arrowY1 + 5, arrowX1 + 10, arrowY1);

              // clk line
              p.push();
              p.stroke(131, 80, 163);
              p.line(flipFlopX, flipFlopY + 60, flipFlopX - 80, flipFlopY + 60); // Horizontal
              if (numFlipFlops === '2') {
                p.line(startX + boxWidth + 95, startY + 60, startX + boxWidth + 95, startY + 350); // Vertical
                p.pop();
              } else {
                p.line(startX + boxWidth + 95, startY + 60, startX + boxWidth + 95, startY + 455); // Vertical
                p.pop();
              }

            } else {
              // D and T Flip-Flop connections 
              p.text(`${flipFlopType}`, flipFlopLabelX, topLabelY);
              p.text(`Q`, topLabelX, topLabelY);
              p.text(`Q’`, bottomLabelX, bottomLabelY);
              p.text(`${flipFlopType}${flipFlopIndex}`, startX + boxWidth + 10, topLabelY - 15);

              // Single line for D or T flip-flop
              p.line(startX + boxWidth, topLabelY - 6, flipFlopX, topLabelY - 6); 
        
              p.push();
              p.fill(0); // fill for D and T arrowhead

              // Arrowhead D and T
              const arrowX = flipFlopX - 10; 
              const arrowY = flipFlopY + boxHeight / 2; 
              p.triangle(arrowX, arrowY - 5, arrowX, arrowY + 5, arrowX + 10, arrowY); 

              p.push(); 
              p.noFill(); // no fill for the clk triangle

              // Arrowhead clk
              const arrowX1 = flipFlopX; 
              const arrowY1 = bottomLabelY - 6; 
              p.triangle(arrowX1, arrowY1 - 5, arrowX1, arrowY1 + 5, arrowX1 + 10, arrowY1); 

              p.pop(); // Restore the previous style settings

              // clk line
              p.push();
              p.stroke(131, 80, 163);
              p.line(flipFlopX, bottomLabelY - 6, flipFlopX - 80, bottomLabelY - 6); // Horizontal
              if (numFlipFlops === '2') {
                p.line(startX + boxWidth + 95, startY + 95, startX + boxWidth + 95, startY + 350); // Vertical
                p.pop();
              } else {
                p.line(startX + boxWidth + 95, startY + 95, startX + boxWidth + 95, startY + 455); // Vertical
                p.pop();
              }
            }

            // line to clk label
            if (numFlipFlops === '2') {
              p.push();
              p.stroke(131, 80, 163);
              p.line(startX + boxWidth + 95, startY + 350, startX - 100, startY + 350); // Horizontal
              p.pop();
              p.push();
              p.fill(131, 80, 163);
              p.text(`CLK`, startX - 100, startY + 350 - 10);
              p.pop();
            } else {
              p.push();
              p.stroke(131, 80, 163);
              p.line(startX + boxWidth + 95, startY + 455, startX - 100, startY + 455); // Horizontal
              p.pop();
              p.push();
              p.fill(131, 80, 163);
              p.text(`CLK`, startX - 100, startY + 455 - 10);
              p.pop();
            }

            /**
             * Connection from Flip-Flop outputs (Q') back to Next State Logic
             * Route the line ABOVE the diagram to avoid overlap
             */
            
            p.line(flipFlopX + flipFlopWidth, flipFlopY + boxHeight / 2, flipFlopX + flipFlopWidth + 90, flipFlopY + boxHeight / 2); // Q Horizontal FF to middle vertical line
            p.line(flipFlopX + flipFlopWidth, bottomLabelY - 6, flipFlopX + flipFlopWidth + 90, bottomLabelY - 6); // Q' Horizontal FF to middle vertical line

            p.push();
            p.strokeWeight(6); // stroke thickness for line to nest state logic

            p.line(flipFlopX + flipFlopWidth + 90, flipFlopY + 92, flipFlopX + flipFlopWidth + 90, 25); // Vertical upwards
            p.line(flipFlopX + boxWidth + 55, 25, startX + boxWidth / 2, 25); // Horizontal above diagram
            p.line(startX + boxWidth / 2, 25, startX + boxWidth / 2, startY - 10); // Vertical down to Next State Logic

            p.pop();
            p.push(); 
            p.fill(0); // fill for J arrowhead
            
            // Downward-pointing arrowhead to Next State Logic
            const arrowX = startX + boxWidth / 2; 
            const arrowY = startY; 
            p.triangle(arrowX - 5, arrowY - 10, arrowX + 5, arrowY - 10, arrowX, arrowY); // Draw arrowhead

            // Label for Flip-Flop Outputs Q#
            p.text(`Q${flipFlopIndex}`, flipFlopX + flipFlopWidth + 56, topLabelY - 15);
            p.text(`Q${flipFlopIndex}’`, flipFlopX + flipFlopWidth + 56, bottomLabelY - 15);
          } 

          // Draw Output Logic Box
          const outputX = startX + 600;
          const outputY = startY + flipFlopSpacing - 40;

          if (hoveredBox === "outputLogic") {
            p.fill(178, 102, 255, 140); // Brighter purple on hover
          } else {
            p.fill(209, 179, 255, 104);
          }

          p.rect(outputX, outputY, boxWidth, boxHeight);
          p.fill(0);
          p.text("Output Logic", outputX + 28, outputY + 35);

          outputLogicBox = { x: outputX, y: outputY, w: boxWidth, h: boxHeight };

          p.push();
          p.strokeWeight(6); // stroke thickness for line to output

          // Line from middle to Output Logic 
          p.line(outputX - 10, outputY + boxHeight / 2, outputX - 78, outputY + boxHeight / 2); // middle to output

          p.pop();
          
          // Arrowhead to Output Logic
          const arrowXZ = outputX - 10; 
          const arrowYZ = outputY + boxHeight / 2; 
            p.triangle(arrowXZ, arrowYZ - 5, arrowXZ, arrowYZ + 5, arrowXZ + 10, arrowYZ); 
          
          // Line from Output Logic to nowhere
          p.line(outputX + boxWidth, outputY + boxHeight / 2, outputX + boxWidth + 100, outputY + boxHeight / 2);
          p.text('Z', outputX + boxWidth + 70, outputY + (boxHeight / 2) - 8); 

          // Arrowhead Z
          const arrowX = outputX + boxWidth + 90; 
          const arrowY = outputY + boxHeight / 2; 
          p.triangle(arrowX, arrowY - 5, arrowX, arrowY + 5, arrowX + 10, arrowY); 

          // Mealy Machine connection (X to Output Logic)
          if (fsmType === 'Mealy') {
            // Upward-pointing arrowhead to Output Logic
            const arrowX1 = (outputX + boxWidth / 2) + 10; 
            const arrowX0 = (outputX + boxWidth / 2) - 10; 

            const arrowX = (outputX + boxWidth / 2);
            const arrowY = outputY + boxHeight; 

            p.push();
            p.stroke(34, 139, 34);
            p.fill(34, 139, 34);

            if (numFlipFlops === '3') {
              // Draw X going under the diagram to avoid overlap (orthogonal)
              p.line(startX - 30, startY + boxHeight + 160, startX - 30, startY + boxHeight + 370); // Go down
              p.line(startX - 30, startY + boxHeight + 370, outputX + boxWidth / 2 , startY + boxHeight + 370); // Go right
              p.line(outputX + boxWidth / 2, outputY + boxHeight, outputX + boxWidth / 2, outputY + boxHeight + 270); // Connect to output logic
            
              p.triangle(arrowX - 5, arrowY + 10, arrowX + 5, arrowY + 10, arrowX, arrowY); 

            } else {
              if (numInputs === '1') {
                p.line(startX - 30, startY + boxHeight + 160, startX - 30, startY + boxHeight + 240); // Go down

                p.line(startX - 30, startY + boxHeight + 240, (outputX + boxWidth / 2), startY + boxHeight + 240); // Go right
                p.line((outputX + boxWidth / 2), outputY + boxHeight, (outputX + boxWidth / 2), outputY + boxHeight + 140); // Connect to output logic
            
                p.triangle(arrowX - 5, arrowY + 10, arrowX + 5, arrowY + 10, arrowX, arrowY); 
              }
              else if (numInputs === '2') {
                p.line(startX - 50, startY + boxHeight + 110, startX - 50, startY + boxHeight + 260); // Go down X1
                p.line(startX - 30, startY + boxHeight + 160, startX - 30, startY + boxHeight + 240); // Go down X0

                // X1
                p.line(startX - 50, startY + boxHeight + 260, (outputX + boxWidth / 2) + 10, startY + boxHeight + 260); // Go right
                p.line((outputX + boxWidth / 2) + 10, outputY + boxHeight, (outputX + boxWidth / 2) + 10, outputY + boxHeight + 160); // Connect to output logic

                // X0
                p.line(startX - 30, startY + boxHeight + 240, (outputX + boxWidth / 2) - 10 , startY + boxHeight + 240); // Go right
                p.line((outputX + boxWidth / 2) - 10, outputY + boxHeight, (outputX + boxWidth / 2) - 10, outputY + boxHeight + 140); // Connect to output logic

                p.triangle(arrowX1 - 5, arrowY + 10, arrowX1 + 5, arrowY + 10, arrowX1, arrowY); 
                p.triangle(arrowX0 - 5, arrowY + 10, arrowX0 + 5, arrowY + 10, arrowX0, arrowY); 
              }
            }
            p.pop();
          }
        }
      };

      p.draw = () => {
        p.clear(); // Clears the previous canvas
        p.setup(); // Re-draw everything with hover effect
      };
      
      p.mouseMoved = () => {
        const x = p.mouseX;
        const y = p.mouseY;

        let newHoveredBox = null;
    
        if (x >= nextStateBox.x && x <= nextStateBox.x + nextStateBox.w &&
            y >= nextStateBox.y && y <= nextStateBox.y + nextStateBox.h) {
          newHoveredBox = "nextState";
          if (p._curElement) p.cursor(p.HAND);
        } else if (x >= outputLogicBox.x && x <= outputLogicBox.x + outputLogicBox.w &&
                   y >= outputLogicBox.y && y <= outputLogicBox.y + outputLogicBox.h) {
          newHoveredBox = "outputLogic";
          if (p._curElement) p.cursor(p.HAND);
        } else {
          if (p._curElement) p.cursor(p.ARROW);
        }
        if (newHoveredBox !== hoveredBox) {
          hoveredBox = newHoveredBox;
          p.redraw(); // trigger canvas redraw to reflect color change
        }
      };

      p.mousePressed = () => {
        if (!hoveredBox) return;

        hoveredBoxRef.current = hoveredBox; // Track which box was clicked

        const imagesExist = netlistImages && netlistImages.length > 0;
        setPopupVisible(true);
        
        if (!imagesExist || isFetchingImagesRef?.current) {
          setPopupContent([]); // Show loading spinner
          if (!isFetchingImagesRef.current && netlistEquations?.length > 0) {
            fetchImagesFromNetlists(netlistEquations);
          } else {
            // Just show filtered cached images
            const ffImages = netlistImages.filter(img => !img.label.includes("Z"));
            const zImages = netlistImages.filter(img => img.label.includes("Z"));
            setPopupContent(hoveredBox === "nextState" ? ffImages : zImages);
          }
        };
      };
    };

    // Cleanup the previous p5 instance if it exists
    if (p5InstanceRef.current) {
      p5InstanceRef.current.remove();
    }

    // Create a new p5 instance and attach it to the canvas container
    p5InstanceRef.current = new p5(sketch);

    // Cleanup the p5 instance on unmount
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
      }
    };
  }, [isGenerated, numInputs, flipFlopType, numFlipFlops, fsmType, netlistImages, setPopupContent, setPopupVisible, netlistEquations, fetchImagesFromNetlists, isFetchingImagesRef]);

  useEffect(() => {
    if (!netlistImages || netlistImages.length === 0) return;
  
    const ffImages = netlistImages.filter(img => !img.label.includes("Z"));
    const zImages = netlistImages.filter(img => img.label.includes("Z"));
  
    // Determine which popup was last opened
    const latestHover = hoveredBoxRef.current;

    if (popupVisible) {
      if (latestHover === "nextState") {
        setPopupContent(ffImages);
      } else if (latestHover === "outputLogic") {
        setPopupContent(zImages);
      }
    }
  }, [netlistImages, popupVisible, setPopupContent]);  

  return (
    <div className="canvas-container">
      <div ref={canvasRef} className="p5-canvas-container" /> {/* Canvas container is always visible */}
    </div>
  );
}

export default CircuitDiagram;
