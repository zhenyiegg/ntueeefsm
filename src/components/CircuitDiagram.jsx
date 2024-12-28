/* CircuitDiagram.jsx */
import React, { useEffect, useRef } from 'react';
import p5 from 'p5';
import '../styles/CircuitToState.css';

function CircuitDiagram({  numInputs, flipFlopType, numFlipFlops, fsmType, isGenerated }) {
  const canvasRef = useRef(null); // Reference for the canvas container
  const p5InstanceRef = useRef(null); // Store the p5 instance to manage updates and cleanup

  useEffect(() => {
    // Define the p5 sketch
    const sketch = (p) => {
      const boxWidth = 150;
      const boxHeight = 60;
      const startX = 230;
      const startY = 80;
      const flipFlopSpacing = 100;

      p.setup = () => {
        // Attach the canvas to the existing canvas container
        p.createCanvas(1200, 400).parent(canvasRef.current);
        p.background(255); // White background
        p.strokeWeight(1.5);

        // Draw diagram only if `isGenerated` is true
        if (isGenerated) {
          // State Logic Box
          p.fill(230, 230, 250); // Light purple
          p.rect(startX, startY, boxWidth, boxHeight);
          p.fill(0);
          p.textSize(16);
          p.text('State Logic', startX + 30, startY + 35);

          // Draw Inputs (X1, X2)
          for (let i = 0; i < numInputs; i++) {
            if (i === 0) {
              // X1 connects to the top half of State Logic
              p.line(startX - 100, startY + boxHeight / 4, startX, startY + boxHeight / 4); // X1 line
              p.text('X1', startX - 100, startY + boxHeight / 4 - 5); // Label for X1

              // Arrowhead for right-pointing arrow
              const arrowX1 = startX - 10; // X-coordinate of arrow tip
              const arrowY1 = startY + boxHeight / 4; // Y-coordinate
              p.triangle(arrowX1, arrowY1 - 5, arrowX1, arrowY1 + 5, arrowX1 + 10, arrowY1); // Draw arrowhead

            } else if (i === 1) {
              // X2 connects to the bottom half of State Logic
              p.line(startX - 100, startY + (3 * boxHeight) / 4, startX, startY + (3 * boxHeight) / 4); // X2 line
              p.text('X2', startX - 100, startY + (3 * boxHeight) / 4 - 5); // Label for X2

              // Arrowhead for right-pointing arrow
              const arrowX2 = startX - 10; 
              const arrowY2 = startY + (3 * boxHeight) / 4; 
              p.triangle(arrowX2, arrowY2 - 5, arrowX2, arrowY2 + 5, arrowX2 + 10, arrowY2); 
            }
          }

          // Draw Flip-Flops and connections
          for (let i = 0; i < numFlipFlops; i++) {
            const flipFlopX = startX + 300;
            const flipFlopY = startY + i * flipFlopSpacing;

            // Draw Flip-Flop Box
            p.fill(230, 230, 250);
            p.rect(flipFlopX, flipFlopY, boxWidth, boxHeight);
            p.fill(0);
            p.text(`${flipFlopType} Flip-Flop`, flipFlopX + 32, flipFlopY + 35);

            // JK Flip-Flop connections with two lines and individual labels
            if (flipFlopType === 'JK') {
              // J input (top line)
              p.line(startX + boxWidth, startY + 15, startX + boxWidth + 50, startY + 15); // Horizontal segment
              p.line(startX + boxWidth + 50, startY + 20, startX + boxWidth + 50, flipFlopY + 20); // Vertical segment
              p.line(startX + boxWidth + 50, flipFlopY + 15, flipFlopX, flipFlopY + 15); // Horizontal to connect to J
              p.text(`J${i + 1}_input`, startX + boxWidth + 60, flipFlopY + 8); // Label for J input line

              // Arrowhead for right-pointing arrow
              const arrowXJ1 = flipFlopX - 10; 
              const arrowYK1 = flipFlopY + 15; 
              p.triangle(arrowXJ1, arrowYK1 - 5, arrowXJ1, arrowYK1 + 5, arrowXJ1 + 10, arrowYK1); 

              // K input (bottom line)
              p.line(startX + boxWidth, startY + 45, startX + boxWidth + 50, startY + 45); // Horizontal segment
              p.line(startX + boxWidth + 50, startY + 15, startX + boxWidth + 50, flipFlopY + 45); // Vertical segment
              p.line(startX + boxWidth + 50, flipFlopY + 45, flipFlopX, flipFlopY + 45); // Horizontal to connect to K
              p.text(`K${i + 1}_input`, startX + boxWidth + 60, flipFlopY + 38); // Label for K input line

              // Arrowhead for right-pointing arrow
              const arrowXJ2 = flipFlopX - 10; 
              const arrowYK2 = flipFlopY + 45; 
              p.triangle(arrowXJ2, arrowYK2 - 5, arrowXJ2, arrowYK2 + 5, arrowXJ2 + 10, arrowYK2); 

            } else {
              // Single line for D or T flip-flop
              p.line(startX + boxWidth, startY + boxHeight / 2, startX + boxWidth + 50, startY + boxHeight / 2); // Horizontal segment
              p.line(startX + boxWidth + 50, startY + boxHeight / 2, startX + boxWidth + 50, flipFlopY + boxHeight / 2); // Vertical segment
              p.line(startX + boxWidth + 50, flipFlopY + boxHeight / 2, flipFlopX, flipFlopY + boxHeight / 2); // Horizontal to connect
              if (flipFlopType === 'D') {
                p.text(`D${i + 1}_input`, startX + boxWidth + 60, flipFlopY + boxHeight / 2 - 10); // Minterm label
              }
              if (flipFlopType === 'T') {
                p.text(`T${i + 1}_input`, startX + boxWidth + 60, flipFlopY + boxHeight / 2 - 10); // Minterm label
              }

              // Arrowhead for right-pointing arrow
              const arrowX = flipFlopX - 10; 
              const arrowY = flipFlopY + boxHeight / 2; 
              p.triangle(arrowX, arrowY - 5, arrowX, arrowY + 5, arrowX + 10, arrowY); 
            }

            // Connection from Flip-Flop outputs (Q#) back to State Logic
            // Route the line ABOVE the diagram to avoid overlap
            p.line(flipFlopX + boxWidth, flipFlopY + boxHeight / 2, flipFlopX + boxWidth + 80, flipFlopY + boxHeight / 2); // Horizontal segment
            p.line(flipFlopX + boxWidth + 80, flipFlopY + boxHeight / 2, flipFlopX + boxWidth + 80, 30); // Vertical upwards (above diagram)
            p.line(flipFlopX + boxWidth + 80, 30, startX + boxWidth / 2, 30); // Horizontal above diagram
            p.line(startX + boxWidth / 2, 30, startX + boxWidth / 2, startY); // Vertical down to State Logic
            
            // Draw downward-pointing arrowhead
            const arrowX = startX + boxWidth / 2; // X-coordinate 
            const arrowY = startY; // Y-coordinate
            p.triangle(arrowX - 5, arrowY - 10, arrowX + 5, arrowY - 10, arrowX, arrowY); // Draw arrowhead
          } 

          // Draw Output Logic Box
          const outputX = startX + 600;
          const outputY = startY + flipFlopSpacing;
          p.fill(230, 230, 250);
          p.rect(outputX, outputY, boxWidth, boxHeight);
          p.fill(0);
          p.text("Output Logic", outputX + 28, outputY + 35);

          // Line from Flip-Flop to Output Logic (orthogonal)
          for (let i = 0; i < numFlipFlops; i++) {
            const flipFlopX = startX + 320;
            const flipFlopY = startY + i * flipFlopSpacing;

            //p.line(flipFlopX + 20, flipFlopY + boxHeight / 2, flipFlopX + boxWidth + 10, flipFlopY + boxHeight / 2); // Horizontal segment
            p.line(flipFlopX + boxWidth + 60, flipFlopX + boxWidth + 60, outputY + boxHeight / 2); // Vertical segment
            p.line(flipFlopX + boxWidth + 60, outputY + boxHeight / 2, outputX, outputY + boxHeight / 2); // Connect horizontally
          
            // Label for Flip-Flop Outputs Q#
            p.text(`Q${i + 1}`, flipFlopX + boxWidth + 35, flipFlopY + (boxHeight / 2) - 5);

            // Arrowhead for right-pointing arrow
            const arrowX = outputX - 10; 
            const arrowY = outputY + boxHeight / 2; 
            p.triangle(arrowX, arrowY - 5, arrowX, arrowY + 5, arrowX + 10, arrowY); 
          }

          // Line from Output Logic to nowhere (Z Minterms)
          p.line(outputX + boxWidth, outputY + boxHeight / 2, outputX + boxWidth + 100, outputY + boxHeight / 2);
          p.text('Z', outputX + boxWidth + 40, outputY + (boxHeight / 2) - 5); // Position label on the line

          // Arrowhead for right-pointing arrow
          const arrowX = outputX + boxWidth + 90; 
          const arrowY = outputY + boxHeight / 2; 
          p.triangle(arrowX, arrowY - 5, arrowX, arrowY + 5, arrowX + 10, arrowY); 

          // Mealy Machine connection (X to Output Logic)
          if (fsmType === 'Mealy') {
            // Draw X going under the diagram to avoid overlap (orthogonal)
            p.line(startX - 40, startY + 15, startX - 40, startY + 290); // Go down and shortened height
            p.line(startX - 40, startY + 290, outputX + boxWidth / 2 , startY + 290); // Go right
            p.line(outputX + boxWidth / 2, startY + 290, outputX + boxWidth / 2, outputY + boxHeight); // Connect to output logic

            // Draw upward-pointing arrowhead
            const arrowX = outputX + boxWidth / 2; 
            const arrowY = outputY + boxHeight; 
            p.triangle(arrowX - 5, arrowY + 10, arrowX + 5, arrowY + 10, arrowX, arrowY); 
          }
        }
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
  }, [isGenerated, numInputs, flipFlopType, numFlipFlops, fsmType]);

  return (
    <div className="canvas-container">
      <div ref={canvasRef} className="p5-canvas-container" /> {/* Canvas container is always visible */}
    </div>
  );
}

export default CircuitDiagram;
