/* CircuitToState.jsx */
import React, { useState, useEffect, useCallback } from "react";
import CircuitDiagram from '../components/CircuitDiagram';
import CTSConversion from '../components/CTSConversion'; 
import '../styles/CircuitToState.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'; // FontAwesome Arrow

const CircuitToState = () => {
  // States for generated data and user inputs
  const [minterms, setMinterms] = useState([]);
  const [mintermOutputZ, setMintermOutputZ] = useState("");
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

    // Logic for resetting number of flip-flops if inputs change to 2
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
      const flipFlopKey =
        flipFlopType === "JK"
          ? [`J${i + 1}`, `K${i + 1}`]
          : `${flipFlopType}${i + 1}`;

      if (flipFlopType === "D") {
        nextStateBits.push(excitationAnswers[flipFlopKey]?.includes(rowIndex) ? "1" : "0");
      } else if (flipFlopType === "T") {
        const toggle = excitationAnswers[flipFlopKey]?.includes(rowIndex) ? "1" : "0";
        nextStateBits.push(toggle === "1" ? (currentStateBits[i] === "1" ? "0" : "1") : currentStateBits[i]);
      } else if (flipFlopType === "JK") {
        const [jKey, kKey] = flipFlopKey;
        const j = excitationAnswers[jKey]?.includes(rowIndex) ? "1" : "0";
        const k = excitationAnswers[kKey]?.includes(rowIndex) ? "1" : "0";
        if (j === "0" && k === "0") nextStateBits.push(currentStateBits[i]);
        if (j === "0" && k === "1") nextStateBits.push("0");
        if (j === "1" && k === "0") nextStateBits.push("1");
        if (j === "1" && k === "1") nextStateBits.push(currentStateBits[i] === "1" ? "0" : "1");
      }
    }
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

  // Helper: Generate unique minterms
  const generateUniqueMinterms = (limit, maxValue) => {
    const possibleMinterms = Array.from({ length: maxValue }, (_, index) => index);
    const shuffledMinterms = shuffleArray(possibleMinterms);
    return shuffledMinterms.slice(0, limit).sort((a, b) => a - b);
  };

  const generateRandomMintermsForFlipFlop = (
    flipFlopName, state, targetStates, flipFlopType, minMinterms, maxMinterms, maxValue, numFlipFlops
  ) => {
    let minterms = generateUniqueMinterms(getRandomNumber(minMinterms, maxMinterms), maxValue);

    // Ensure the first row does not result in all zeros
    if ((numFlipFlops === "2" && state === "00") || (numFlipFlops === "3" && state === "000")) {
      const resetStateIndex = parseInt(state, 2); // Current reset state
      const otherStatesIndexes = targetStates.map((s) => parseInt(s, 2)); // Convert target states to indexes

      // Ensure at least one outgoing transition exists
      let outgoingTransitions = minterms.filter((minterm) => minterm !== resetStateIndex);

      if (outgoingTransitions.length === 0) {
        const validTarget = otherStatesIndexes.find((target) => !minterms.includes(target));
        if (validTarget !== undefined) {
          outgoingTransitions.push(validTarget); // Add one valid outgoing transition
        }
      }

      // Remove the reset state from minterms for the first row
      minterms = outgoingTransitions.filter((minterm) => minterm !== resetStateIndex);

      // Add a valid non-zero state for the first row
      if (minterms.length === 0) {
        const validNonZeroState = otherStatesIndexes.find((state) => state !== resetStateIndex);
        if (validNonZeroState !== undefined) {
          minterms.push(validNonZeroState);
        }
      }
    }

    // Ensure minterms include the first minterm as 0
    if (!minterms.includes(0)) {minterms.unshift(0);}

    return minterms.slice(0, maxMinterms); // Ensure within max constraints
    
  };

  // Generate minterms, hidden correct answers and populate tables 
  const generateMinterms = () => {
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
    let maxValue, minMinterms, maxMinterms;

    if (numFlipFlops === "2" && numInputs === "1") {
      maxValue = 8; // 0 to 7
      minMinterms = 2;
      maxMinterms = 4;
    } else if ((numFlipFlops === "2" && numInputs === "2") || (numFlipFlops === "3" && numInputs === "1")) {
      maxValue = 16; // 0 to 15
      minMinterms = 4;
      maxMinterms = 8;
    }

    const generatedMinterms = [];
    const excitationCorrectAnswers = {};

    // Generate minterms for D or T Flip-Flops
    if (flipFlopType === "D" || flipFlopType === "T") {
      for (let i = 1; i <= parseInt(numFlipFlops); i++) {
        const mintermsDT = generateRandomMintermsForFlipFlop(
          `${flipFlopType}${i}`,
          "00",
          numFlipFlops === "2" ? ["01", "10", "11"] : ["001", "010", "011", "100", "101", "110", "111"],
          flipFlopType,
          minMinterms,
          maxMinterms,
          maxValue,
          numFlipFlops
        );
        generatedMinterms.push({
          flipFlop: `${flipFlopType}${i}`,
          minterms: mintermsDT,
        });
        excitationCorrectAnswers[`${flipFlopType}${i}`] = mintermsDT;
      }
    }

    // Generate minterms for JK Flip-Flops
    if (flipFlopType === "JK") {
      for (let i = 1; i <= parseInt(numFlipFlops); i++) {
        const mintermsJ = generateRandomMintermsForFlipFlop(
          `J${i}`,
          "00",
          numFlipFlops === "2" ? ["01", "10", "11"] : ["001", "010", "011", "100", "101", "110", "111"],
          flipFlopType,
          minMinterms,
          maxMinterms,
          maxValue,
          numFlipFlops
        );
        const mintermsK = generateRandomMintermsForFlipFlop(
          `K${i}`,
          "00",
          numFlipFlops === "2" ? ["01", "10", "11"] : ["001", "010", "011", "100", "101", "110", "111"],
          flipFlopType,
          minMinterms,
          maxMinterms,
          maxValue,
          numFlipFlops
        );
        generatedMinterms.push(
          { flipFlop: `J${i}`, minterms: mintermsJ },
          { flipFlop: `K${i}`, minterms: mintermsK }
        );
        excitationCorrectAnswers[`J${i}`] = mintermsJ;
        excitationCorrectAnswers[`K${i}`] = mintermsK;
      }
    }

    // Generate Output Z
    const outputMinterms = generateUniqueMinterms(
      getRandomNumber(minMinterms, maxMinterms),
      maxValue
    );
    const outputZMinterms = `∑m(${outputMinterms.join(", ")})`;

    // Update states
    setMinterms(generatedMinterms);
    setMintermOutputZ(outputZMinterms);
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

        // Compute the next state
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
          output: outputMinterms.includes(rowIndex) ? "1" : "0",
        };

        // Populate flip-flop inputs based on minterms
        generatedMinterms.forEach(({ flipFlop, minterms }) => {
          excitationRow.flipFlopInputs[flipFlop] = minterms.includes(rowIndex) ? "1" : "0";
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
        const correctExcitationValue =
          hiddenExcitationCorrectAnswers[flipFlop]?.includes(index) ? "1" : "0";
        if (row.flipFlopInputs[flipFlop].value === correctExcitationValue) {
          updatedRow.flipFlopInputs[flipFlop] = {
            value: correctExcitationValue,
            status: "correct",
          };
        } else {
            allCorrect = false;
            updatedRow.flipFlopInputs[flipFlop] = {
              value: row.flipFlopInputs[flipFlop].value,
              status: "incorrect",
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

      // Validate output
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
        Current State<br />{Array.from({ length: numFlipFlops }, (_, i) => `Q${i + 1}`).join("")}
      </>,
      <>
        Input<br />{Array.from({ length: numInputs }, (_, i) => `X${i + 1}`).join("")}
      </>,
    ];
    for (let i = 1; i <= parseInt(numFlipFlops); i++) {
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
      Current State<br />{Array.from({ length: numFlipFlops }, (_, i) => `Q${i + 1}`).join("")}
      </>,
      <>
        Input<br />{Array.from({ length: numInputs }, (_, i) => `X${i + 1}`).join("")}
      </>,
      <>
        Next State<br />{Array.from({ length: numFlipFlops }, (_, i) => `Q${i + 1}'`).join("")}
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
          <option value="">Select Number of Inputs</option>
          <option value="1">1 Input X1</option>
          <option value="2">2 Inputs X1X2</option>
        </select>
      
        <select
          value={dropdownState.flipFlopType}
          onChange={(e) =>
            handleDropdownChange("flipFlopType", e.target.value)
          }
        >
          <option value="">Select Flip-Flop Type</option>
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
          <option value="">Select Number of Flip-Flops</option>
          <option value="2">2 Flip-Flops</option>
          <option value="3" disabled={dropdownState.numInputs === '2'}>3 Flip-Flops</option>
        </select>

        <select
          value={dropdownState.fsmType}
          onChange={(e) =>
            handleDropdownChange("fsmType", e.target.value)
          }
        >
          <option value="">Select FSM Type</option>
          <option value="Mealy">Mealy</option>
          <option value="Moore">Moore</option>
        </select>

        {/* Generate Button */}
        <button 
          className={`generate-btn ${isFormComplete ? '' : 'disabled'}`}
          onClick={generateMinterms} 
          disabled={!isFormComplete}
        >
          Generate Circuit & Minterms
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

      {/* Display Generated Minterms */}
      <div className="minterms-section">
        {!isGenerated ? (
          <h3 style = {{color: "#aaa"}}>Generated Minterms</h3>
        ) : (
          <>
            <p>
              {minterms.map(
                ({ flipFlop, minterms }) => (
                  <span key={flipFlop}>
                    <strong>{flipFlop}&nbsp;=&nbsp;</strong>∑m({minterms.join(",\u00A0")})&nbsp;
                  </span>
                )
              )
              .reduce((prev, curr) => [prev, ", ", curr])}
            </p>
            <p>
              <strong>Z = </strong>{mintermOutputZ}
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



