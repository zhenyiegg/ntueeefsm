// booleanConverter.jsx

// Converts a row number to a binary string with padding
const getBinary = (num, numBits) => num.toString(2).padStart(numBits, '0');

// Generates variable names based on setup
const getVariableNames = (numFlipFlops, numInputs) => {
  const flipFlops = Array.from({ length: numFlipFlops }, (_, i) => `Q${numFlipFlops - i - 1}`);
  const inputs = Array.from({ length: numInputs }, (_, i) => `X${numInputs - i - 1}`);
  return [...flipFlops, ...inputs]; // Order: Q... then X...
};

// Convert Minterm List to SOP Boolean Expression
export const convertMintermsToSOP = (minterms, numFlipFlops, numInputs) => {
  const variables = getVariableNames(numFlipFlops, numInputs);
  const numBits = variables.length;

  const terms = minterms.map((num) => {
    const bits = getBinary(num, numBits).split('');
    return bits.map((bit, i) => (bit === '1' ? variables[i] : `${variables[i]}'`)).join('');
  });

  return terms.join(' + ');
};

// Convert Maxterm List to POS Boolean Expression
export const convertMaxtermsToPOS = (maxterms, numFlipFlops, numInputs) => {
  const variables = getVariableNames(numFlipFlops, numInputs);
  const numBits = variables.length;

  const terms = maxterms.map((num) => {
    const bits = getBinary(num, numBits).split('');
    return `(${bits.map((bit, i) => (bit === '0' ? variables[i] : `${variables[i]}'`)).join(' + ')})`;
  });

  return terms.join('');
};
