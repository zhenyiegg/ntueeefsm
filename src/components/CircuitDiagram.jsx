/* CircuitDiagram.jsx */
import React, { useEffect } from 'react';
import '../styles/CircuitToState.css'; // Use the same style for CircuitToState

function CircuitDiagram({ minterms, mintermOutputZ, numInputs, flipFlopType, numFlipFlops, isGenerated }) {

  useEffect(() => {
    const canvas = document.getElementById('circuit-canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Canvas context not found!');
      return;
    }

    // Clear the canvas first
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Only draw the circuit diagram if isGenerated is true
    if (isGenerated) {
      // Example: Draw a simple placeholder circuit diagram
      console.log("Drawing circuit diagram on canvas..."); // Debugging
      ctx.fillStyle = "#b084cc"; // Purple color for the rectangle
      ctx.fillRect(50, 50, 200, 100); // Example rectangle representing the circuit diagram

      // Circuit diagram drawing logic can go here in future
    }

  }, [isGenerated, minterms, mintermOutputZ, numInputs, flipFlopType, numFlipFlops]); // Re-run when any of these values change

  return (
    <div className="canvas-container">
      <canvas id="circuit-canvas" width="600" height="400"></canvas> {/* Always render canvas */}
      
      {/* Display minterms and output Z below the canvas */}
      {isGenerated && (
        <div className="minterms-output">
          <p><strong>Next State Minterms: </strong>{minterms}</p>
          <p><strong>Output Z: </strong>{mintermOutputZ}</p>
        </div>
      )}
    </div>
  );
}

export default CircuitDiagram;




