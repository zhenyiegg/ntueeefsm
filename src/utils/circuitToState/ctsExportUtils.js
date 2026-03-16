import JSZip from "jszip";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";

// File Name for download
const getBaseFileName = (generateState) => {
  const today = new Date();
  const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, "");

  const fsmType = generateState.fsmType?.toLowerCase() || "unknown";
  const ffTypeMap = { D: "dff", T: "tff", JK: "jkff" };
  const ffType = ffTypeMap[generateState.flipFlopType] || "unknown";
  const numFF = generateState.numFlipFlops || "0";
  const numInputs = generateState.numInputs || "0";

  return `fsm_${fsmType}_${ffType}_${numFF}_${numInputs}_${yyyymmdd}`;
};

// Export tables to csv
const exportToCSV = ({
  tableType,
  generateState,
  excitationTable,
  stateTransitionTable,
  hiddenExcitationCorrectAnswers,
  hiddenStateTransitionCorrectAnswers,
}) => {
  let csvContent = "data:text/csv;charset=utf-8,";
  let headers = [];
  let rows = [];

  const { numFlipFlops, numInputs } = generateState;

  const currentStateHeader = `Current State ${Array.from({ length: numFlipFlops }, (_, i) => `Q${numFlipFlops - 1 - i}`).join("")}`;
  const inputHeader = `Input ${Array.from({ length: numInputs }, (_, i) => `X${numInputs - 1 - i}`).join("")}`;
  const nextStateHeader = `Next State ${Array.from({ length: numFlipFlops }, (_, i) => `Q${numFlipFlops - 1 - i}*`).join("")}`;

  if (tableType === "excitation") {
    headers = [
      currentStateHeader,
      inputHeader,
      ...Object.keys(hiddenExcitationCorrectAnswers).filter(
        (key) => key !== "Z",
      ),
    ];

    rows = excitationTable.map((row, rowIndex) => {
      return [
        `\t${row.currentState}`, // Enclose in quotes to keep leading zeros
        `\t${row.input}`,
        ...Object.keys(row.flipFlopInputs)
          .filter((flipFlop) => flipFlop !== "Z")
          .map((flipFlop) => {
            const { terms, isMinterm } =
              hiddenExcitationCorrectAnswers[flipFlop];
            return isMinterm
              ? terms.includes(rowIndex)
                ? "1"
                : "0" // Minterms expect "1"
              : terms.includes(rowIndex)
                ? "0"
                : "1"; // Maxterms expect "0"
          }),
      ];
    });
  } else if (tableType === "stateTransition") {
    headers = [currentStateHeader, inputHeader, nextStateHeader, "Output Z"];

    rows = stateTransitionTable.map((row, rowIndex) => [
      `\t${row.currentState}`, // Enclose in quotes to keep leading zeros
      `\t${row.input}`,
      `\t${hiddenStateTransitionCorrectAnswers.nextState[rowIndex]}`,
      `\t${hiddenStateTransitionCorrectAnswers.output[rowIndex]}`,
    ]);
  }

  // Format headers properly for CSV (remove any JSX formatting issues)
  csvContent += headers.join(",") + "\n";

  // Format rows properly
  rows.forEach((row) => {
    csvContent += row.join(",") + "\n";
  });

  const suffixMap = {
    excitation: "_ET",
    stateTransition: "_TT",
  };

  const fileSuffix = suffixMap[tableType] || `_${tableType}`;

  // Create download link
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute(
    "download",
    `${getBaseFileName(generateState)}${fileSuffix}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/* Export Circuit Diagram PNG and netlist TXT */
const exportAllImagesAsZip = async ({
  generateState,
  netlistImages,
  netlistEquations,
}) => {
  const zip = new JSZip();

  // 1. Add circuit diagram
  const canvasElement = document.querySelector(".canvas-container canvas");
  if (!canvasElement) {
    alert("Circuit diagram not found!");
    return;
  }

  const canvas = await html2canvas(canvasElement);
  const circuitData = canvas.toDataURL("image/png").split(",")[1];
  zip.file(`${getBaseFileName(generateState)}_CD.png`, circuitData, {
    base64: true,
  });

  // 2. Create subfolder for netlist images
  const netlistFolder = zip.folder("schematic_logic_circuit_netlist");

  // 3. Add each netlist image to the folder
  netlistImages?.forEach(({ label, image }) => {
    if (typeof image === "string") {
      const base64 = image.split(",")[1]; // Strip 'data:image/png;base64,'
      netlistFolder.file(`${label}.png`, base64, { base64: true });
    }
  });

  // 4. Add netlist TXT files
  netlistEquations?.forEach(({ label, netlist }) => {
    const textContent = JSON.stringify(netlist, null, 2);
    netlistFolder.file(`${label}.txt`, textContent);
  });

  // 5. Generate and save zip
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${getBaseFileName(generateState)}_CD.zip`);
};

