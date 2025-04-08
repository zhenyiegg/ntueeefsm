// booleanToNetlist.jsx

let gateCounter = 1; // To generate unique gate names
let notCache = {};   // Cache to reuse NOT gate outputs

const generateGateName = () => `Gate${gateCounter++}`;

const createGate = (type, inputs, output, level) => ({
  name: generateGateName(),
  type,
  input: inputs,
  output,
  level: `${level}`
});

// Helper: split gates if inputs exceed maxInputs (3)
const createMultiInputGate = (type, inputs, finalOutputName, baseLevel) => {
  const gate = createGate(type, inputs, finalOutputName, baseLevel);
  return [gate];
};

// Helper: Get (or create) cached NOT output
const getCachedNotGate = (varName, gateList) => {
  if (notCache[varName]) return notCache[varName];

  const notOutput = `${varName}_not`;
  const notGate = createGate("not", [varName], notOutput, 1);
  gateList.push(notGate);
  notCache[varName] = notOutput;
  return notOutput;
};

// SOP conversion (e.g., A'B'C + AB'C)
export const convertSOPToNetlist = (expression, finalLabel = "OUT") => {
  gateCounter = 1;
  notCache = {}; // Reset per call

  const andGates = [];
  const orInputs = [];

  const terms = expression.split('+').map(t => t.trim());

  terms.forEach((term, index) => {
    const literals = term.match(/[A-Z][0-9]?'?/g) || [];
    const inputs = [];
    // const notGates = [];

    literals.forEach(lit => {
      if (lit.endsWith("'")) {
        const inputVar = lit.slice(0, -1);
        const cached = getCachedNotGate(inputVar, andGates);
        inputs.push(cached);
      } else {
        inputs.push(lit);
      }
    });

    const andOutput = `AND_${index}`;
    andGates.push(...createMultiInputGate("and", inputs, andOutput, 2));
    orInputs.push(andOutput);
  });

  const finalOutput = finalLabel.split('(')[0].trim(); // Use Z, T1, T0, etc.
  const orGates = createMultiInputGate("or", orInputs, finalOutput, 3);
  return [...andGates, ...orGates];
};

// POS conversion (e.g., (A+B+C)(A+B'+C'))
export const convertPOSToNetlist = (expression, finalLabel = "OUT") => {
  gateCounter = 1;
  notCache = {}; // Reset per call

  const orGates = [];
  const andInputs = [];

  const terms = expression.match(/\([^()]+\)/g) || [];

  terms.forEach((group, index) => {
    const literals = group.replace(/[()]/g, '').split('+').map(t => t.trim());
    const inputs = [];
    //const notGates = [];

    literals.forEach(lit => {
      if (lit.endsWith("'")) {
        const inputVar = lit.slice(0, -1);
        const cached = getCachedNotGate(inputVar, orGates);
        inputs.push(cached);
      } else {
        inputs.push(lit);
      }
    });

    const orOutput = `OR_${index}`;
    orGates.push(...createMultiInputGate("or", inputs, orOutput, 2));
    andInputs.push(orOutput);
  });

  const finalOutput = finalLabel.split('(')[0].trim();
  const andGates = createMultiInputGate("and", andInputs, finalOutput, 3);
  return [...orGates, ...andGates];
};


