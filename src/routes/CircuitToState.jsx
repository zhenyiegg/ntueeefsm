/* CircuitToState.jsx */
import React, { useState, useEffect, useCallback, useRef } from "react";
import CircuitDiagram from '../components/CircuitDiagram';
import CTSConversion from '../components/CTSConversion'; 
import '../styles/CircuitToState.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'; 
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { faDownload } from '@fortawesome/free-solid-svg-icons';

const CircuitToState = () => {

  const [logicEquation, setLogicEquation] = useState([]);
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
  const [showStateDiagram, setShowStateDiagram] = useState(false);

  const [excitationSubheader, setExcitationSubheader] = useState(null);
  const [stateTransitionSubheader, setStateTransitionSubheader] = useState(null);

  const [popupMessage, setPopupMessage] = useState(null); 
  const [showPopup, setShowPopup] = useState(false);

  const [excitationAttemptCount, setExcitationAttemptCount] = useState(0);
  const [stateTransitionAttemptCount, setStateTransitionAttemptCount] = useState(0);

  const [isExcitationGivenUp, setIsExcitationGivenUp] = useState(false);
  const [isStateTransitionGivenUp, setIsStateTransitionGivenUp] = useState(false);
  
  const [showGenerateTooltip, setShowGenerateTooltip] = useState(false);
  const [showAutoGenerateTooltip, setShowAutoGenerateTooltip] = useState(false);


  const [customEquations, setCustomEquations] = useState([]); 
  const [customEquationValidated, setCustomEquationValidated] = useState(false); 

  const [isCustomEquationChecked, setIsCustomEquationChecked] = useState(false); 
  const [isUsingCustomEquation, setIsUsingCustomEquation] = useState(false); 

  const [showMooreInfo, setShowMooreInfo] = useState(false);

  const [isDownloadExcitationEnabled, setIsDownloadExcitationEnabled] = useState(false);
  const [isDownloadStateTransitionEnabled, setIsDownloadStateTransitionEnabled] = useState(false);

  const [dropdownState, setDropdownState] = useState({
    numInputs: "",
    flipFlopType: "",
    numFlipFlops: "",
    fsmType: "",
    preFillOption: "",
  });

  // State for finalized dropdown selections after clicking Generate
  const [generateState, setGenerateState] = useState({
    numInputs: "",
    flipFlopType: "",
    numFlipFlops: "",
    fsmType: "",
    preFillOption: "",
  });

  // Helper: Check if all dropdowns are selected
  const isFormComplete =
    dropdownState.numInputs &&
    dropdownState.flipFlopType &&
    dropdownState.numFlipFlops &&
    dropdownState.fsmType &&
    dropdownState.preFillOption;
  
  // Handle dropdown changes with dependent resets
  const handleDropdownChange = (key, value) => {
    const updatedState = { ...dropdownState, [key]: value };

    if (key === "numInputs" && value === "2") {
      if (dropdownState.numFlipFlops === "3") {
        updatedState.numFlipFlops = ""; 
      }
    }
    setDropdownState(updatedState);
  };

  // Trigger generation manually on button click
  const handleGenerateButtonClick = () => {
    if (isFormComplete) {
      // Reset attempt counters 
      setExcitationAttemptCount(0);
      setStateTransitionAttemptCount(0);
      setIsExcitationGivenUp(false);
      setIsStateTransitionGivenUp(false);

      // Reset completion states
      setIsExcitationTableComplete(false);
      setIsStateTransitionTableComplete(false);
      setExcitationSubheader(null);
      setStateTransitionSubheader(null);

      // Reset user inputs for tables
      setUserExcitationInputs([]);
      setUserStateTransitionInputs([]);
      setHiddenExcitationCorrectAnswers({});
      setHiddenStateTransitionCorrectAnswers({ nextState: [], output: [] });

      // Reset Download CSV Buttons
      setIsDownloadExcitationEnabled(false);
      setIsDownloadStateTransitionEnabled(false);

      // Proceed with generation...
      setGenerateState({ ...dropdownState }); 

      if (isCustomEquationChecked) {
        setIsUsingCustomEquation(true);
        setCustomEquationValidated(false); 
        setIsGenerated(false); 
        setShowExcitationTable(false); 
        setShowStateTransitionTable(false); 
        setShowStateDiagram(false); 
        generateCustomEquationTemplate({ ...dropdownState });
       
      } else {
        setIsUsingCustomEquation(false);
        setCustomEquations([]); 
        setCustomEquationValidated(false);
        setIsGenerated(true);
        setShowExcitationTable(true);
        setShowStateTransitionTable(false);
        setShowStateDiagram(false);
        generateEquations({ ...dropdownState });
        setExcitationSubheader("Fill in the blanks with binary \"0\" or \"1\" values.");
      }
    }
  };

  // Helper: Randomly select a dropdown value
  const getRandomDropdownValue = (options) => {
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
  };

  // Helper: Auto-generate 
  const handleAutoGenerate = () => {
    const randomDropdownState = {
      numInputs: getRandomDropdownValue(["1", "2"]),
      flipFlopType: getRandomDropdownValue(["D", "T", "JK"]),
      numFlipFlops: getRandomDropdownValue(["2", "3"]),
      fsmType: getRandomDropdownValue(["Mealy", "Moore"]),
      preFillOption: getRandomDropdownValue(["random75", "random50","random25","none"]),
    };
  
    if (randomDropdownState.numInputs === "2" && randomDropdownState.numFlipFlops === "3") {
      randomDropdownState.numFlipFlops = "2";
    }

    // Reset attempt counters
    setExcitationAttemptCount(0);
    setStateTransitionAttemptCount(0);
    setIsExcitationGivenUp(false);
    setIsStateTransitionGivenUp(false);

    // Reset completion states
    setIsExcitationTableComplete(false);
    setIsStateTransitionTableComplete(false);
    setExcitationSubheader(null);
    setStateTransitionSubheader(null);

    // Reset user inputs for tables
    setUserExcitationInputs([]); 
    setUserStateTransitionInputs([]);
    setHiddenExcitationCorrectAnswers({});
    setHiddenStateTransitionCorrectAnswers({ nextState: [], output: [] });

    // Reset Download CSV Buttons
    setIsDownloadExcitationEnabled(false);
    setIsDownloadStateTransitionEnabled(false);

    // Set new dropdown states
    setDropdownState(randomDropdownState); 
    setGenerateState(randomDropdownState); 

    if (isCustomEquationChecked) {
        setIsUsingCustomEquation(true);
        setCustomEquationValidated(false);
        setIsGenerated(false);
        setShowExcitationTable(false);
        setShowStateTransitionTable(false);
        setShowStateDiagram(false);
        generateCustomEquationTemplate(randomDropdownState);
    } else {
        setIsUsingCustomEquation(false);
        setCustomEquations([]); 
        setCustomEquationValidated(false);
        setIsGenerated(true);
        setShowExcitationTable(true);
        setShowStateTransitionTable(false);
        setShowStateDiagram(false);
        generateEquations(randomDropdownState);
        setExcitationSubheader("Fill in the blanks with binary \"0\" or \"1\" values.");
    }
  };

  const handleCustomEquationCheckboxChange = () => {
    setIsCustomEquationChecked((prev) => !prev); 
    setIsUsingCustomEquation(false);
  };

  const generateCustomEquationTemplate = (state) => {
    const { numInputs, flipFlopType, numFlipFlops } = state;

    const allFlipFlops = [];
    if (flipFlopType === "D" || flipFlopType === "T") {
        for (let i = parseInt(numFlipFlops) - 1; i >= 0; i--) {
            allFlipFlops.push(`${flipFlopType}${i}`);
        }
    } else if (flipFlopType === "JK") {
        for (let i = parseInt(numFlipFlops) - 1; i >= 0; i--) {
            allFlipFlops.push(`J${i}`, `K${i}`);
        }
    }

    allFlipFlops.push("Z");

    const formattedEquations = allFlipFlops.map((flipFlop) => ({
      equation: flipFlop,
      formattedEquation: formatKeyForDisplay(flipFlop, numInputs, numFlipFlops), 
      terms: "",
      type: "Σ", // Default to minterm
    }));

    setCustomEquations(formattedEquations);
    setIsGenerated(false); 
  };

  const validateCustomEquations = () => {
    const { numInputs, numFlipFlops, fsmType } = generateState;
    const maxValue = numInputs === "1" && numFlipFlops === "2" ? 7 : 15; 

    const updatedHiddenAnswers = {};
    let correctedEquations = [...customEquations]; // Clone the equations array

    // Auto-correct input before validation
    correctedEquations = correctedEquations.map(eq => {
        let correctedTerms = eq.terms
            .replace(/\s+/g, "")   // Remove all spaces
            .replace(/,+/g, ",")   // Remove extra commas
            .replace(/,$/, "")     // Remove trailing comma
            .replace(/^,/, "");    // Remove leading comma

        return { ...eq, terms: correctedTerms };
    });

    // Update the state first before validating
    setCustomEquations(correctedEquations);

    // Validate the corrected input
    for (let eq of correctedEquations) {
        if (eq.terms.trim() === "") {
            showPopupMessage("Error: Terms cannot be empty.");
            return;
        }

        if (!/^\d+(,\d+)*$/.test(eq.terms)) {
            showPopupMessage("Error: Invalid characters detected. Use only numbers separated by commas. (e.g. 1,2,3)");
            return;
        }

        let termsArray = eq.terms.split(",").map(Number); // Convert to an array of numbers
        let uniqueTerms = [...new Set(termsArray)]; // Remove duplicates

        // Check if there were duplicates
        if (uniqueTerms.length !== termsArray.length) {
            showPopupMessage("Error: Duplicate values detected.");
            return;
        }

        if (uniqueTerms.some((num) => num < 0 || num > maxValue)) {
            showPopupMessage(`Error: Allowed numbers are between 0 and ${maxValue}.`);
            return;
        }

        // Moore FSM Validation
        if (fsmType === "Moore" && eq.equation === "Z") {
          let isValid = validateMooreOutput(uniqueTerms, numInputs, numFlipFlops);
          if (!isValid) {
            showPopupMessage(
              <>
                Error: For Moore FSM, the output Z must be the same for all current states. Read<FontAwesomeIcon icon={faCircleInfo} className="info-icon"/> for details.
              </>
            );
            return;
          }
        }

        // Sort the terms array in ascending order
        const sortedTerms = [...uniqueTerms].sort((a, b) => a - b);

        updatedHiddenAnswers[eq.equation] = {
            terms: sortedTerms,
            isMinterm: eq.type === "Σ",
        };
    }

    setHiddenExcitationCorrectAnswers(updatedHiddenAnswers);

    setCustomEquationValidated(true);
    setIsGenerated(true);
    setShowExcitationTable(true);
    setShowStateTransitionTable(false);
    setShowStateDiagram(false);
    setExcitationSubheader("Fill in the blanks with binary \"0\" or \"1\" values.");

    generateTablesFromCustomEquations(updatedHiddenAnswers);
  };

  const validateMooreOutput = (terms, numInputs, numFlipFlops) => {
    if ((numInputs === "1" && numFlipFlops === "2") || (numInputs === "1" && numFlipFlops === "3")) {
      // Moore FSM: Validate pairs (0,1), (2,3), (4,5), (6,7), (8,9), (10,11), (12,13), (14,15)
      for (let i = 0; i <= 15; i += 2) {
        const hasFirst = terms.includes(i);
        const hasSecond = terms.includes(i + 1);
        if (hasFirst !== hasSecond) {
          return false;
        }
      }
    } else if (numInputs === "2" && numFlipFlops === "2") {
      // Moore FSM: Validate groups of 4 (0-3), (4-7), (8-11), (12-15)
      for (let i = 0; i <= 15; i += 4) {
        const group = [i, i + 1, i + 2, i + 3];
        const hasGroup = group.every(num => terms.includes(num));
        const missingGroup = group.every(num => !terms.includes(num));

        if (!hasGroup && !missingGroup) {
          return false; 
        }
      }
    }
    return true; 
  };

  const generateTablesFromCustomEquations = (userCustomAnswers) => {
    const { numFlipFlops, numInputs, preFillOption } = generateState;
    
    const binaryStates = generateBinaryStates(parseInt(numFlipFlops));
    const binaryInputs = generateBinaryStates(parseInt(numInputs));
  
    const newExcitationTable = [];
    const newStateTransitionTable = [];
  
    binaryStates.forEach((currentState, stateIndex) => {
      binaryInputs.forEach((input, inputIndex) => {
        const rowIndex = stateIndex * binaryInputs.length + inputIndex;
  
        const excitationRow = {
          currentState,
          input,
          flipFlopInputs: {},
        };
  
        const nextState = computeNextState(
          generateState.flipFlopType,
          currentState,
          userCustomAnswers, 
          rowIndex,
          parseInt(numFlipFlops)
        );

        const zTerms = userCustomAnswers?.["Z"]?.terms || [];
        const isZMinterm = userCustomAnswers?.["Z"]?.isMinterm;
        const outputValue = isZMinterm
            ? zTerms.includes(rowIndex) ? "1" : "0"
            : zTerms.includes(rowIndex) ? "0" : "1";
  
        const transitionRow = {
          currentState,
          input,
          nextState,
          output: outputValue,
        };
  
        Object.keys(userCustomAnswers).forEach((flipFlop) => {
          if (flipFlop !== "Z") {
            const terms = userCustomAnswers[flipFlop]?.terms || [];
            const isMinterm = userCustomAnswers[flipFlop]?.isMinterm;
            excitationRow.flipFlopInputs[flipFlop] = isMinterm
              ? terms.includes(rowIndex) ? "1" : "0"
              : terms.includes(rowIndex) ? "0" : "1";
          }
        });
  
        newExcitationTable.push(excitationRow);
        newStateTransitionTable.push(transitionRow);
      });
    });
  
    setHiddenStateTransitionCorrectAnswers({
      nextState: newStateTransitionTable.map((row) => row.nextState),
      output: newStateTransitionTable.map((row) => row.output),
    });

    if (preFillOption && preFillOption.startsWith("random")) {
      const preFillPercent =
        preFillOption === "random75" ? 0.75 :
        preFillOption === "random50" ? 0.50 :
        preFillOption === "random25" ? 0.25 : 0;
    
      const totalExcitationFields = newExcitationTable.length * Object.keys(newExcitationTable[0].flipFlopInputs).length;
      const totalStateFields = newStateTransitionTable.length * 2; // Next State + Output
    
      const preFillCountExcitation = Math.floor(totalExcitationFields * preFillPercent);
      const preFillCountState = Math.floor(totalStateFields * preFillPercent);
    
      const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      };
    
      const excitationIndices = shuffleArray(Array.from({ length: totalExcitationFields }, (_, i) => i)).slice(0, preFillCountExcitation);
      const stateIndices = shuffleArray(Array.from({ length: totalStateFields }, (_, i) => i)).slice(0, preFillCountState);
    
      const selectedExcitation = new Set(excitationIndices);
      const selectedState = new Set(stateIndices);
    
      const prefilledExcitation = newExcitationTable.map((row, rowIndex) => {
        const updatedRow = { ...row };
        Object.keys(row.flipFlopInputs).forEach((flipFlop, colIndex) => {
          const fieldIndex = rowIndex * Object.keys(row.flipFlopInputs).length + colIndex;
          if (selectedExcitation.has(fieldIndex)) {
            updatedRow.flipFlopInputs[flipFlop] = {
              value: row.flipFlopInputs[flipFlop], 
              status: "correct",
            };
          } else {
            updatedRow.flipFlopInputs[flipFlop] = {
              value: "",
              status: "editable",
            };
          }
        });
        return updatedRow;
      });
    
      const prefilledStateTransition = newStateTransitionTable.map((row, rowIndex) => {
        const updatedRow = { ...row };
        
        const nextStateIndex = rowIndex * 2; 
        const outputIndex = rowIndex * 2 + 1;
    
        updatedRow.nextState = selectedState.has(nextStateIndex)
          ? { value: row.nextState, status: "correct", editable: false }
          : { value: "", status: "editable", editable: true };
    
        updatedRow.output = selectedState.has(outputIndex)
          ? { value: row.output, status: "correct", editable: false }
          : { value: "", status: "editable", editable: true };
    
        return updatedRow;
      });
    
      setUserExcitationInputs(prefilledExcitation);
      setUserStateTransitionInputs(prefilledStateTransition);
    } else {
      // No pre-fill: All input fields are empty
      setUserExcitationInputs(
        newExcitationTable.map((row) => ({
          ...row,
          flipFlopInputs: Object.keys(row.flipFlopInputs).reduce((acc, key) => {
            acc[key] = { value: "", status: "editable" }; 
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
    }
    
    setExcitationTable(newExcitationTable);
    setStateTransitionTable(newStateTransitionTable);
  };  

  // Helper to check if all input fields are filled
  const areAllExcitationInputsFilled = useCallback(() => {
    return userExcitationInputs.every((row) =>
      Object.values(row.flipFlopInputs).every(({ value }) => value === "0" || value === "1")
    );
  }, [userExcitationInputs]);


  const areAllStateTransitionInputsFilled = useCallback(() => {
    return userStateTransitionInputs.every((row) => 
      row.nextState.value.length > 0 && row.output.value.length > 0 // Allow incomplete but non-empty values
    );
  }, [userStateTransitionInputs]);

  // Update button state when user inputs change
  useEffect(() => {
    setIsNextExcitationButtonEnabled(areAllExcitationInputsFilled());
  }, [areAllExcitationInputsFilled]);

  useEffect(() => {
    setisGenerateStateDiagramButtonEnabled(areAllStateTransitionInputsFilled());
  }, [areAllStateTransitionInputsFilled]);

  // Compute next state 
  const computeNextState = (flipFlopType, currentState, excitationAnswers, rowIndex, numFlipFlops) => {
    const currentStateBits = currentState.split("");
    const nextStateBits = [];
  
    for (let i = 0; i < numFlipFlops; i++) {
      const flipFlopIndex = numFlipFlops - 1 - i; // Reverse order
      let flipFlopKey;
  
      if (flipFlopType === "JK") {
        const jKey = `J${flipFlopIndex}`;
        const kKey = `K${flipFlopIndex}`;
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
        flipFlopKey = `${flipFlopType}${flipFlopIndex}`;
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
  
    // Meet the limit constraint
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

  // Helper to format keys for display
  const formatKeyForDisplay = (key, numInputs, numFlipFlops) => {
    if (key.startsWith("J") || key.startsWith("K") || key.startsWith("D") || key.startsWith("T") || key === "Z") {
      if (numInputs === "1" && numFlipFlops === "2") {
        return `${key}(Q1,\u00A0Q0,\u00A0X0)`;
      } else if (numInputs === "2" && numFlipFlops === "2") {
        return `${key}(Q1,\u00A0Q0,\u00A0X1,\u00A0X0)`;
      } else if (numInputs === "1" && numFlipFlops === "3") {
        return `${key}(Q2,\u00A0Q1,\u00A0Q0,\u00A0X0)`;
      }
    }
    return key; 
  };

  // Generate Logic Equations
  const generateEquations = (state) => {
    const { numInputs, flipFlopType, numFlipFlops, fsmType, preFillOption } = state || dropdownState;

    if (!numInputs || !flipFlopType || !numFlipFlops || !fsmType || !preFillOption) {
      // Safety check if dropdowns are incomplete
      return;
    }

    setShowExcitationTable(true); 
    setShowStateTransitionTable(false); 
    setShowStateDiagram(false);

    setIsExcitationTableComplete(false);
    setIsStateTransitionTableComplete(false);
    setGenerateState(state || dropdownState); // Finalize the dropdown selections

    let maxValue, minTerms, maxTerms;

    if (numFlipFlops === "2" && numInputs === "1") {
      maxValue = 8; 
      minTerms = 4;
      maxTerms = 6;
    } else if ((numFlipFlops === "2" && numInputs === "2") || (numFlipFlops === "3" && numInputs === "1")) {
      maxValue = 16; 
      minTerms = 6;
      maxTerms = 10;
    }

    let maxTermsForOutput = maxTerms;
    if (fsmType === "Moore" && numFlipFlops === "2" && numInputs === "2") {
      maxTermsForOutput = 16; 
    }

    const generatedTerms = [];
    const excitationCorrectAnswers = {};
    const allFlipFlops = [];

    const binaryStates = generateBinaryStates(parseInt(numFlipFlops));
    const binaryInputs = generateBinaryStates(parseInt(numInputs));

    // Generate minterms or maxterms for Flip-Flops
    if (flipFlopType === "D" || flipFlopType === "T") {
      for (let i = parseInt(numFlipFlops) - 1; i >= 0; i--) {
        allFlipFlops.push(`${flipFlopType}${i}`);
      }
    }
    else if (flipFlopType === "JK") {
      for (let i = parseInt(numFlipFlops) - 1; i >= 0; i--) {
        allFlipFlops.push(`J${i}`, `K${i}`);
      }
    }

    allFlipFlops.forEach((flipFlop, index) => {
      const isMinterm = Math.random() < 0.5; // Randomly decide Σm or ΠM
      const ensureRowZeroHasOne = index === 0; // Only enforce for the first row (current state 00/000)

      const terms = generateUniqueTerms(
        getRandomNumber(minTerms, maxTerms),
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
  
      generatedTerms.push({ equation: formattedKey, terms, isMinterm, formattedTerms });
  
      excitationCorrectAnswers[flipFlop] = {
        terms,
        isMinterm,
      };
    });

    setHiddenExcitationCorrectAnswers(excitationCorrectAnswers);

    // Generate random terms for Output Z
    const isOutputMinterm = Math.random() < 0.5; // Randomly decide Σm or ΠM
    let outputTerms = [];

    if (fsmType === "Moore") {
      const stateGroupedIndices = {};
      binaryStates.forEach((currentState) => {
        stateGroupedIndices[currentState] = [];
      });

      const rowsPerState = binaryInputs.length; 
      binaryStates.forEach((currentState, stateIndex) => {
        binaryInputs.forEach((input, inputIndex) => {
          const rowIndex = stateIndex * binaryInputs.length + inputIndex;
          stateGroupedIndices[currentState].push(rowIndex);
        });
      });

      let numSelectedStates = getRandomNumber(
        Math.ceil(minTerms / rowsPerState), 
        Math.floor(maxTermsForOutput / rowsPerState) 
      );
    
      let selectedStates = shuffleArray(Object.keys(stateGroupedIndices)).slice(0, numSelectedStates);

      outputTerms = [];
      selectedStates.forEach((state) => {
          outputTerms.push(...stateGroupedIndices[state]); 
      });

      while (outputTerms.length > maxTermsForOutput) {
        outputTerms.pop();
      }
      while (outputTerms.length < minTerms) {
        for (let i = 0; i < maxValue; i++) {
          if (!outputTerms.includes(i)) {
            outputTerms.push(i);
            if (outputTerms.length >= minTerms) break;
          }
        }
      }

      outputTerms.sort((a, b) => a - b);

      } else {
      // Default random generation for Mealy 
      outputTerms = generateUniqueTerms(
        getRandomNumber(minTerms, maxTerms),
        maxValue
      );
    }
    
    const formattedOutputKey = formatKeyForDisplay("Z", numInputs, numFlipFlops);

    const formattedOutputTerms = isOutputMinterm ? (
      <>
        <span className="minterm">Σ</span>m({outputTerms.join(",\u00A0")})</>
    ) : (
      <>
        <span className="maxterm">Π</span>M({outputTerms.join(",\u00A0")})
      </>
    );

    const outputEquation = {
      equation: formattedOutputKey,
      terms: outputTerms,
      isMinterm: isOutputMinterm,
      formattedTerms: formattedOutputTerms,
    };

    // Update states
    setLogicEquation([...generatedTerms, outputEquation]);
    setIsGenerated(true);

    // Generate tables
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

        // Populate excitation table
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

    if (preFillOption && preFillOption.startsWith("random")) {
      const preFillPercent =
        preFillOption === "random75" ? 0.75 :
        preFillOption === "random50" ? 0.50 :
        preFillOption === "random25" ? 0.25 : 0;
    
      const totalExcitationFields = newExcitationTable.length * Object.keys(newExcitationTable[0].flipFlopInputs).length;
      const totalStateFields = newStateTransitionTable.length * 2; // Next State + Output
    
      const preFillCountExcitation = Math.floor(totalExcitationFields * preFillPercent);
      const preFillCountState = Math.floor(totalStateFields * preFillPercent);
    
      const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      };
    
      const excitationIndices = shuffleArray(Array.from({ length: totalExcitationFields }, (_, i) => i)).slice(0, preFillCountExcitation);
      const stateIndices = shuffleArray(Array.from({ length: totalStateFields }, (_, i) => i)).slice(0, preFillCountState);
    
      const selectedExcitation = new Set(excitationIndices);
      const selectedState = new Set(stateIndices);
    
      // Prefill Excitation Table
      const prefilledExcitation = newExcitationTable.map((row, rowIndex) => {
        const updatedRow = { ...row };
        Object.keys(row.flipFlopInputs).forEach((flipFlop, colIndex) => {
          const fieldIndex = rowIndex * Object.keys(row.flipFlopInputs).length + colIndex;
          if (selectedExcitation.has(fieldIndex)) {
            updatedRow.flipFlopInputs[flipFlop] = {
              value: row.flipFlopInputs[flipFlop], // Prefill correct value
              status: "correct",
            };
          } else {
            updatedRow.flipFlopInputs[flipFlop] = {
              value: "", 
              status: "editable",
            };
          }
        });
        return updatedRow;
      });
    
      // Prefill State Transition Table
      const prefilledStateTransition = newStateTransitionTable.map((row, rowIndex) => {
        const updatedRow = { ...row };
        
        const nextStateIndex = rowIndex * 2; // Next State index
        const outputIndex = rowIndex * 2 + 1; // Output index
    
        updatedRow.nextState = selectedState.has(nextStateIndex)
          ? { value: row.nextState, status: "correct", editable: false }
          : { value: "", status: "editable", editable: true };
    
        updatedRow.output = selectedState.has(outputIndex)
          ? { value: row.output, status: "correct", editable: false }
          : { value: "", status: "editable", editable: true };
    
        return updatedRow;
      });
    
      setUserExcitationInputs(prefilledExcitation);
      setUserStateTransitionInputs(prefilledStateTransition);
    } else {
      // No pre-fill: All input fields are empty
      setUserExcitationInputs(
        newExcitationTable.map((row) => ({
          ...row,
          flipFlopInputs: Object.keys(row.flipFlopInputs).reduce((acc, key) => {
            acc[key] = { value: "", status: "editable" }; 
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
    }
    
    setExcitationTable(newExcitationTable);
    setStateTransitionTable(newStateTransitionTable);
    
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
      showPopupMessage("Flip-Flop inputs must be single-bit binary (0 or 1). ");
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

          // Check if the length is correct
          const isTooShort = value.length > 0 && value.length < parseInt(numFlipFlops);

          updatedInputs[rowIndex][column] = {
            ...updatedInputs[rowIndex][column],
            value: value, 
            focusTooltip: isTooShort ? `Enter ${numFlipFlops} bits` : "",
          };
          return updatedInputs;
        });
      } else {
        showPopupMessage(`With ${numFlipFlops} flip-flops, Next State must be a ${numFlipFlops}-bit binary (each bit is 0 or 1).`);
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
        showPopupMessage("With one output, Z must be a single-bit binary (0 or 1).");
      }
    }
  };

  // Validate excitation inputs 
  const validateExcitationInputs = () => {
    let allCorrect = true;

    const updatedInputs = userExcitationInputs.map((row, index) => {
      const updatedRow = { ...row };
      Object.keys(row.flipFlopInputs).forEach((flipFlop) => {

        const { terms, isMinterm } = hiddenExcitationCorrectAnswers[flipFlop];
        const correctExcitationValue = isMinterm
        ? terms.includes(index) ? "1" : "0" // Minterms expect "1"
        : terms.includes(index) ? "0" : "1"; // Maxterms expect "0"

        // If this input was already given up, leave it as is.
        if (row.flipFlopInputs[flipFlop].status === "given-up") {
          updatedRow.flipFlopInputs[flipFlop] = row.flipFlopInputs[flipFlop];
        } else 
        // Check if the current input matches the expected value
        if (row.flipFlopInputs[flipFlop].value === correctExcitationValue) {
          updatedRow.flipFlopInputs[flipFlop] = {
            ...row.flipFlopInputs[flipFlop],
            status: "correct", 
          };
        } else {
          allCorrect = false; 
          updatedRow.flipFlopInputs[flipFlop] = {
            ...row.flipFlopInputs[flipFlop],
            status: "incorrect", 
          };
        }
      });
      return updatedRow;
    });

    setUserExcitationInputs(updatedInputs);

    if (allCorrect) {
      setIsExcitationTableComplete(true);
      setShowStateTransitionTable(true);
      setExcitationSubheader("Completed!");
      setStateTransitionSubheader("Fill in the blanks with binary \"0\" or \"1\" values.");
      setIsDownloadExcitationEnabled(true);
    } else {
      // Increment attempt counter if not all correct
      setExcitationAttemptCount(prev => prev + 1, 2);
    }
  };

  // Validate user inputs in the state transition table
  const validateStateTransitionInputs = () => {
    let allCorrect = true;
    const { numFlipFlops } = generateState;

    const updatedInputs = userStateTransitionInputs.map((row, index) => {
      const updatedRow = { ...row };

      // Get the correct answers for this row
      const correctNextState = hiddenStateTransitionCorrectAnswers.nextState[index];
      const correctOutput = hiddenStateTransitionCorrectAnswers.output[index];

      // Validate Next State column 
      if (row.nextState.value.length !== parseInt(numFlipFlops)) {
        allCorrect = false;
        updatedRow.nextState = {
          value: row.nextState.value,
          status: "incorrect",
          editable: true,
        };
      } else
      if (row.nextState.status === "given-up") {
        updatedRow.nextState = row.nextState;
      } else
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
      if (row.output.status === "given-up") {
        updatedRow.output = row.output;
      } else
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

    if (allCorrect) {
      setIsStateTransitionTableComplete(true);
      setStateTransitionSubheader("Completed!");
      setShowStateDiagram(true);
      setIsDownloadStateTransitionEnabled(true);
    } else {
      // Increment attempt counter if answers are still incorrect
      setStateTransitionAttemptCount(prev => prev + 1, 2);
    }
  };

  const handleGiveUpExcitation = () => {
    const updatedInputs = userExcitationInputs.map((row, index) => {
      const updatedRow = { ...row };
      Object.keys(row.flipFlopInputs).forEach((flipFlop) => {
        // Get the correct value for this cell
        const { terms, isMinterm } = hiddenExcitationCorrectAnswers[flipFlop];
        const correctValue = isMinterm
          ? (terms.includes(index) ? "1" : "0")
          : (terms.includes(index) ? "0" : "1");
        
         // Only update if the current answer is incorrect.
        if (row.flipFlopInputs[flipFlop].status === "incorrect") {
          updatedRow.flipFlopInputs[flipFlop] = {
            value: correctValue,
            status: "given-up", 
            editable: false,
          };
        }
      });
      return updatedRow;
    });
    setUserExcitationInputs(updatedInputs);
    setExcitationSubheader('Completed!');
    setIsExcitationGivenUp(true);

    setIsDownloadExcitationEnabled(true);
  };
  
  const handleGiveUpStateTransition = () => {
    const updatedInputs = userStateTransitionInputs.map((row, index) => {
      const updatedRow = { ...row };

      // For next state: only update if incorrect.
      const correctNextState = hiddenStateTransitionCorrectAnswers.nextState[index];
      if (row.nextState.status === "incorrect") {
        updatedRow.nextState = {
          value: correctNextState,
          status: "given-up",
          editable: false,
        };
      }
  
      // For output: only update if incorrect.
      const correctOutput = hiddenStateTransitionCorrectAnswers.output[index];
      if (row.output.status === "incorrect") {
        updatedRow.output = {
          value: correctOutput,
          status: "given-up",
          editable: false,
        };
      }
      return updatedRow;
    });
    setUserStateTransitionInputs(updatedInputs);
    setStateTransitionSubheader('Completed!');
    setIsStateTransitionGivenUp(true); 

    setIsDownloadStateTransitionEnabled(true);
  };
  
  // Helper to generate descending labels
  const generateDescendingLabels = (prefix, count, suffix = "") => {
    return Array.from({ length: count }, (_, i) => `${prefix}${count - i - 1}${suffix}`);
  };

  // Excitation Table Headers
  const generateExcitationTableHeaders = () => {
    const { flipFlopType, numFlipFlops, numInputs } = generateState;
    const headers = [
      <>
        Current State<br />{generateDescendingLabels("Q", numFlipFlops).join("")}
      </>,
      <>
       Input<br />{generateDescendingLabels("X", numInputs).join("")}
      </>,
    ];
    for (let i = numFlipFlops - 1; i >= 0; i--) {
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
        Current State<br />{generateDescendingLabels("Q", numFlipFlops).join("")}
      </>,
      <>
        Input<br />{generateDescendingLabels("X", numInputs).join("")}
      </>,
      <>
        Next State<br />{generateDescendingLabels("Q", numFlipFlops, "*").join("")}
      </>,
      <>
        Output<br />Z
      </>,
    ];
    return headers;
  };

  const popupRef = useRef(null);
  const previouslyFocusedElement = useRef(null);

  const showPopupMessage = (message) => {
    previouslyFocusedElement.current = document.activeElement;
    setPopupMessage(message);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    if (previouslyFocusedElement.current) {
      previouslyFocusedElement.current.focus();
    }
  };

  useEffect(() => {
    if (showPopup && popupRef.current) {
      popupRef.current.focus();
    }
  }, [showPopup]);

  useEffect(() => {
    if (showPopup) {
      const handleKeyDown = (e) => {
        e.preventDefault(); // Prevent default scrolling or focus shifting
        e.stopPropagation(); // Stop the event from bubbling further
        handleClosePopup();
      };
  
      window.addEventListener("keydown", handleKeyDown, true);
      
      // Clean up the event listener when pop-up is hidden or component unmounts
      return () => {
        window.removeEventListener("keydown", handleKeyDown, true);
      };
    }
  }, [showPopup]);
  
  useEffect(() => {
    if (showPopup) {
      const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleClosePopup();
      };
  
      window.addEventListener("click", handleClick, true);
      
      // Clean up the event listener when the popup is hidden or component unmounts
      return () => {
        window.removeEventListener("click", handleClick, true);
      };
    }
  }, [showPopup]);

  // Export tables to csv
  const exportToCSV = (tableType) => {
    let csvContent = "data:text/csv;charset=utf-8,"; 
    let headers = [];
    let rows = [];

    const { numFlipFlops, numInputs } = generateState; 

    const currentStateHeader = `Current State ${Array.from({ length: numFlipFlops }, (_, i) => `Q${numFlipFlops - 1 - i}`).join("")}`;
    const inputHeader = `Input ${Array.from({ length: numInputs }, (_, i) => `X${numInputs - 1 - i}`).join("")}`;
    const nextStateHeader = `Next State ${Array.from({ length: numFlipFlops }, (_, i) => `Q${numFlipFlops - 1 - i}*`).join("")}`;

    if (tableType === "excitation") {
      headers = [currentStateHeader, inputHeader,  ...Object.keys(hiddenExcitationCorrectAnswers).filter(key => key !== "Z")];

      rows = excitationTable.map((row, rowIndex) => {
        return [
          `\t${row.currentState}`,     // Enclose in quotes to keep leading zeros
          `\t${row.input}`,
          ...Object.keys(row.flipFlopInputs)
          .filter(flipFlop => flipFlop !== "Z")
          .map((flipFlop) => {
            const { terms, isMinterm } = hiddenExcitationCorrectAnswers[flipFlop];
            return isMinterm 
              ? (terms.includes(rowIndex) ? "1" : "0")  // Minterms expect "1"
              : (terms.includes(rowIndex) ? "0" : "1"); // Maxterms expect "0"
          })
        ];
      });
    } else if (tableType === "stateTransition") {
      headers = [currentStateHeader, inputHeader, nextStateHeader, "Output Z"];

      rows = stateTransitionTable.map((row, rowIndex) => [
        `\t${row.currentState}`,  // Enclose in quotes to keep leading zeros
        `\t${row.input}`,
        `\t${hiddenStateTransitionCorrectAnswers.nextState[rowIndex]}`,
        `\t${hiddenStateTransitionCorrectAnswers.output[rowIndex]}`
      ]);
    }

    // Format headers properly for CSV (remove any JSX formatting issues)
    csvContent += headers.join(",") + "\n"; 

    // Format rows properly
    rows.forEach(row => {
      csvContent += row.join(",") + "\n";
    });

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${tableType}_table.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div className="popup" tabIndex="0" ref={popupRef} onKeyDown={handleClosePopup}>
          <div className="popup-content">
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
          <option value="2">2 Inputs X1, X0</option>
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

        <select
          value={dropdownState.preFillOption}
          onChange={(e) => handleDropdownChange("preFillOption", e.target.value)}
        >
          <option value="">Difficulty</option>
          <option value="random75">Easy</option>
          <option value="random50">Medium</option>
          <option value="random25">Hard</option>
          <option value="none">Expert</option>
        </select>

        <div className="checkbox-container">
        <input
            type="checkbox"
            id="customEquationCheckbox"
            checked={isCustomEquationChecked}
            onChange={handleCustomEquationCheckboxChange} 
          />
          <label htmlFor="customEquationCheckbox" className="custom-label">Custom Equation</label>
        </div>

        {/* Generate Button */}
        <div className="tooltipBtn-container">
          {showGenerateTooltip && (
            <div className="tooltipBtn">Refresh logic equations</div>
          )}
          <button
            className={`generate-btn ${isFormComplete ? '' : 'disabled'}`}
            onClick={handleGenerateButtonClick}
            disabled={!isFormComplete}
            onMouseEnter={() => setShowGenerateTooltip(true)}
            onMouseLeave={() => setShowGenerateTooltip(false)}
          >
            Generate
          </button>
        </div>

        {/* Auto-Generate Button */}
        <div className="tooltipBtn-container">
          {showAutoGenerateTooltip && (
            <div className="tooltipBtn">Randomise selections</div>
          )}
          <button
            className="auto-generate-btn"
            onClick={handleAutoGenerate}
            onMouseEnter={() => setShowAutoGenerateTooltip(true)}
            onMouseLeave={() => setShowAutoGenerateTooltip(false)}
          >
            Auto Generate
          </button>
        </div>
      </div>
              
      <div className="circuit-container">
        {/* Empty canvas until "Generate" is clicked */}
        <CircuitDiagram 
          numInputs={generateState.numInputs} 
          flipFlopType={generateState.flipFlopType} 
          numFlipFlops={generateState.numFlipFlops} 
          fsmType={generateState.fsmType}
          isGenerated={isGenerated}
        />
      </div>

      {isUsingCustomEquation && !customEquationValidated && (
        <div className="content-box">
          <h2 className="customEq-title">
            Custom Equation
            <FontAwesomeIcon
              icon={faCircleInfo}
              className="info-icon"
              onMouseEnter={() => setShowMooreInfo(true)}
              onMouseLeave={() => setShowMooreInfo(false)}
            />
          </h2>
          {showMooreInfo && (
            <div className="customEq-tooltip">
              <p>
                <b>Number Ranges:</b>
              </p>
              <ul>
                <li><b>1 input & 2 or 3 flip-flops:</b> Enter values between <b>0-7</b>.</li>
                <li><b>2 inputs & 2 flip-flops:</b> Enter values between <b>0-15</b>.</li>
              </ul>
              <p>
                <b>Moore FSM:</b> Output Z is the same for all states, regardless of input
                X.
              </p>
              <ul>
                <li><b>1 input & 2 or 3 flip-flops:</b> Enter pairs, e.g. <b>(0,1)</b> <b>(2,3)</b> <b>(4,5)</b></li>
                <li><b>2 inputs & 2 flip-flops:</b> Enter groups of four, e.g. <b>(0,1,2,3)</b> <b>(4,5,6,7)</b></li>
              </ul>
              <p><b>Include all numbers</b> in the pair/group for moore.</p>
            </div>
          )}
          <p className="customEq-subtitle">Select minterms (Σm) or maxterms (<span className="maxterm">Π</span>M) and enter terms separated by commas.</p>

          {customEquations.map((eq, index) => (
            <div key={index} className="custom-equation">
              <strong>{eq.formattedEquation} = </strong> {/* Display formatted key */}
              <select
                className="custom-select"
                value={eq.type}
                onChange={(e) => {
                  const updated = [...customEquations];
                  updated[index].type = e.target.value;
                  setCustomEquations(updated);
                }}
              >
                <option value="Σ">Σm</option>
                <option value="Π">ΠM</option> 
              </select>
              <div className="custom-input">
              (
                <input
                  type="text"
                  value={eq.terms}
                  onChange={(e) => {
                    const updated = [...customEquations];
                    updated[index].terms = e.target.value;
                    setCustomEquations(updated);
                  }}
                />
                )
              </div>
            </div>
          ))}
          <button className="ok-btn" onClick={validateCustomEquations}>OK</button>
        </div>
      )}

      {/* Display Generated Minterms & Maxterms */}
      {customEquationValidated ? (
        <div className={`equation-section ${isGenerated ? "active" : ""}`}>
          <p>
            {customEquations.map(({ formattedEquation, terms, type }) => (
              <span key={formattedEquation} className="equation-item">
                <strong>{formattedEquation}&nbsp;=&nbsp;</strong>
                {type === "Σ" ? (
                  <span>Σm</span> 
                ) : (
                  <span>
                    <span style={{ fontFamily: "Times New Roman", fontSize: "1.15em" }}>Π</span>M
                  </span> 
                )}
                (
                  {terms} 
                )
              </span>
            ))}
          </p>
        </div>
      ) : isGenerated ? (
        <div className={`equation-section ${isGenerated ? "active" : ""}`}>
          {!isGenerated ? (
            <h3 style = {{color: "#cccccc"}}>Logic Equations</h3>
          ) : (
            <>
              <p>
                {logicEquation.map(
                  ({ equation, formattedTerms }) => (
                    <span key={equation} className="equation-item">
                      <strong>{equation}&nbsp;=&nbsp;</strong>{formattedTerms}
                    </span>
                  )
                )}
              </p>
            </>
          )}
        </div>
      ) : null}

      {/* Display Instruction */}
      {isGenerated && (
        <div className="instruction-section active">
          <p>
            Using the circuit and logic equations, complete the excitation and state transition tables to derive the state diagram.
          </p>
        </div>
      )}

      {/* Excitation Table Section */}
      <div className={`content-box excitation-box ${showExcitationTable ? "active" : ""}`}>
        <h2>Excitation Table</h2>
        {excitationTable.length > 0 && showExcitationTable && (
          <>
          <p>{excitationSubheader}</p>
          <div>
            <div className="table-container">
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
                              onFocus={(e) => e.target.select()}
                              onChange={(e) =>
                                handleExcitationInputChange(rowIndex, flipFlop, e.target.value)
                              }
                              disabled={status === "correct" || status === "given-up"}
                              className={
                                status === "given-up" ? "input-givenup" :
                                status === "correct" ? "input-correct" : 
                                status === "incorrect" ? "input-incorrect" :
                                "input-default"
                              }
                            />
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="button-group">
              {!isExcitationTableComplete && (
                <>
                  <button
                    className={`next-btn ${isNextExcitationButtonEnabled ? 'active' : 'disabled'}`}
                    disabled={!isNextExcitationButtonEnabled}
                    onClick={validateExcitationInputs}
                  >
                    Next
                  </button>
                  {!isExcitationGivenUp && (
                    <button
                      className={`giveup-btn ${excitationAttemptCount >= 2 ? 'active' : 'disabled'}`}
                      disabled={excitationAttemptCount < 2}
                      onClick={handleGiveUpExcitation}
                    >
                      Give Up
                    </button>
                  )}
                </>
              )}

              <button 
                className={`export-btn ${isDownloadExcitationEnabled ? "active" : "disabled"}`}
                disabled={!isDownloadExcitationEnabled}
                onClick={() => exportToCSV("excitation")}>
                  <FontAwesomeIcon icon={faDownload} /> CSV
              </button>
            </div>
          </div>
          </>
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
                      <div className="input-wrapper">
                        <input
                          type="text"
                          value={row.nextState.value}
                          onFocus={(e) => {
                            e.target.select();
                            // Trigger tooltip when user focuses
                            handleStateTransitionInputChange(rowIndex, "nextState", row.nextState.value);
                          }}
                          onChange={(e) =>
                            row.nextState.editable &&
                            handleStateTransitionInputChange(rowIndex, "nextState", e.target.value)
                          }
                          disabled={!row.nextState.editable}
                          className={
                            row.nextState.status === "given-up" ? "input-givenup" :
                            row.nextState.status === "correct" ? "input-correct" : 
                            row.nextState.status === "incorrect" ? "input-incorrect" :
                            "input-default"
                          }
                        />
                        {row.nextState.focusTooltip && (
                          <span className="tooltip-focus">{row.nextState.focusTooltip}</span>
                        )}
                      </div>
                    </td>
                    <td className="outputZ-column">
                      <input
                        type="text"
                        value={row.output.value}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) =>
                          row.output.editable &&
                          handleStateTransitionInputChange(rowIndex, "output", e.target.value)
                        }
                        disabled={!row.output.editable}
                        className={
                          row.output.status === "correct" ? "input-correct" :
                          row.output.status === "incorrect" ? "input-incorrect" :
                          row.output.status === "given-up" ? "input-givenup" :
                          "input-default"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="button-group">
              {!isStateTransitionTableComplete && (
                <>
                  <button
                    className={`next-btn ${isGenerateStateDiagramButtonEnabled ? 'active' : 'disabled'}`}
                    disabled={!isGenerateStateDiagramButtonEnabled}
                    onClick={validateStateTransitionInputs} 
                  >
                    Generate State Diagram
                  </button>
                  {!isStateTransitionGivenUp && (
                    <button
                      className={`giveup-btn ${stateTransitionAttemptCount >= 2 ? 'active' : 'disabled'}`}
                      disabled={stateTransitionAttemptCount < 2}
                      onClick={handleGiveUpStateTransition}
                    >
                      Give Up
                    </button>
                  )}
                </>
              )}
              <button className={`export-btn ${isDownloadStateTransitionEnabled ? "active" : "disabled"}`}
                disabled={!isDownloadStateTransitionEnabled}
                onClick={() => exportToCSV("stateTransition")}>
                  <FontAwesomeIcon icon={faDownload} /> CSV
              </button>
              </div>
          </div>
        )}
      </div>

      {/* State Diagram Section */}
      <div className={`content-box stateDiagram-box ${showStateDiagram ? "active" : ""}`}>
        <h2>State Diagram</h2>
        <div className="state-container">
          {showStateDiagram && stateTransitionTable.length > 0 && (
            <CTSConversion
              stateTransitionTable={stateTransitionTable}
              fsmType={generateState.fsmType}
              numFlipFlops={parseInt(generateState.numFlipFlops)}
              numInputs={parseInt(generateState.numInputs)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CircuitToState;



