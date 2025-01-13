/* CircuitToState.jsx */
import React, { useState, useEffect, useCallback } from "react";
import CircuitDiagram from '../components/CircuitDiagram';
import CTSConversion from '../components/CTSConversion'; 
import '../styles/CircuitToState.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'; // FontAwesome Arrow

const CircuitToState = () => {
  // States for generated data and user inputs
  const [minMaxterms, setMinMaxterms] = useState([]);
  const [minMaxtermOutputZ, setMinMaxtermOutputZ] = useState("");
  const [isGenerated, setIsGenerated] = useState(false);
  const [excitationTable, setExcitationTable] = useState([]);
  const [stateTransitionTable, setStateTransitionTable] = useState([]);
  const [hiddenExcitationCorrectAnswers, setHiddenExcitationCorrectAnswers] = useState({});
  const [hiddenStateTransitionCorrectAnswers, setHiddenStateTransitionCorrectAnswers] = useState({
    nextState: [],
    output: [],
  });
  const [userExcitationInputs, setUserExcitationInputs] = useState([]);
  const [userStateTransitionInputs, setUserStateTransitionInputs] = useState([]);
  const [isNextExcitationButtonEnabled, setIsNextExcitationButtonEnabled] = useState(false);
  const [isGenerateStateDiagramButtonEnabled, setisGenerateStateDiagramButtonEnabled] = useState(false);
  const [isExcitationTableComplete, setIsExcitationTableComplete] = useState(false);
  const [isStateTransitionTableComplete, setIsStateTransitionTableComplete] = useState(false);
  const [showExcitationTable, setShowExcitationTable] = useState(false);
  const [showStateTransitionTable, setShowStateTransitionTable] = useState(false);
  const [excitationSubheader, setExcitationSubheader] = useState("Exercise 1");
  const [stateTransitionSubheader, setStateTransitionSubheader] = useState("Exercise 2");
  const [showStateDiagram, setShowStateDiagram] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null); 
  const [showPopup, setShowPopup] = useState(false);

  // State for dropdown selections
  const [dropdownState, setDropdownState] = useState({
    numInputs: "",
    flipFlopType: "",
    numFlipFlops: "",
    fsmType: "",
  });

  // State for finalized dropdown selections after clicking Generate
  const [generateState, setGenerateState] = useState({
    numInputs: "",
    flipFlopType: "",
    numFlipFlops: "",
    fsmType: "",
  });

  // Helper to check if all input fields are filled
  const areAllExcitationInputsFilled = useCallback(() => {
    return userExcitationInputs.every((row) =>
      Object.values(row.flipFlopInputs).every(({ value }) => value === "0" || value === "1")
    );
  }, [userExcitationInputs]);

  // Helper to check if all input fields are filled
  const areAllStateTransitionInputsFilled = useCallback(() => {
    const { numFlipFlops } = generateState;

    return userStateTransitionInputs.every((row) => {
      const isNextStateValid =
        (!row.nextState.editable || 
          (row.nextState.value.length === parseInt(numFlipFlops) &&
          /^[01]+$/.test(row.nextState.value)));
      const isOutputValid =
        (!row.output.editable || /^[01]$/.test(row.output.value));

      return isNextStateValid && isOutputValid;
    });
  }, [userStateTransitionInputs, generateState]);

  // Update button state when user inputs change
  useEffect(() => {
    setIsNextExcitationButtonEnabled(areAllExcitationInputsFilled());
  }, [areAllExcitationInputsFilled]);

  useEffect(() => {
    setisGenerateStateDiagramButtonEnabled(areAllStateTransitionInputsFilled());
  }, [areAllStateTransitionInputsFilled]);

  // Helper: Check if all dropdowns are selected
  const isFormComplete =
    dropdownState.numInputs &&
    dropdownState.flipFlopType &&
    dropdownState.numFlipFlops &&
    dropdownState.fsmType;
  
  // Handle dropdown changes with dependent resets
  const handleDropdownChange = (key, value) => {
    const updatedState = { ...dropdownState, [key]: value };

    // Reset number of flip-flops if inputs change to 2
    if (key === "numInputs" && value === "2") {
      if (dropdownState.numFlipFlops === "3") {
        updatedState.numFlipFlops = ""; 
      }
    }

    setDropdownState(updatedState);
  };

  // Compute the next state based on flip-flop type and inputs
  const computeNextState = (flipFlopType, currentState, excitationAnswers, rowIndex, numFlipFlops) => {
    const currentStateBits = currentState.split("");
    const nextStateBits = [];
  
    for (let i = 0; i < numFlipFlops; i++) {
      let flipFlopKey;
  
      if (flipFlopType === "JK") {
        const jKey = `J${i}`;
        const kKey = `K${i}`;
        const jTerms = excitationAnswers[jKey]?.terms || [];
        const kTerms = excitationAnswers[kKey]?.terms || [];
        const isJMinterm = excitationAnswers[jKey]?.isMinterm;
        const isKMinterm = excitationAnswers[kKey]?.isMinterm;
  
        const j = isJMinterm
          ? jTerms.includes(rowIndex) ? "1" : "0"
          : jTerms.includes(rowIndex) ? "0" : "1";
  
        const k = isKMinterm
          ? kTerms.includes(rowIndex) ? "1" : "0"
          : kTerms.includes(rowIndex) ? "0" : "1";
  
        if (j === "0" && k === "0") nextStateBits.push(currentStateBits[i]); // Hold
        else if (j === "0" && k === "1") nextStateBits.push("0"); // Reset
        else if (j === "1" && k === "0") nextStateBits.push("1"); // Set
        else if (j === "1" && k === "1") nextStateBits.push(currentStateBits[i] === "1" ? "0" : "1"); // Toggle
  
      } else {
        flipFlopKey = `${flipFlopType}${i}`;
        const terms = excitationAnswers[flipFlopKey]?.terms || [];
        const isMinterm = excitationAnswers[flipFlopKey]?.isMinterm;
  
        if (flipFlopType === "D") {
          const dValue = isMinterm
            ? terms.includes(rowIndex) ? "1" : "0"
            : terms.includes(rowIndex) ? "0" : "1";
          nextStateBits.push(dValue);
        } else if (flipFlopType === "T") {
          const tValue = isMinterm
            ? terms.includes(rowIndex) ? "1" : "0"
            : terms.includes(rowIndex) ? "0" : "1";
          nextStateBits.push(
            tValue === "1" ? (currentStateBits[i] === "1" ? "0" : "1") : currentStateBits[i]
          );
        }
      }
    }
  
    console.log("Row:", rowIndex, "Current State:", currentState, "Next State Bits:", nextStateBits.join(""));
    return nextStateBits.join("");
  };
  
  // Helper: Generate binary states for the number of flip-flops or inputs
  const generateBinaryStates = (numBits) => {
    const totalStates = Math.pow(2, numBits);
    const states = [];
    for (let i = 0; i < totalStates; i++) {
      states.push(i.toString(2).padStart(numBits, "0"));
    }
    return states;
  };

  // Helper: Generate random number between min and max
  const getRandomNumber = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  // Helper: Shuffle array (Fisher-Yates Shuffle)
  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  // Helper: Generate unique minterms and maxterms
  const generateUniqueTerms = (limit, maxValue, ensureRowZeroHasOne = false, isMinterm = true) => {
    const possibleTerms = Array.from({ length: maxValue }, (_, index) => index);
    const shuffledTerms = shuffleArray(possibleTerms);
  
    // Uniqueness
    const uniqueTermsSet = new Set(shuffledTerms.slice(0, limit));
    let terms = Array.from(uniqueTermsSet).sort((a, b) => a - b);
  
    // Enforce Row Zero Constraint for Minterms or Maxterms
    if (ensureRowZeroHasOne) {
      if (isMinterm && !terms.includes(0)) {
        // Ensure rowIndex 0 is included for minterms
        terms[0] = 0; // Replace the first term with 0
        terms = Array.from(new Set(terms)).sort((a, b) => a - b); // Re-sort and remove duplicates
      } else if (!isMinterm && terms.includes(0)) {
        // Ensure rowIndex 0 is excluded for maxterms
        terms = terms.filter((term) => term !== 0);
        if (terms.length < limit) {
          // Add another valid term to maintain size
          for (let i = 1; i < maxValue; i++) {
            if (!terms.includes(i)) {
              terms.push(i);
              break;
            }
          }
          terms = Array.from(new Set(terms)).sort((a, b) => a - b); // Re-sort and remove duplicates
        }
      }
    }
  
    // Meet the limit constraint after enforcing uniqueness
    while (terms.length > limit) {
      terms.pop(); // Remove excess terms
    }
    while (terms.length < limit) {
      for (let i = 0; i < maxValue; i++) {
        if (!terms.includes(i)) {
          terms.push(i); // Add missing terms
          break;
        }
      }
      terms = Array.from(new Set(terms)).sort((a, b) => a - b); // Re-sort and remove duplicates
    }
  
    return terms;
  };

  // Generate minterms, hidden correct answers and populate tables 
  const generateMinMaxterms = () => {
    const { numInputs, flipFlopType, numFlipFlops } = dropdownState;

    setShowExcitationTable(true); 
    setExcitationSubheader('Complete the Excitation Table with only binary "0" and "1" values.');
    setShowStateTransitionTable(false); 
    setStateTransitionSubheader("Exercise 2");

    // Reset completion states and hide the state transition table
    setIsExcitationTableComplete(false);
    setIsStateTransitionTableComplete(false);
    setShowStateTransitionTable(false); 
    setShowStateDiagram(false);

    setGenerateState({ ...dropdownState }); // Finalize the dropdown selections
    let maxValue, minMinMaxterms, maxMinMaxterms;

    if (numFlipFlops === "2" && numInputs === "1") {
      maxValue = 8; // 0 to 7
      minMinMaxterms = 2;
      maxMinMaxterms = 4;
    } else if ((numFlipFlops === "2" && numInputs === "2") || (numFlipFlops === "3" && numInputs === "1")) {
      maxValue = 16; // 0 to 15
      minMinMaxterms = 4;
      maxMinMaxterms = 8;
    }

    const generatedTerms = [];
    const excitationCorrectAnswers = {};
    const allFlipFlops = [];

    // Helper to format keys for display
    const formatKeyForDisplay = (key, numInputs, numFlipFlops) => {
      if (key.startsWith("J") || key.startsWith("K") || key.startsWith("D") || key.startsWith("T")) {
        //const index = key.slice(1); // Extract the number after J/K
        if (numInputs === "1" && numFlipFlops === "2") {
          return `${key}(X0,\u00A0Q0,\u00A0Q1)`;
        } else if (numInputs === "2" && numFlipFlops === "2") {
          return `${key}(X0,\u00A0X1,\u00A0Q0,\u00A0Q1)`;
        } else if (numInputs === "1" && numFlipFlops === "3") {
          return `${key}(X0,\u00A0Q0,\u00A0Q1,\u00A0Q2)`;
        }
      }
      return key; 
    };

    const formatOutputZForDisplay = (key, numInputs, numFlipFlops, fsmType) => {
      if (key === "Z") {
        if (fsmType === "Mealy") {
          if (numInputs === "1" && numFlipFlops === "2") {
            return `${key}(X0,\u00A0Q0',\u00A0Q1')`;
          } else if (numInputs === "2" && numFlipFlops === "2") {
            return `${key}(X0,\u00A0X1,\u00A0Q0',\u00A0Q1')`;
          } else if (numInputs === "1" && numFlipFlops === "3") {
            return `${key}(X0,\u00A0Q0',\u00A0Q1',\u00A0Q2')`;
          }
        }
        else if (fsmType === "Moore") {
          if (numFlipFlops === "2") {
            return `${key}(Q0',\u00A0Q1')`;
          } else if (numFlipFlops === "3") {
            return `${key}(Q0',\u00A0Q1',\u00A0Q2')`;
          }
        }
      }
      return key;
    };

    // Generate minterms or maxterms for Flip-Flops
    if (flipFlopType === "D" || flipFlopType === "T") {
      for (let i = 0; i < parseInt(numFlipFlops); i++) {
        allFlipFlops.push(`${flipFlopType}${i}`);
      }
    }
    else if (flipFlopType === "JK") {
      for (let i = 0; i < parseInt(numFlipFlops); i++) {
        allFlipFlops.push(`J${i}`, `K${i}`);
      }
    }

    allFlipFlops.forEach((flipFlop, index) => {
      const isMinterm = Math.random() < 0.5; // Randomly assign minterm or maxterm
      const ensureRowZeroHasOne = index === 0; //Only enforce for the first row (current state 00/000)

      const terms = generateUniqueTerms(
        getRandomNumber(minMinMaxterms, maxMinMaxterms),
        maxValue,
        ensureRowZeroHasOne,
        isMinterm
      );

      const formattedKey = formatKeyForDisplay(flipFlop, numInputs, numFlipFlops);

      const formattedTerms = isMinterm ? (
        <>
          <span className="minterm">Σ</span>m({terms.join(",\u00A0")})</>
      ) : (
        <>
          <span className="maxterm">Π</span>M({terms.join(",\u00A0")})
        </>
      );
  
      // Add to the generated terms
      generatedTerms.push({ flipFlop: formattedKey, terms, isMinterm, formattedTerms });
  
      // Store correct answers in the excitationCorrectAnswers object
      excitationCorrectAnswers[flipFlop] = {
        terms,
        isMinterm,
      };
    });

    // Generate random minterms or maxterms for Output Z
    const isOutputMinterm = Math.random() < 0.5; // Randomly decide Σm or ΠM
    const outputTerms = generateUniqueTerms(
      getRandomNumber(minMinMaxterms, maxMinMaxterms),
      maxValue
    );
    
    const formattedOutputZKey = formatOutputZForDisplay("Z", numInputs, numFlipFlops, dropdownState.fsmType);

    const outputZFormattedTerms = isOutputMinterm ? (
      <>
        <strong>{formattedOutputZKey}&nbsp;=&nbsp;</strong>
        <span className="minterm">Σ</span>m({outputTerms.join(",\u00A0")})</>
    ) : (
      <>
        <strong>{formattedOutputZKey}&nbsp;=&nbsp;</strong>
        <span className="maxterm">Π</span>M({outputTerms.join(",\u00A0")})
      </>
    );

    // Update states
    setMinMaxterms(generatedTerms);
    setMinMaxtermOutputZ(outputZFormattedTerms);
    setHiddenExcitationCorrectAnswers(excitationCorrectAnswers);
    setIsGenerated(true);

    // Generate  table
    const binaryStates = generateBinaryStates(parseInt(numFlipFlops));
    const binaryInputs = generateBinaryStates(parseInt(numInputs));

    const newExcitationTable = [];
    const newStateTransitionTable = [];

    binaryStates.forEach((currentState, stateIndex) => {
      binaryInputs.forEach((input, inputIndex) => {
        const rowIndex = stateIndex * binaryInputs.length + inputIndex;

        // Create excitation table rows
        const excitationRow = {
          currentState,
          input,
          flipFlopInputs: {},
        };

        // Compute the next state using the flip-flop rules
        const nextState = computeNextState(
          flipFlopType,
          currentState,
          excitationCorrectAnswers,
          rowIndex,
          parseInt(numFlipFlops)
        );

        // Add to state transition table
        const transitionRow = {
          currentState,
          input,
          nextState,
          output: isOutputMinterm
          ? outputTerms.includes(rowIndex) ? "1" : "0" // Minterms
          : outputTerms.includes(rowIndex) ? "0" : "1", // Maxterms
        };

        // Populate the excitation table
        allFlipFlops.forEach((flipFlop) => {
          const terms = excitationCorrectAnswers[flipFlop]?.terms || [];
          const isMinterm = excitationCorrectAnswers[flipFlop]?.isMinterm;
          excitationRow.flipFlopInputs[flipFlop] = isMinterm
            ? terms.includes(rowIndex) ? "1" : "0"
            : terms.includes(rowIndex) ? "0" : "1";
        });

        newExcitationTable.push(excitationRow);
        newStateTransitionTable.push(transitionRow);
      });
    });

    // Set hidden correct answers for validation
    setHiddenStateTransitionCorrectAnswers({
      nextState: newStateTransitionTable.map((row) => row.nextState),
      output: newStateTransitionTable.map((row) => row.output),
    });

    setExcitationTable(newExcitationTable);
    setStateTransitionTable(newStateTransitionTable);
    
    // Initialize user inputs
    setUserExcitationInputs(
      newExcitationTable.map((row) => ({
        ...row,
        flipFlopInputs: Object.keys(row.flipFlopInputs).reduce((acc, key) => {
          acc[key] = { value: "", status: "editable" }; // Initialize as editable
          return acc;
        }, {}),
      }))
    );

    setUserStateTransitionInputs(
      newStateTransitionTable.map((row) => ({
        ...row,
        nextState: { value: "", status: "editable", editable: true },
        output: { value: "", status: "editable", editable: true },
      }))
    );
  };

  // Helper to show the popup
  const showPopupMessage = (message) => {
    setPopupMessage(message);
    setShowPopup(true);
  };

  // Handle popup close
  const handleClosePopup = () => {
    setShowPopup(false);
  };

  // Handle user input change
  const handleExcitationInputChange = (rowIndex, flipFlop, value) => {
    if (value === "" || value === "0" || value === "1") {
      // Allow only binary values or empty input (for backspace)
      setUserExcitationInputs((prevInputs) => {
        const updatedInputs = [...prevInputs];
        updatedInputs[rowIndex].flipFlopInputs[flipFlop].value = value;
        return updatedInputs;
      });
    } else {
      // Alert on invalid input
      showPopupMessage("Flip-Flop inputs must be single binary values (0 as False and 1 as True).");
    }
  };

  // Handle user input change in state transition table
  const handleStateTransitionInputChange = (rowIndex, column, value) => {
    const { numFlipFlops } = generateState;

    if (column === "nextState") {
      // Allow typing progressively valid binary values
      const isValidNextState = new RegExp(`^[01]{0,${numFlipFlops}}$`).test(value);

      if (isValidNextState) {
        setUserStateTransitionInputs((prevInputs) => {
          const updatedInputs = [...prevInputs];
          updatedInputs[rowIndex][column].value = value;
          return updatedInputs;
        });
      } else {
        showPopupMessage(`With ${numFlipFlops} flip-flops, the Next State must be a ${numFlipFlops}-bit binary number (0 and 1).`);
      }
    } else if (column === "output") {
      // Allow only single binary digit for Output Z
      const isValidOutput = /^[01]?$/.test(value);

      if (isValidOutput) {
        setUserStateTransitionInputs((prevInputs) => {
          const updatedInputs = [...prevInputs];
          updatedInputs[rowIndex][column].value = value;
          return updatedInputs;
        });
      } else {
        showPopupMessage("With one output, Z must be a single binary value (0 or 1) only.");
      }
    }
  };

  // Validate excitation inputs and reveal state transition table if all are correct
  const validateExcitationInputs = () => {
    let allCorrect = true;

    const updatedInputs = userExcitationInputs.map((row, index) => {
      const updatedRow = { ...row };
      Object.keys(row.flipFlopInputs).forEach((flipFlop) => {

        const { terms, isMinterm } = hiddenExcitationCorrectAnswers[flipFlop];

        const correctExcitationValue = isMinterm
        ? terms.includes(index) ? "1" : "0" // Minterms expect "1"
        : terms.includes(index) ? "0" : "1"; // Maxterms expect "0"

        // Check if the current input matches the expected value
        if (row.flipFlopInputs[flipFlop].value === correctExcitationValue) {
        updatedRow.flipFlopInputs[flipFlop] = {
          ...row.flipFlopInputs[flipFlop],
          status: "correct", // Mark as correct
        };
      } else {
        allCorrect = false; // Mark as incorrect if validation fails
        updatedRow.flipFlopInputs[flipFlop] = {
          ...row.flipFlopInputs[flipFlop],
          status: "incorrect", // Mark as incorrect
        };
      }
    });
      return updatedRow;
    });

    setUserExcitationInputs(updatedInputs);
    setIsExcitationTableComplete(allCorrect);

    if (allCorrect) {
      setShowStateTransitionTable(true);
      setExcitationSubheader('Completed!');
      setStateTransitionSubheader('Complete the State Transition Table with only binary "0" and "1" values.');
    }
  };

  // Validate user inputs in the state transition table
  const validateStateTransitionInputs = () => {
    let allCorrect = true;

    const updatedInputs = userStateTransitionInputs.map((row, index) => {
      const updatedRow = { ...row };

      // Validate next state
      const correctNextState = hiddenStateTransitionCorrectAnswers.nextState[index];
      if (row.nextState.value === correctNextState) {
        updatedRow.nextState = {
          value: correctNextState,
          status: "correct",
          editable: false, 
        };
      } else {
        allCorrect = false;
        updatedRow.nextState = {
          value: row.nextState.value,
          status: "incorrect",
          editable: true, 
        };
      }

      // Validate output Z
      const correctOutput = hiddenStateTransitionCorrectAnswers.output[index];
      if (row.output.value === correctOutput) {
        updatedRow.output = {
          value: correctOutput,
          status: "correct",
          editable: false, 
        };
      } else {
        allCorrect = false;
        updatedRow.output = {
          value: row.output.value,
          status: "incorrect",
          editable: true, 
        };
      }
      return updatedRow;
    });
    setUserStateTransitionInputs(updatedInputs);
    setIsStateTransitionTableComplete(allCorrect);

    if (allCorrect) {
      setStateTransitionSubheader('Completed!');
      setShowStateDiagram(true);
    }
  };

  // Excitation Table Headers
  const generateExcitationTableHeaders = () => {
    const { flipFlopType, numFlipFlops, numInputs } = generateState;
    const headers = [
      <>
        Current State<br />{Array.from({ length: numFlipFlops }, (_, i) => `Q${i}`).join("")}
      </>,
      <>
        Input<br />{Array.from({ length: numInputs }, (_, i) => `X${i}`).join("")}
      </>,
    ];
    for (let i = 0; i < parseInt(numFlipFlops); i++) {
      if (flipFlopType === "D" || flipFlopType === "T") {
        headers.push(`${flipFlopType}${i}`);
      } else if (flipFlopType === "JK") {
        headers.push(`J${i}`, `K${i}`);
      }
    }
    return headers;
  };

  // State Transition Table Headers
  const generateStateTransitionTableHeaders = () => {
    const { numFlipFlops, numInputs } = generateState;
    const headers = [
      <>
      Current State<br />{Array.from({ length: numFlipFlops }, (_, i) => `Q${i}`).join("")}
      </>,
      <>
        Input<br />{Array.from({ length: numInputs }, (_, i) => `X${i}`).join("")}
      </>,
      <>
        Next State<br />{Array.from({ length: numFlipFlops }, (_, i) => `Q${i}'`).join("")}
      </>,
      <>
        Output<br />Z
      </>,
    ];
    return headers;
  };

  // Render
  return (
    <div className="container">
      {/* Header */}
      <header>
        <h1>
          Circuit <FontAwesomeIcon icon={faArrowRight} /> State Diagram
        </h1>
      </header>

      {/* Popup */}
      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <button className="popup-close" onClick={handleClosePopup}>
              &times;
            </button>
            <p>{popupMessage}</p>
          </div>
        </div>
      )}

      {/* Dropdowns */}
      <div className="dropdown-container">
        <select
          value={dropdownState.numInputs}
          onChange={(e) =>
            handleDropdownChange("numInputs", e.target.value)
          }
        >
          <option value="">Number of Inputs</option>
          <option value="1">1 Input X0</option>
          <option value="2">2 Inputs X0, X1</option>
        </select>
      
        <select
          value={dropdownState.flipFlopType}
          onChange={(e) =>
            handleDropdownChange("flipFlopType", e.target.value)
          }
        >
          <option value="">Flip-Flop Type</option>
          <option value="D">D Flip-Flop</option>
          <option value="T">T Flip-Flop</option>
          <option value="JK">JK Flip-Flop</option>
        </select>
      
        <select
          value={dropdownState.numFlipFlops}
          onChange={(e) =>
            handleDropdownChange("numFlipFlops", e.target.value)
          }
        >
          <option value="">Number of Flip-Flops</option>
          <option value="2">2 Flip-Flops</option>
          <option value="3" disabled={dropdownState.numInputs === '2'}>3 Flip-Flops</option>
        </select>

        <select
          value={dropdownState.fsmType}
          onChange={(e) =>
            handleDropdownChange("fsmType", e.target.value)
          }
        >
          <option value="">FSM Type</option>
          <option value="Mealy">Mealy</option>
          <option value="Moore">Moore</option>
        </select>

        {/* Generate Button */}
        <button 
          className={`generate-btn ${isFormComplete ? '' : 'disabled'}`}
          onClick={generateMinMaxterms} 
          disabled={!isFormComplete}
        >
          Generate Circuit & Flip-Flop Inputs
        </button>
      </div>
              
      {/* Empty canvas until "Generate" is clicked */}
      <CircuitDiagram 
        numInputs={generateState.numInputs} 
        flipFlopType={generateState.flipFlopType} 
        numFlipFlops={generateState.numFlipFlops} 
        fsmType={generateState.fsmType}
        isGenerated={isGenerated}
      />

      {/* Display Generated Minterms & Maxterms */}
      <div className="minMaxterms-section">
        {!isGenerated ? (
          <h3 style = {{color: "#aaa"}}>Generated Flip-Flop Inputs</h3>
        ) : (
          <>
            <p>
              {minMaxterms.map(
                ({ flipFlop, formattedTerms }) => (
                  <span key={flipFlop}>
                    <strong>{flipFlop}&nbsp;=&nbsp;</strong>{formattedTerms}
                  </span>
                )
              )
              .reduce((prev, curr) => [prev, " \u00A0\u00A0\u00A0", curr])}
            </p>
            <p>
              {minMaxtermOutputZ}
            </p>
          </>
        )}
      </div>

      {/* Excitation Table Section */}
      <div className={`content-box ${showExcitationTable ? "active" : ""}`}>
        <h2>Excitation Table</h2>
        <p>{excitationSubheader}</p>
        {excitationTable.length > 0 && (
          <div>
            {showExcitationTable && (
            <table border="1">
              <thead>
                <tr>
                  {generateExcitationTableHeaders().map((header, index) => (
                    <th key={index}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {userExcitationInputs.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="currentState-column">{row.currentState}</td>
                    <td className="inputX-column">{row.input}</td>
                    {Object.entries(row.flipFlopInputs).map(
                      ([flipFlop, { value, status }], colIndex) => (
                        <td key={colIndex} className="flipFlop-column">
                          <input
                            type="text"
                            value={value}
                            onChange={(e) =>
                              handleExcitationInputChange(rowIndex, flipFlop, e.target.value)
                            }
                            disabled={status === "correct"}
                            className={
                              status === "correct"
                                ? "input-correct"
                                : status === "incorrect"
                                ? "input-incorrect"
                                : "input-default"
                            }
                          />
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            )}
            {!isExcitationTableComplete && (
              <button
                className={`next-btn ${isNextExcitationButtonEnabled ? '' : 'disabled'}`}
                disabled={!isNextExcitationButtonEnabled}
                onClick={validateExcitationInputs}
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>

      {/* State Transition Table */}
      <div className={`content-box ${showStateTransitionTable ? "active" : ""}`}>
        <h2>State Transition Table</h2>
        <p>{stateTransitionSubheader}</p>
        {showStateTransitionTable && stateTransitionTable.length > 0 && (
          <div>
            <table border="1">
              <thead>
                <tr>
                  {generateStateTransitionTableHeaders().map((header, index) => (
                    <th key={index}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {userStateTransitionInputs.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="currentState-column">{row.currentState}</td>
                    <td className="inputX-column">{row.input}</td>
                    <td className="nextState-column">
                      <input
                        type="text"
                        value={row.nextState.value}
                        onChange={(e) =>
                          row.nextState.editable &&
                          handleStateTransitionInputChange(rowIndex, "nextState", e.target.value)
                        }
                        disabled={!row.nextState.editable}
                        className={
                          row.nextState.status === "correct"
                            ? "input-correct"
                            : row.nextState.status === "incorrect"
                            ? "input-incorrect"
                            : "input-default"
                        }
                      />
                    </td>
                    <td className="outputZ-column">
                      <input
                        type="text"
                        value={row.output.value}
                        onChange={(e) =>
                          row.output.editable &&
                          handleStateTransitionInputChange(rowIndex, "output", e.target.value)
                        }
                        disabled={!row.output.editable}
                        className={
                          row.output.status === "correct"
                            ? "input-correct"
                            : row.output.status === "incorrect"
                            ? "input-incorrect"
                            : "input-default"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!isStateTransitionTableComplete && (
              <button
                className={`next-btn ${isGenerateStateDiagramButtonEnabled ? '' : 'disabled'}`}
                disabled={!isGenerateStateDiagramButtonEnabled}
                onClick={validateStateTransitionInputs}
              >
                Generate State Diagram
              </button>
            )}
          </div>
        )}
      </div>

      {/* State Diagram Section */}
      <div className={`content-box stateDiagram-box ${showStateDiagram ? "active" : ""}`}>
        <h2>State Diagram</h2>
        {showStateDiagram ? (
          <div className="state-diagram-placeholder">
            {stateTransitionTable.length > 0 && (
              <CTSConversion
                stateTransitionTable={stateTransitionTable}
                fsmType={generateState.fsmType}
                numFlipFlops={parseInt(generateState.numFlipFlops)}
                numInputs={parseInt(generateState.numInputs)}
              />
            )}
          </div>
        ) : (
          <p>{generateState.fsmType} State Diagram</p>
        )}
      </div>
    </div>
  );
};

export default CircuitToState;



