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

// SOP conversion (e.g., A'B'C + AB'C)
export const convertSOPToNetlist = (expression) => {
  gateCounter = 1;
  const andGates = [];
  const orInputs = [];

  const terms = expression.split('+').map(t => t.trim());

  terms.forEach((term, index) => {
    const literals = term.match(/[A-Z][0-9]?'?/g
) || [];
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
    andGates.push(createGate("and", inputs, andOutput, 2));
    orInputs.push(andOutput);
  });

  const finalOutput = "OUT";
  const orGate = createGate("or", orInputs, finalOutput, 3);
  return [...andGates, orGate];
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
    orGates.push(createGate("or", inputs, orOutput, 2));
    andInputs.push(orOutput);
  });

  const finalOutput = "OUT";
  const andGate = createGate("and", andInputs, finalOutput, 3);
  return [...orGates, andGate];
};


