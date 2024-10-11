import React, { useEffect, useRef } from "react";
import { dia, shapes } from "jointjs";

const STCConversion = ({ diagramType, flipFlopType, transitionTable }) => {
    const paperRef = useRef(null);
    const paperInstance = useRef(null);

    useEffect(() => {
        const convertToCircuit = () => {
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

            const flipFlops = [];
            const flipFlopPositions = {}; // Store flip-flop positions to avoid overlap

            // Create a grid layout for the flip-flops
            const rows = 3;
            const cols = Math.ceil(transitionTable.length / rows);
            const spacingX = 200; // Horizontal space between flip-flops
            const spacingY = 150; // Vertical space between flip-flops

            // Create flip-flops and place them in a grid layout
            transitionTable.forEach((row, index) => {
                const rowIndex = Math.floor(index / cols);
                const colIndex = index % cols;
                const x = 100 + colIndex * spacingX;
                const y = 100 + rowIndex * spacingY;

                const flipFlop = new shapes.standard.Rectangle();
                flipFlop.position(x, y);
                flipFlop.resize(100, 60);
                flipFlop.attr({
                    body: {
                        fill: "#9CDBA8",
                    },
                    label: {
                        text: `${flipFlopType} Flip-Flop\n${row.presentState}`,
                        fill: "black",
                        fontSize: 14,
                    },
                });
                flipFlop.addTo(graph);
                flipFlops.push(flipFlop);
                flipFlopPositions[row.presentState] = flipFlop;
            });

            // Create connections between flip-flops based on the transition table
            transitionTable.forEach((row, index) => {
                const sourceFlipFlop = flipFlopPositions[row.presentState];
                const targetFlipFlop = flipFlopPositions[row.nextState];

                const link = new shapes.standard.Link();
                link.source(sourceFlipFlop);
                link.target(targetFlipFlop);
                link.connector("smooth");
                link.appendLabel({
                    attrs: {
                        text: {
                            text: `Input ${row.input}, Output ${row.output}`,
                            fill: "black",
                            fontSize: 14,
                        },
                    },
                });
                link.addTo(graph);
            });

            // Scale the content to fit within the paper
            paperInstance.current.scaleContentToFit({
                padding: 20,
                minScaleX: 0.5,
                minScaleY: 0.5,
                maxScaleX: 1,
                maxScaleY: 1,
            });
        };

        if (transitionTable.length > 0 && paperRef.current) {
            convertToCircuit();
        }
    }, [diagramType, flipFlopType, transitionTable]);

    return (
        <div>
            <h2>Generated Circuit Diagram</h2>
            <div
                ref={paperRef}
                style={{
                    width: "1200px",
                    height: "800px",
                    border: "1px solid black",
                }}
            ></div>
        </div>
    );
};

export default STCConversion;
