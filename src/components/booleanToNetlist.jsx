// booleanToNetlist.jsx

let gateCounter = 1; // To generate unique gate names

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
  const maxInputs = 3;
  const gates = [];
  let tempInputs = [...inputs];
  let outputCounter = 0;

  while (tempInputs.length > maxInputs) {
    const chunk = tempInputs.splice(0, maxInputs);
    const intermediateOutput = `${finalOutputName}_mid_${outputCounter++}`;
    gates.push(createGate(type, chunk, intermediateOutput, baseLevel));
    tempInputs.unshift(intermediateOutput);
  }

  gates.push(createGate(type, tempInputs, finalOutputName, baseLevel + 1));
  return gates;
};

// SOP conversion (e.g., A'B'C + AB'C)
export const convertSOPToNetlist = (expression) => {
  gateCounter = 1;
  const andGates = [];
  const orInputs = [];

  const terms = expression.split('+').map(t => t.trim());

  terms.forEach((term, index) => {
    const literals = term.match(/[A-Z][0-9]?'?/g) || [];
    const inputs = [];
    const notGates = [];

    literals.forEach(lit => {
      if (lit.endsWith("'")) {
        const inputVar = lit.slice(0, -1);
        const notOutput = `${inputVar}_not_${index}`;
        notGates.push(createGate("not", [inputVar], notOutput, 1));
        inputs.push(notOutput);
      } else {
        inputs.push(lit);
      }
    });

    const andOutput = `AND_${index}`;
    andGates.push(...notGates);
    andGates.push(...createMultiInputGate("and", inputs, andOutput, 2));
    orInputs.push(andOutput);
  });

  const finalOutput = "OUT";
  const orGates = createMultiInputGate("or", orInputs, finalOutput, 3);
  return [...andGates, ...orGates];
};

// POS conversion (e.g., (A+B+C)(A+B'+C'))
export const convertPOSToNetlist = (expression) => {
  gateCounter = 1;
  const orGates = [];
  const andInputs = [];

  const terms = expression.match(/\([^()]+\)/g) || [];

  terms.forEach((group, index) => {
    const literals = group.replace(/[()]/g, '').split('+').map(t => t.trim());
    const inputs = [];
    const notGates = [];

    literals.forEach(lit => {
      if (lit.endsWith("'")) {
        const inputVar = lit.slice(0, -1);
        const notOutput = `${inputVar}_not_${index}`;
        notGates.push(createGate("not", [inputVar], notOutput, 1));
        inputs.push(notOutput);
      } else {
        inputs.push(lit);
      }
    });

    const orOutput = `OR_${index}`;
    orGates.push(...notGates);
    orGates.push(...createMultiInputGate("or", inputs, orOutput, 2));
    andInputs.push(orOutput);
  });

  const finalOutput = "OUT";
  const andGates = createMultiInputGate("and", andInputs, finalOutput, 3);
  return [...orGates, ...andGates];
};
