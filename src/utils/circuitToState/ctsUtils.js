// Generate binary states for the number of flip-flops or inputs
const generateBinaryStates = (numBits) => {
  const totalStates = Math.pow(2, numBits);
  const states = [];
  for (let i = 0; i < totalStates; i++) {
    states.push(i.toString(2).padStart(numBits, "0"));
  }
  return states;
};

// Generate random number between min and max when randomly deciding random terms or random prefilled table cells
const getRandomNumber = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Shuffle array randomly (Fisher-Yates Shuffle) when selecting random terms or random prefilled table cells
const shuffleArray = (array) => {
  const copiedArray = [...array];

  for (let i = copiedArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copiedArray[i], copiedArray[j]] = [copiedArray[j], copiedArray[i]];
  }

  return copiedArray;
};

// Generate sorted list of unique minterms and maxterms indices
const generateUniqueTerms = (
  limit,
  maxValue,
  ensureRowZeroHasOne = false,
  isMinterm = true,
) => {
  const possibleTerms = Array.from({ length: maxValue }, (_, index) => index);
  const shuffledTerms = shuffleArray(possibleTerms);

  const uniqueTermsSet = new Set(shuffledTerms.slice(0, limit));
  let terms = Array.from(uniqueTermsSet).sort((a, b) => a - b);

  if (ensureRowZeroHasOne) {
    if (isMinterm && !terms.includes(0)) {
      terms[0] = 0;
      terms = Array.from(new Set(terms)).sort((a, b) => a - b);
    } else if (!isMinterm && terms.includes(0)) {
      terms = terms.filter((term) => term !== 0);
      if (terms.length < limit) {
        for (let i = 1; i < maxValue; i++) {
          if (!terms.includes(i)) {
            terms.push(i);
            break;
          }
        }
        terms = Array.from(new Set(terms)).sort((a, b) => a - b);
      }
    }
  }

  // Ensure the final number of terms matches the requested limit.
  while (terms.length > limit) {
    terms.pop();
  }
  while (terms.length < limit) {
    for (let i = 0; i < maxValue; i++) {
      if (!terms.includes(i)) {
        terms.push(i);
        break;
      }
    }
    terms = Array.from(new Set(terms)).sort((a, b) => a - b);
  }

  return terms;
};

// Validate Moore output Z terms are valid
// For Moore machines, Z depends only on the current state, so allowed values must stay within the state index range 0 to 2^n - 1.
const validateMooreOutput = (terms, numFlipFlops) => {
  const maxStateIndex = Math.pow(2, parseInt(numFlipFlops, 10)) - 1;
  return terms.every((term) => term >= 0 && term <= maxStateIndex);
};

// Format equation label for display. Example: D1(Q1, Q0, X0) or Z(Q1, Q0) for Moore output.
const formatKeyForDisplay = (key, numInputs, numFlipFlops, fsmType) => {
  const flipFlops = Array.from(
    { length: parseInt(numFlipFlops, 10) },
    (_, i) => `Q${numFlipFlops - i - 1}`,
  );
  const inputs = Array.from(
    { length: parseInt(numInputs, 10) },
    (_, i) => `X${numInputs - i - 1}`,
  );

  // For Moore FSM, output Z depends only on the current state bits.
  if (key === "Z" && fsmType === "Moore") {
    return `Z(${flipFlops.join(",\u00A0")})`; // Only Qs
  }

  // For flip-flop input equations and Mealy output Z, include both state and input bits.
  return `${key}(${[...flipFlops, ...inputs].join(",\u00A0")})`;
};

// Generate descending labels such as Q2, Q1, Q0 or X1, X0 for displaying table headers
const generateDescendingLabels = (prefix, count, suffix = "") => {
  return Array.from(
    { length: count },
    (_, i) => `${prefix}${count - i - 1}${suffix}`,
  );
};

// Compute next state
// Applies D, T, or JK flip-flop rules using the generated/custom excitation answers.
const computeNextState = (
  flipFlopType,
  currentState,
  excitationAnswers,
  rowIndex,
  numFlipFlops,
) => {
  const currentStateBits = currentState.split("");
  const nextStateBits = [];

  for (let i = 0; i < numFlipFlops; i++) {
    const flipFlopIndex = numFlipFlops - 1 - i; // Reverse order

    // JK flip-flop next-state logic
    if (flipFlopType === "JK") {
      const jKey = `J${flipFlopIndex}`;
      const kKey = `K${flipFlopIndex}`;
      const jTerms = excitationAnswers[jKey]?.terms || [];
      const kTerms = excitationAnswers[kKey]?.terms || [];
      const isJMinterm = excitationAnswers[jKey]?.isMinterm;
      const isKMinterm = excitationAnswers[kKey]?.isMinterm;

      const j = isJMinterm
        ? jTerms.includes(rowIndex)
          ? "1"
          : "0"
        : jTerms.includes(rowIndex)
          ? "0"
          : "1";

      const k = isKMinterm
        ? kTerms.includes(rowIndex)
          ? "1"
          : "0"
        : kTerms.includes(rowIndex)
          ? "0"
          : "1";

      if (j === "0" && k === "0")
        nextStateBits.push(currentStateBits[i]); // Hold
      else if (j === "0" && k === "1")
        nextStateBits.push("0"); // Reset
      else if (j === "1" && k === "0")
        nextStateBits.push("1"); // Set
      else if (j === "1" && k === "1")
        nextStateBits.push(currentStateBits[i] === "1" ? "0" : "1"); // Toggle
    } else {
      const flipFlopKey = `${flipFlopType}${flipFlopIndex}`;
      const terms = excitationAnswers[flipFlopKey]?.terms || [];
      const isMinterm = excitationAnswers[flipFlopKey]?.isMinterm;

      // D flip-flop next-state logic
      if (flipFlopType === "D") {
        const dValue = isMinterm
          ? terms.includes(rowIndex)
            ? "1"
            : "0"
          : terms.includes(rowIndex)
            ? "0"
            : "1";
        nextStateBits.push(dValue);
      }
      // T flip-flop next-state logic
      else if (flipFlopType === "T") {
        const tValue = isMinterm
          ? terms.includes(rowIndex)
            ? "1"
            : "0"
          : terms.includes(rowIndex)
            ? "0"
            : "1";
        nextStateBits.push(
          tValue === "1"
            ? currentStateBits[i] === "1"
              ? "0"
              : "1"
            : currentStateBits[i],
        );
      }
    }
  }
  return nextStateBits.join("");
};

export {
  generateBinaryStates,
  getRandomNumber,
  shuffleArray,
  generateUniqueTerms,
  validateMooreOutput,
  formatKeyForDisplay,
  generateDescendingLabels,
  computeNextState,
};