/* Export State Diagram PNG */
const exportStateDiagramAsPNG = async ({ generateState }) => {
  const diagramElement = document.getElementById("stateDiagram-container");

  if (!diagramElement) return;

  const canvas = await html2canvas(diagramElement);

  const link = document.createElement("a");
  link.download = `${getBaseFileName(generateState)}_SD.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
};

/* Download Full Exercise */
const downloadFullExercise = async ({
  generateState,
  isUsingCustomEquation,
  customEquations,
  logicEquation,
  booleanEquations,
  hiddenExcitationCorrectAnswers,
  excitationTable,
  stateTransitionTable,
  hiddenStateTransitionCorrectAnswers,
  netlistImages,
  netlistEquations,
}) => {
  const zip = new JSZip();
  let csvContent = "\uFEFF"; // UTF-8 BOM for Excel
  const base = getBaseFileName(generateState);
  const { numInputs, numFlipFlops } = generateState;

  // Section 1: Logic Equations
  csvContent += "Logic Equations\n";
  const sigma = "\u03A3"; // Σ
  const pi = "\u03A0"; // Π

  if (isUsingCustomEquation) {
    customEquations.forEach((eq) => {
      const symbol = eq.type === "Σ" ? `${sigma}m` : `${pi}M`;
      const fullEquation = `${eq.formattedEquation} =`;
      const terms = `${symbol}(${eq.terms})`;
      csvContent += `"${fullEquation}","${terms}"\n`;
    });
  } else {
    logicEquation.forEach((eq) => {
      const symbol = eq.isMinterm ? `${sigma}m` : `${pi}M`;
      const fullEquation = `${eq.equation} =`;
      const terms = `${symbol}(${eq.terms.join(", ")})`;
      csvContent += `"${fullEquation}","${terms}"\n`;
    });
  }

  csvContent += "\n";

  // Section 1b: Boolean Expressions
  csvContent += "Boolean Expressions\n";
  booleanEquations.forEach(({ label, expression }) => {
    csvContent += `"${label}","${expression}"\n`;
  });
  csvContent += "\n";

  // Section 2: Excitation Table
  csvContent += "EXCITATION TABLE\n";
  const currentStateHeader = `Current State ${Array.from({ length: numFlipFlops }, (_, i) => `Q${numFlipFlops - 1 - i}`).join("")}`;
  const inputHeader = `Input ${Array.from({ length: numInputs }, (_, i) => `X${numInputs - 1 - i}`).join("")}`;
  const flipFlopHeaders = Object.keys(hiddenExcitationCorrectAnswers).filter(
    (key) => key !== "Z",
  );

  csvContent += `${currentStateHeader},${inputHeader},${flipFlopHeaders.join(",")}\n`;

  excitationTable.forEach((row, index) => {
    const flipFlopValues = flipFlopHeaders.map((flipFlop) => {
      const { terms, isMinterm } = hiddenExcitationCorrectAnswers[flipFlop];
      return isMinterm
        ? terms.includes(index)
          ? "1"
          : "0"
        : terms.includes(index)
          ? "0"
          : "1";
    });
    csvContent += `\t${row.currentState},\t${row.input},${flipFlopValues.map((val) => `\t${val}`).join(",")}\n`;
  });

  csvContent += "\n";

  // Section 3: State Transition Table
  csvContent += "STATE TRANSITION TABLE\n";
  const nextStateHeader = `Next State ${Array.from({ length: numFlipFlops }, (_, i) => `Q${numFlipFlops - 1 - i}*`).join("")}`;
  csvContent += `${currentStateHeader},${inputHeader},${nextStateHeader},Output Z\n`;

  stateTransitionTable.forEach((row, index) => {
    csvContent += `\t${row.currentState},\t${row.input},\t${hiddenStateTransitionCorrectAnswers.nextState[index]},\t${hiddenStateTransitionCorrectAnswers.output[index]}\n`;
  });

  // Add CSV to zip
  zip.file(`${base}_all.csv`, csvContent);

  // Add circuit diagram PNG to zip
  const circuitElement = document.querySelector(".canvas-container canvas");
  if (circuitElement) {
    const canvasCircuit = await html2canvas(circuitElement);
    const blobCircuit = await new Promise((resolve) =>
      canvasCircuit.toBlob(resolve, "image/png"),
    );
    zip.file(`${base}_CD.png`, blobCircuit);
  }

  // Add Netlist Images Folder
  const netlistFolder = zip.folder("schematic_logic_circuit_netlist");
  if (netlistImages && netlistImages.length > 0) {
    netlistImages?.forEach(({ label, image }) => {
      if (image) {
        const base64 = image.split(",")[1]; // remove prefix
        netlistFolder.file(`${label}.png`, base64, { base64: true });
      }
    });
  }

  // Add Netlist TXT files to netlistFolder
  if (netlistEquations && netlistEquations.length > 0) {
    netlistEquations?.forEach(({ label, netlist }) => {
      const textContent = JSON.stringify(netlist, null, 2);
      netlistFolder.file(`${label}.txt`, textContent);
    });
  }

  // Add state diagram PNG to zip
  const stateDiagramElement = document.getElementById("stateDiagram-container");
  if (stateDiagramElement) {
    const canvas = await html2canvas(stateDiagramElement);
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    zip.file(`${base}_SD.png`, blob);
  }

  // Create and download ZIP
  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `${base}.zip`);
};

export {
  exportToCSV,
  exportAllImagesAsZip,
  exportStateDiagramAsPNG,
  downloadFullExercise,
};
