import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  // useMemo,
} from "react";

import CircuitDiagram from "../components/circuitToState/CircuitDiagram";

import {
  generateBinaryStates,
  getRandomNumber,
  shuffleArray,
  generateUniqueTerms,
  validateMooreOutput,
  formatKeyForDisplay,
  generateDescendingLabels,
  computeNextState,
} from "../utils/circuitToState/ctsUtils";

import useNetlistImages from "../hooks/circuitToState/useNetlistImages";

import {
  exportToCSV,
  exportAllImagesAsZip,
  exportStateDiagramAsPNG,
  downloadFullExercise,
} from "../utils/circuitToState/ctsExportUtils";
import {
  convertMintermsToSOP,
  convertMaxtermsToPOS,
} from "../utils/circuitToState/booleanConverter";
import {
  convertSOPToNetlist,
  convertPOSToNetlist,
} from "../utils/circuitToState/booleanToNetlist";

import ControlPanel from "../components/circuitToState/ControlPanel";
import CustomEquationSection from "../components/circuitToState/CustomEquationSection";
import EquationDisplay from "../components/circuitToState/EquationDisplay";
import ExcitationTableSection from "../components/circuitToState/ExcitationTableSection";
import StateTransitionTableSection from "../components/circuitToState/StateTransitionTableSection";
import StateDiagramSection from "../components/circuitToState/StateDiagramSection";
import ValidationPopup from "../components/circuitToState/ValidationPopup";
import BooleanPopup from "../components/circuitToState/BooleanPopup";
import NetlistPopup from "../components/circuitToState/NetlistPopup";

import "../styles/CircuitToState.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { faDownload } from "@fortawesome/free-solid-svg-icons";

const CircuitToState = () => {
  const [logicEquation, setLogicEquation] = useState([]);
  const [isGenerated, setIsGenerated] = useState(false);

  const [excitationTable, setExcitationTable] = useState([]);
  const [stateTransitionTable, setStateTransitionTable] = useState([]);

  const [hiddenExcitationCorrectAnswers, setHiddenExcitationCorrectAnswers] =
    useState({});
  const [
    hiddenStateTransitionCorrectAnswers,
    setHiddenStateTransitionCorrectAnswers,
  ] = useState({
    nextState: [],
    output: [],
  });

  const [showExcitationTable, setShowExcitationTable] = useState(false);
  const [showStateTransitionTable, setShowStateTransitionTable] =
    useState(false);
  const [showStateDiagram, setShowStateDiagram] = useState(false);

  const [userExcitationInputs, setUserExcitationInputs] = useState([]);
  const [userStateTransitionInputs, setUserStateTransitionInputs] = useState(
    [],
  );

  const [isExcitationTableComplete, setIsExcitationTableComplete] =
    useState(false);
  const [isStateTransitionTableComplete, setIsStateTransitionTableComplete] =
    useState(false);

  const [excitationAttemptCount, setExcitationAttemptCount] = useState(0);
  const [stateTransitionAttemptCount, setStateTransitionAttemptCount] =
    useState(0);

  const [isNextExcitationButtonEnabled, setIsNextExcitationButtonEnabled] =
    useState(false);
  const [
    isGenerateStateDiagramButtonEnabled,
    setIsGenerateStateDiagramButtonEnabled,
  ] = useState(false);

  const [isExcitationGivenUp, setIsExcitationGivenUp] = useState(false);
  const [isStateTransitionGivenUp, setIsStateTransitionGivenUp] =
    useState(false);

  const [isCustomEquationChecked, setIsCustomEquationChecked] = useState(false);
  const [isUsingCustomEquation, setIsUsingCustomEquation] = useState(false);

  const [customEquations, setCustomEquations] = useState([]);
  const [customEquationValidated, setCustomEquationValidated] = useState(false);

  const [showCustomEqnInfo, setShowCustomEqnInfo] = useState(false);
  const [showExcitationInfo, setShowExcitationInfo] = useState(false);
  const [showStateTransitionInfo, setShowStateTransitionInfo] = useState(false);
  const [showStateDiagramInfo, setShowStateDiagramInfo] = useState(false);

  const [isDownloadExcitationEnabled, setIsDownloadExcitationEnabled] =
    useState(false);
  const [
    isDownloadStateTransitionEnabled,
    setIsDownloadStateTransitionEnabled,
  ] = useState(false);
  const [isDownloadFullExerciseEnabled, setIsDownloadFullExerciseEnabled] =
    useState(false);

  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const [validationMessage, setValidationMessage] = useState(null);

  const [showBooleanPopup, setShowBooleanPopup] = useState(false);
  const [booleanEquations, setBooleanEquations] = useState([]);

  const [showNetlistPopup, setShowNetlistPopup] = useState(false);
  const [netlistPopupContent, setNetlistPopupContent] = useState([]);

  const [netlistEquations, setNetlistEquations] = useState([]);

  const [hasClickedGenerate, setHasClickedGenerate] = useState(false);

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

  // For popup info icon
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest(".info-icon") &&
        !event.target.closest(".customEqn-tooltip") &&
        !event.target.closest(".info-tooltip-cts")
      ) {
        setShowCustomEqnInfo(false);
        setShowExcitationInfo(false);
        setShowStateTransitionInfo(false);
        setShowStateDiagramInfo(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const popupRef = useRef(null);
  const previouslyFocusedElement = useRef(null);

  const {
    netlistImages,
    fetchImagesCompleted,
    isFetchingImagesRef,
    fetchImagesFromNetlists,
  } = useNetlistImages();

  // For validation error popup
  const showPopupMessage = (message) => {
    previouslyFocusedElement.current = document.activeElement;
    setShowBooleanPopup(false);
    setValidationMessage(message);
    setShowValidationPopup(true);
  };

  // For closing only the validation popup (and restoring focus)
  const handleClosePopup = () => {
    setShowValidationPopup(false);
    if (previouslyFocusedElement.current) {
      previouslyFocusedElement.current.focus({ preventScroll: true }); // Restore focus
    }
  };

  // Focus into the popup when shown (only for validation popup)
  useEffect(() => {
    if (showValidationPopup && popupRef.current) {
      setTimeout(() => {
        popupRef.current.focus();
      }, 10);
    }
  }, [showValidationPopup]);

  // Unified handling for validation, boolean and netlist popup
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showValidationPopup) {
        e.preventDefault();
        handleClosePopup();
      } else if (showBooleanPopup) {
        e.preventDefault();
        setShowBooleanPopup(false);
      } else if (showNetlistPopup) {
        e.preventDefault();
        setShowNetlistPopup(false);
      }
    };

    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        if (showValidationPopup) {
          handleClosePopup();
        } else if (showBooleanPopup) {
          setShowBooleanPopup(false);
        }
      }
    };

    if (showValidationPopup || showBooleanPopup || showNetlistPopup) {
      window.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showValidationPopup, showBooleanPopup, showNetlistPopup]);

  // Shared helper functions for the two useEffect of custom eqn and generated eqn to boolean eqn + netlists + image fetch
  const processConvertedEquations = useCallback(
    (converted) => {
      setBooleanEquations(
        converted.map(({ label, expression }) => ({ label, expression })),
      );
      setNetlistEquations(
        converted.map(({ label, netlist }) => ({ label, netlist })),
      );
      fetchImagesFromNetlists(converted);
    },
    [fetchImagesFromNetlists],
  );

  // Helper for custom eqn conversion
  const buildConvertedCustomEquations = useCallback(() => {
    const { numFlipFlops, numInputs, fsmType } = generateState;

    return customEquations.map((eq) => {
      const { type, terms, formattedEquation, equation } = eq;
      const termArray = terms.split(",").map(Number);
      const rawLabel = equation;

      const booleanExpr =
        type === "Σ"
          ? convertMintermsToSOP(
              termArray,
              parseInt(numFlipFlops, 10),
              parseInt(numInputs, 10),
              fsmType,
              rawLabel,
            )
          : convertMaxtermsToPOS(
              termArray,
              parseInt(numFlipFlops, 10),
              parseInt(numInputs, 10),
              fsmType,
              rawLabel,
            );

      const netlist =
        type === "Σ"
          ? convertSOPToNetlist(
              booleanExpr,
              formattedEquation,
              fsmType,
              rawLabel,
            )
          : convertPOSToNetlist(
              booleanExpr,
              formattedEquation,
              fsmType,
              rawLabel,
            );

      return {
        label: formattedEquation,
        expression: booleanExpr,
        netlist,
      };
    });
  }, [customEquations, generateState]);

  // Helper for generated eqn conversion
  const buildConvertedGeneratedEquations = useCallback(() => {
    const { numFlipFlops, numInputs, fsmType } = generateState;

    return logicEquation.map((eq) => {
      const { equation, terms, isMinterm } = eq;
      const rawLabel = equation.split("(")[0];

      const booleanExpr = isMinterm
        ? convertMintermsToSOP(
            terms,
            parseInt(numFlipFlops, 10),
            parseInt(numInputs, 10),
            fsmType,
            rawLabel,
          )
        : convertMaxtermsToPOS(
            terms,
            parseInt(numFlipFlops, 10),
            parseInt(numInputs, 10),
            fsmType,
            rawLabel,
          );

      const netlist = isMinterm
        ? convertSOPToNetlist(booleanExpr, equation, fsmType, rawLabel)
        : convertPOSToNetlist(booleanExpr, equation, fsmType, rawLabel);

      return {
        label: equation,
        expression: booleanExpr,
        netlist,
      };
    });
  }, [logicEquation, generateState]);

  // Convert custom equations to boolean + netlist
  useEffect(() => {
    if (
      hasClickedGenerate &&
      customEquationValidated &&
      customEquations.length > 0
    ) {
      const converted = buildConvertedCustomEquations();
      processConvertedEquations(converted);

      console.log("Custom Boolean Equations:", converted);
    }
  }, [
    hasClickedGenerate,
    customEquationValidated,
    customEquations.length,
    buildConvertedCustomEquations,
    processConvertedEquations,
  ]);

  // Convert generated equations to boolean + netlist
  useEffect(() => {
    if (
      hasClickedGenerate &&
      logicEquation.length > 0 &&
      isGenerated &&
      !isUsingCustomEquation
    ) {
      const converted = buildConvertedGeneratedEquations();
      processConvertedEquations(converted);

      console.log("Generated Boolean Equations:", converted);
    }
  }, [
    hasClickedGenerate,
    logicEquation.length,
    isGenerated,
    isUsingCustomEquation,
    buildConvertedGeneratedEquations,
    processConvertedEquations,
  ]);

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

  // Helper: Randomly select a dropdown value
  const getRandomDropdownValue = (options) => {
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
  };

  const resetExerciseProgress = () => {
    // Reset attempt counters
    setExcitationAttemptCount(0);
    setStateTransitionAttemptCount(0);
    setIsExcitationGivenUp(false);
    setIsStateTransitionGivenUp(false);

    // Reset completion states
    setIsExcitationTableComplete(false);
    setIsStateTransitionTableComplete(false);

    // Reset user inputs for tables
    setUserExcitationInputs([]);
    setUserStateTransitionInputs([]);
    setHiddenExcitationCorrectAnswers({});
    setHiddenStateTransitionCorrectAnswers({ nextState: [], output: [] });

    // Reset download buttons
    setIsDownloadExcitationEnabled(false);
    setIsDownloadStateTransitionEnabled(false);
    setIsDownloadFullExerciseEnabled(false);
  };

  const startGeneration = (
    selectedState,
    shouldUpdateDropdownState = false,
  ) => {
    setHasClickedGenerate(true);
    resetExerciseProgress();

    if (shouldUpdateDropdownState) {
      setDropdownState(selectedState); // set new dropdown states
    }

    setGenerateState(selectedState);

    if (isCustomEquationChecked) {
      setIsUsingCustomEquation(true);
      setCustomEquationValidated(false);
      setIsGenerated(false);
      setShowExcitationTable(false);
      setShowStateTransitionTable(false);
      setShowStateDiagram(false);
      generateCustomEquationTemplate(selectedState);
    } else {
      setIsUsingCustomEquation(false);
      setCustomEquations([]);
      setCustomEquationValidated(false);
      setIsGenerated(true);
      setShowExcitationTable(true);
      setShowStateTransitionTable(false);
      setShowStateDiagram(false);
      generateEquations(selectedState);
    }
  };

  // Trigger generation manually on button click
  const handleGenerateButtonClick = () => {
    if (!isFormComplete) return;
    startGeneration({ ...dropdownState });
  };

  // Helper: Auto-generate
  const handleAutoGenerate = () => {
    const randomDropdownState = {
      numInputs: getRandomDropdownValue(["1", "2"]),
      flipFlopType: getRandomDropdownValue(["D", "T", "JK"]),
      numFlipFlops: getRandomDropdownValue(["2", "3"]),
      fsmType: getRandomDropdownValue(["Mealy", "Moore"]),
      preFillOption: getRandomDropdownValue([
        "random75",
        "random50",
        "random25",
        "none",
      ]),
    };

    if (
      randomDropdownState.numInputs === "2" &&
      randomDropdownState.numFlipFlops === "3"
    ) {
      randomDropdownState.numFlipFlops = "2";
    }

    startGeneration(randomDropdownState, true);
  };

  const handleCustomEquationCheckboxChange = () => {
    setIsCustomEquationChecked((prev) => !prev);
    setIsUsingCustomEquation(false);
    setHasClickedGenerate(false);
  };

  // Handlers for input onChange
  const handleCustomEquationTypeChange = (index, value) => {
    const updated = [...customEquations];
    updated[index].type = value;
    setCustomEquations(updated);
  };

  // Handlers for input onChange
  const handleCustomEquationTermsChange = (index, value) => {
    const updated = [...customEquations];
    updated[index].terms = value;
    setCustomEquations(updated);
  };

  const generateCustomEquationTemplate = (state) => {
    const { numInputs, flipFlopType, numFlipFlops, fsmType } = state;

    const allFlipFlops = [];
    if (flipFlopType === "D" || flipFlopType === "T") {
      for (let i = parseInt(numFlipFlops, 10) - 1; i >= 0; i--) {
        allFlipFlops.push(`${flipFlopType}${i}`);
      }
    } else if (flipFlopType === "JK") {
      for (let i = parseInt(numFlipFlops, 10) - 1; i >= 0; i--) {
        allFlipFlops.push(`J${i}`, `K${i}`);
      }
    }

    allFlipFlops.push("Z");

    const formattedEquations = allFlipFlops.map((flipFlop) => ({
      equation: flipFlop,
      formattedEquation: formatKeyForDisplay(
        flipFlop,
        numInputs,
        numFlipFlops,
        fsmType,
      ),
      terms: "",
      type: "Σ", // Default to minterm
    }));

    setCustomEquations(formattedEquations);
    setIsGenerated(false);
  };

  const validateCustomEquations = () => {
    const { numInputs, numFlipFlops, fsmType } = generateState;
    const totalRows = Math.pow(
      2,
      parseInt(numFlipFlops, 10) + parseInt(numInputs, 10),
    );
    const maxZState = Math.pow(2, parseInt(numFlipFlops, 10)) - 1;

    const updatedHiddenAnswers = {};
    let correctedEquations = [...customEquations]; // Clone the equations array

    // Auto-correct input before validation
    correctedEquations = correctedEquations.map((eq) => {
      let correctedTerms = eq.terms
        .replace(/\s+/g, "") // Remove all spaces
        .replace(/,+/g, ",") // Remove extra commas
        .replace(/,$/, "") // Remove trailing comma
        .replace(/^,/, ""); // Remove leading comma

      return { ...eq, terms: correctedTerms };
    });

    setCustomEquations(correctedEquations); // Apply cleaned input to state

    // Validate the corrected input
    for (let eq of correctedEquations) {
      if (eq.terms.trim() === "") {
        showPopupMessage("Error: Terms cannot be empty.");
        return;
      }

      if (!/^\d+(,\d+)*$/.test(eq.terms)) {
        showPopupMessage(
          "Error: Use only numbers separated by commas. (e.g. 0,1,2)",
        );
        return;
      }

      const termsArray = eq.terms.split(",").map(Number); // Convert to an array of numbers
      const uniqueTerms = [...new Set(termsArray)]; // Remove duplicates

      // Check if there were duplicates
      if (uniqueTerms.length !== termsArray.length) {
        showPopupMessage("Error: Duplicate values detected.");
        return;
      }

      // Moore FSM Validation
      if (eq.equation === "Z") {
        if (fsmType === "Moore") {
          // Validate only state indices (0 to 2^n - 1)
          if (!validateMooreOutput(uniqueTerms, numFlipFlops)) {
            showPopupMessage(
              <>
                Error: Moore FSM output Z depends only on the current states.
                Valid values: <b>0 to {maxZState}</b>.{" "}
                <FontAwesomeIcon icon={faCircleInfo} className="info-custom" />
              </>,
            );
            return;
          }
        } else {
          // Mealy FSM Z terms — validate as row indices
          if (uniqueTerms.some((num) => num < 0 || num >= totalRows)) {
            showPopupMessage(
              `Error: Mealy FSM output Z terms must be 0 to ${totalRows - 1}.`,
            );
            return;
          }
        }
      } else {
        // Flip-Flop equation (D0, JK1, etc)
        if (uniqueTerms.some((num) => num < 0 || num >= totalRows)) {
          showPopupMessage(
            `Error: Allowed terms for ${eq.equation} are 0 to ${totalRows - 1}.`,
          );
          return;
        }
      }

      // Sort the terms array in ascending order
      const sortedTerms = [...uniqueTerms].sort((a, b) => a - b);
      eq.terms = sortedTerms.join(",");

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

    generateTablesFromCustomEquations(updatedHiddenAnswers);
  };

  // Check if all input fields are filled in excitation table
  const areAllExcitationInputsFilled = useCallback(() => {
    return userExcitationInputs.every((row) =>
      Object.values(row.flipFlopInputs).every(
        ({ value }) => value === "0" || value === "1",
      ),
    );
  }, [userExcitationInputs]);

  // Check if all input fields are filled in state transition table
  const areAllStateTransitionInputsFilled = useCallback(() => {
    return userStateTransitionInputs.every(
      (row) => row.nextState.value.length > 0 && row.output.value.length > 0, // Allow incomplete but non-empty values
    );
  }, [userStateTransitionInputs]);

  // Update button state when user inputs change
  useEffect(() => {
    setIsNextExcitationButtonEnabled(areAllExcitationInputsFilled());
  }, [areAllExcitationInputsFilled]);

  useEffect(() => {
    setIsGenerateStateDiagramButtonEnabled(areAllStateTransitionInputsFilled());
  }, [areAllStateTransitionInputsFilled]);

  // Shared helper functions for generateTablesFromCustomEquations and generateEquations

  const getPreFillPercent = (preFillOption) => {
    if (preFillOption === "random75") return 0.75;
    if (preFillOption === "random50") return 0.5;
    if (preFillOption === "random25") return 0.25;
    return 0;
  };

  const getSelectedPrefillIndices = (totalFields, preFillPercent) => {
    const preFillCount = Math.floor(totalFields * preFillPercent);

    return new Set(
      shuffleArray(Array.from({ length: totalFields }, (_, i) => i)).slice(
        0,
        preFillCount,
      ),
    );
  };

  // Prefill Excitation Table
  const buildPrefilledExcitationInputs = (
    newExcitationTable,
    selectedExcitation,
  ) => {
    return newExcitationTable.map((row, rowIndex) => {
      const updatedRow = { ...row };

      Object.keys(row.flipFlopInputs).forEach((flipFlop, colIndex) => {
        const fieldIndex =
          rowIndex * Object.keys(row.flipFlopInputs).length + colIndex;

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
  };

  // Prefill State Transition Table
  const buildPrefilledStateTransitionInputs = (
    newStateTransitionTable,
    selectedState,
  ) => {
    return newStateTransitionTable.map((row, rowIndex) => {
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
  };

  // No pre-fill: All input fields are empty in excitation table
  const buildEmptyExcitationInputs = (newExcitationTable) => {
    return newExcitationTable.map((row) => ({
      ...row,
      flipFlopInputs: Object.keys(row.flipFlopInputs).reduce((acc, key) => {
        acc[key] = { value: "", status: "editable" };
        return acc;
      }, {}),
    }));
  };

  // No pre-fill: All input fields are empty in state transition table
  const buildEmptyStateTransitionInputs = (newStateTransitionTable) => {
    return newStateTransitionTable.map((row) => ({
      ...row,
      nextState: { value: "", status: "editable", editable: true },
      output: { value: "", status: "editable", editable: true },
    }));
  };

  const applyPrefillToTables = (
    newExcitationTable,
    newStateTransitionTable,
    preFillOption,
  ) => {
    // Guarge against empty tables
    if (!newExcitationTable.length || !newStateTransitionTable.length) {
      setUserExcitationInputs([]);
      setUserStateTransitionInputs([]);
      return;
    }

    if (preFillOption && preFillOption.startsWith("random")) {
      const preFillPercent = getPreFillPercent(preFillOption);

      const totalExcitationFields =
        newExcitationTable.length *
        Object.keys(newExcitationTable[0].flipFlopInputs).length;

      const totalStateFields = newStateTransitionTable.length * 2; // Next State + Output Z

      const selectedExcitation = getSelectedPrefillIndices(
        totalExcitationFields,
        preFillPercent,
      );

      const selectedState = getSelectedPrefillIndices(
        totalStateFields,
        preFillPercent,
      );

      setUserExcitationInputs(
        buildPrefilledExcitationInputs(newExcitationTable, selectedExcitation),
      );

      setUserStateTransitionInputs(
        buildPrefilledStateTransitionInputs(
          newStateTransitionTable,
          selectedState,
        ),
      );
    } else {
      setUserExcitationInputs(buildEmptyExcitationInputs(newExcitationTable));
      setUserStateTransitionInputs(
        buildEmptyStateTransitionInputs(newStateTransitionTable),
      );
    }
  };

  const generateTablesFromCustomEquations = (userCustomAnswers) => {
    const { numFlipFlops, numInputs, preFillOption } = generateState;

    const binaryStates = generateBinaryStates(parseInt(numFlipFlops, 10));
    const binaryInputs = generateBinaryStates(parseInt(numInputs, 10));

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
          parseInt(numFlipFlops, 10),
        );

        const zTerms = userCustomAnswers?.["Z"]?.terms || [];
        const isZMinterm = userCustomAnswers?.["Z"]?.isMinterm;
        let outputValue = "0";
        if (generateState.fsmType === "Moore") {
          const stateIndexDec = parseInt(currentState, 2);
          outputValue = isZMinterm
            ? zTerms.includes(stateIndexDec)
              ? "1"
              : "0"
            : zTerms.includes(stateIndexDec)
              ? "0"
              : "1";
        } else {
          outputValue = isZMinterm
            ? zTerms.includes(rowIndex)
              ? "1"
              : "0"
            : zTerms.includes(rowIndex)
              ? "0"
              : "1";
        }

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
              ? terms.includes(rowIndex)
                ? "1"
                : "0"
              : terms.includes(rowIndex)
                ? "0"
                : "1";
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

    applyPrefillToTables(
      newExcitationTable,
      newStateTransitionTable,
      preFillOption,
    );

    setExcitationTable(newExcitationTable);
    setStateTransitionTable(newStateTransitionTable);
  };

  // Generate Logic Equations
  const generateEquations = (state) => {
    const { numInputs, flipFlopType, numFlipFlops, fsmType, preFillOption } =
      state || dropdownState;

    if (
      !numInputs ||
      !flipFlopType ||
      !numFlipFlops ||
      !fsmType ||
      !preFillOption
    ) {
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
    } else if (
      (numFlipFlops === "2" && numInputs === "2") ||
      (numFlipFlops === "3" && numInputs === "1")
    ) {
      maxValue = 16;
      minTerms = 6;
      maxTerms = 10;
    }

    let outputMinTerms = minTerms;
    let outputMaxTerms = maxTerms;
    if (fsmType === "Moore") {
      if (numFlipFlops === "2") {
        outputMinTerms = 1;
        outputMaxTerms = 3; // Because 2 FFs = 4 states = max 4 Z terms (0–3)
      } else if (numFlipFlops === "3") {
        outputMinTerms = 4;
        outputMaxTerms = 6; // 3 FFs = 8 states = max 8 Z terms (0–7)
      }
    }

    const generatedTerms = [];
    const excitationCorrectAnswers = {};
    const allFlipFlops = [];

    const binaryStates = generateBinaryStates(parseInt(numFlipFlops, 10));
    const binaryInputs = generateBinaryStates(parseInt(numInputs, 10));

    // Generate minterms or maxterms for Flip-Flops
    if (flipFlopType === "D" || flipFlopType === "T") {
      for (let i = parseInt(numFlipFlops, 10) - 1; i >= 0; i--) {
        allFlipFlops.push(`${flipFlopType}${i}`);
      }
    } else if (flipFlopType === "JK") {
      for (let i = parseInt(numFlipFlops, 10) - 1; i >= 0; i--) {
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
        isMinterm,
      );

      const formattedKey = formatKeyForDisplay(
        flipFlop,
        numInputs,
        numFlipFlops,
        fsmType,
      );

      const formattedTerms = isMinterm ? (
        <>
          <span className="minterm">Σ</span>m({terms.join(",\u00A0")})
        </>
      ) : (
        <>
          <span className="maxterm">Π</span>M({terms.join(",\u00A0")})
        </>
      );

      generatedTerms.push({
        equation: formattedKey,
        terms,
        isMinterm,
        formattedTerms,
      });

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
      const stateDecimalList = binaryStates.map((state) => parseInt(state, 2));
      const maxStates = stateDecimalList.length; // e.g. 4 or 8

      const numSelectedStates = getRandomNumber(
        Math.max(1, outputMinTerms),
        Math.min(outputMaxTerms, maxStates),
      );

      const selectedStates = shuffleArray(stateDecimalList).slice(
        0,
        numSelectedStates,
      );
      outputTerms = selectedStates.sort((a, b) => a - b); // Z(Q1,Q0) = m(0, 1) etc.
    } else {
      // Default random generation for Mealy
      outputTerms = generateUniqueTerms(
        getRandomNumber(minTerms, maxTerms),
        maxValue,
      );
    }

    const formattedOutputKey = formatKeyForDisplay(
      "Z",
      numInputs,
      numFlipFlops,
      fsmType,
    );

    const formattedOutputTerms = isOutputMinterm ? (
      <>
        <span className="minterm">Σ</span>m({outputTerms.join(",\u00A0")})
      </>
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
          parseInt(numFlipFlops, 10),
        );

        let outputVal = "0";
        if (fsmType === "Moore") {
          const stateIndexDec = parseInt(currentState, 2); // 0 to 3 or 7
          outputVal = isOutputMinterm
            ? outputTerms.includes(stateIndexDec)
              ? "1"
              : "0"
            : outputTerms.includes(stateIndexDec)
              ? "0"
              : "1";
        } else {
          outputVal = isOutputMinterm
            ? outputTerms.includes(rowIndex)
              ? "1"
              : "0"
            : outputTerms.includes(rowIndex)
              ? "0"
              : "1";
        }

        // Add to state transition table
        const transitionRow = {
          currentState,
          input,
          nextState,
          output: outputVal,
        };

        // Populate excitation table
        allFlipFlops.forEach((flipFlop) => {
          const terms = excitationCorrectAnswers[flipFlop]?.terms || [];
          const isMinterm = excitationCorrectAnswers[flipFlop]?.isMinterm;
          excitationRow.flipFlopInputs[flipFlop] = isMinterm
            ? terms.includes(rowIndex)
              ? "1"
              : "0"
            : terms.includes(rowIndex)
              ? "0"
              : "1";
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

    applyPrefillToTables(
      newExcitationTable,
      newStateTransitionTable,
      preFillOption,
    );

    setExcitationTable(newExcitationTable);
    setStateTransitionTable(newStateTransitionTable);
  };

  // Handle user input change in excitation table
  const handleExcitationInputChange = (rowIndex, flipFlop, value) => {
    if (value === "" || value === "0" || value === "1") {
      // Allow only binary values or empty input (for backspace)
      setUserExcitationInputs((prevInputs) => {
        const updatedInputs = [...prevInputs];
        updatedInputs[rowIndex].flipFlopInputs[flipFlop].value = value;
        return updatedInputs;
      });
    } else {
      showPopupMessage(
        "Flip-Flop inputs must be single-bit binary values: 0 or 1. ",
      );
    }
  };

  // Handle user input change in state transition table
  const handleStateTransitionInputChange = (rowIndex, column, value) => {
    const { numFlipFlops } = generateState;

    if (column === "nextState") {
      // Allow typing progressively valid binary values
      const isValidNextState = new RegExp(`^[01]{0,${numFlipFlops}}$`).test(
        value,
      );

      if (isValidNextState) {
        setUserStateTransitionInputs((prevInputs) => {
          const updatedInputs = [...prevInputs];

          // Check if the length is correct
          const isTooShort =
            value.length > 0 && value.length < parseInt(numFlipFlops, 10);

          updatedInputs[rowIndex][column] = {
            ...updatedInputs[rowIndex][column],
            value: value,
            focusTooltip: isTooShort ? `Enter ${numFlipFlops} bits` : "",
          };
          return updatedInputs;
        });
      } else {
        showPopupMessage(
          `With ${numFlipFlops} flip-flops, Next State must be a ${numFlipFlops}-bit binary, each bit is 0 or 1.`,
        );
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
        showPopupMessage(
          "With one output, output Z must be single-bit binary: 0 or 1.",
        );
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
          ? terms.includes(index)
            ? "1"
            : "0" // Minterms expect "1"
          : terms.includes(index)
            ? "0"
            : "1"; // Maxterms expect "0"

        // If this input was already given up, leave it as is.
        if (row.flipFlopInputs[flipFlop].status === "given-up") {
          updatedRow.flipFlopInputs[flipFlop] = row.flipFlopInputs[flipFlop];
        } else if (
          row.flipFlopInputs[flipFlop].value === correctExcitationValue
        ) {
          // Check if the current input matches the expected value
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
      setIsDownloadExcitationEnabled(true);
    } else {
      // Increment attempt counter if not all correct
      setExcitationAttemptCount((prev) => prev + 1, 2);
    }
  };

  // Validate state transition inputs
  const validateStateTransitionInputs = () => {
    let allCorrect = true;
    const { numFlipFlops } = generateState;

    const updatedInputs = userStateTransitionInputs.map((row, index) => {
      const updatedRow = { ...row };

      // Get the correct answers for this row
      const correctNextState =
        hiddenStateTransitionCorrectAnswers.nextState[index];
      const correctOutput = hiddenStateTransitionCorrectAnswers.output[index];

      // Validate Next State column
      if (row.nextState.value.length !== parseInt(numFlipFlops, 10)) {
        allCorrect = false;
        updatedRow.nextState = {
          value: row.nextState.value,
          status: "incorrect",
          editable: true,
        };
      } else if (row.nextState.status === "given-up") {
        updatedRow.nextState = row.nextState;
      } else if (row.nextState.value === correctNextState) {
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
      } else if (row.output.value === correctOutput) {
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
      setShowStateDiagram(true);
      setIsDownloadStateTransitionEnabled(true);
      setIsDownloadFullExerciseEnabled(true);
    } else {
      // Increment attempt counter if answers are still incorrect
      setStateTransitionAttemptCount((prev) => prev + 1, 2);
    }
  };

  // Give Up button in Excitation Table
  const handleGiveUpExcitation = () => {
    const updatedInputs = userExcitationInputs.map((row, index) => {
      const updatedRow = { ...row };
      Object.keys(row.flipFlopInputs).forEach((flipFlop) => {
        // Get the correct value for this cell
        const { terms, isMinterm } = hiddenExcitationCorrectAnswers[flipFlop];
        const correctValue = isMinterm
          ? terms.includes(index)
            ? "1"
            : "0"
          : terms.includes(index)
            ? "0"
            : "1";

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
    setIsExcitationGivenUp(true);

    setIsDownloadExcitationEnabled(true);
    setIsDownloadFullExerciseEnabled(true);
  };

  // Give Up button in State Transition Table
  const handleGiveUpStateTransition = () => {
    const updatedInputs = userStateTransitionInputs.map((row, index) => {
      const updatedRow = { ...row };

      // For next state: only update if incorrect.
      const correctNextState =
        hiddenStateTransitionCorrectAnswers.nextState[index];
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
    setIsStateTransitionGivenUp(true);

    setIsDownloadStateTransitionEnabled(true);
  };

  // Excitation Table Headers
  const generateExcitationTableHeaders = () => {
    const { flipFlopType, numFlipFlops, numInputs } = generateState;
    const headers = [
      <>
        Current State
        <br />
        {generateDescendingLabels("Q", numFlipFlops).join("")}
      </>,
      <>
        Input
        <br />
        {generateDescendingLabels("X", numInputs).join("")}
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
        Current State
        <br />
        {generateDescendingLabels("Q", numFlipFlops).join("")}
      </>,
      <>
        Input
        <br />
        {generateDescendingLabels("X", numInputs).join("")}
      </>,
      <>
        Next State
        <br />
        {generateDescendingLabels("Q", numFlipFlops, "*").join("")}
      </>,
      <>
        Output
        <br />Z
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

      {/* Dropdowns */}
      <ControlPanel
        dropdownState={dropdownState}
        isFormComplete={isFormComplete}
        isCustomEquationChecked={isCustomEquationChecked}
        onDropdownChange={handleDropdownChange}
        onCustomEquationCheckboxChange={handleCustomEquationCheckboxChange}
        onGenerate={handleGenerateButtonClick}
        onAutoGenerate={handleAutoGenerate}
      />

      {/* Circuit Diagram Canvas */}
      <div className="circuit-container">
        {isGenerated && (
          <div className="circuit-export-btn-wrapper">
            {fetchImagesCompleted ? (
              <button
                type="button"
                className="export-btn circuit-export-btn"
                onClick={() =>
                  exportAllImagesAsZip({
                    generateState,
                    netlistImages,
                    netlistEquations,
                  })
                }
                title="Download Circuits & Netlists ZIP"
                aria-label="Download Circuits & Netlists ZIP"
              >
                <FontAwesomeIcon icon={faDownload} />
              </button>
            ) : (
              <div className="export-spinner" title="Generating...">
                <div className="netlist-spinner" />
              </div>
            )}
          </div>
        )}

        {/* Scrollable canvas */}
        <div className="circuit-scrollable">
          <CircuitDiagram
            numInputs={generateState.numInputs}
            flipFlopType={generateState.flipFlopType}
            numFlipFlops={generateState.numFlipFlops}
            fsmType={generateState.fsmType}
            isGenerated={isGenerated}
            netlistImages={netlistImages}
            setShowNetlistPopup={setShowNetlistPopup}
            setNetlistPopupContent={setNetlistPopupContent}
            showNetlistPopup={showNetlistPopup}
            netlistEquations={netlistEquations}
            fetchImagesFromNetlists={fetchImagesFromNetlists}
            isFetchingImagesRef={isFetchingImagesRef}
          />
        </div>
      </div>

      {/* Netlist Popup */}
      <NetlistPopup
        showNetlistPopup={showNetlistPopup}
        netlistPopupContent={netlistPopupContent}
        fetchImagesCompleted={fetchImagesCompleted}
        netlistImages={netlistImages}
        netlistEquations={netlistEquations}
        onClose={() => setShowNetlistPopup(false)}
      />

      {/* Custom Equation Section */}
      <CustomEquationSection
        isUsingCustomEquation={isUsingCustomEquation}
        customEquationValidated={customEquationValidated}
        showCustomEqnInfo={showCustomEqnInfo}
        customEquations={customEquations}
        onToggleInfo={() => setShowCustomEqnInfo(!showCustomEqnInfo)}
        onEquationTypeChange={handleCustomEquationTypeChange}
        onEquationTermsChange={handleCustomEquationTermsChange}
        onValidate={validateCustomEquations}
      />

      {/* Display Logic Equations */}
      <EquationDisplay
        customEquationValidated={customEquationValidated}
        isGenerated={isGenerated}
        customEquations={customEquations}
        logicEquation={logicEquation}
        onShowBooleanPopup={() => setShowBooleanPopup(true)}
      />

      {/* Popup */}
      <ValidationPopup
        showValidationPopup={showValidationPopup}
        validationMessage={validationMessage}
        popupRef={popupRef}
        onClose={handleClosePopup}
      />
      <BooleanPopup
        showBooleanPopup={showBooleanPopup}
        booleanEquations={booleanEquations}
        onClose={() => setShowBooleanPopup(false)}
      />

      {/* Display Instruction */}
      {isGenerated && (
        <div className="instruction-section active">
          <p>
            Click logic blocks to view the schematic logic circuits.
            <br />
            Given the circuit and logic equations, complete the excitation and
            state transition tables to derive the state diagram.
          </p>
        </div>
      )}

      {/* Excitation Table Section */}
      <ExcitationTableSection
        showExcitationTable={showExcitationTable}
        showExcitationInfo={showExcitationInfo}
        excitationTable={excitationTable}
        userExcitationInputs={userExcitationInputs}
        isDownloadExcitationEnabled={isDownloadExcitationEnabled}
        isExcitationTableComplete={isExcitationTableComplete}
        isNextExcitationButtonEnabled={isNextExcitationButtonEnabled}
        isExcitationGivenUp={isExcitationGivenUp}
        excitationAttemptCount={excitationAttemptCount}
        excitationHeaders={generateExcitationTableHeaders()}
        onToggleInfo={() => setShowExcitationInfo(!showExcitationInfo)}
        onExport={() =>
          exportToCSV({
            tableType: "excitation",
            generateState,
            excitationTable,
            stateTransitionTable,
            hiddenExcitationCorrectAnswers,
            hiddenStateTransitionCorrectAnswers,
          })
        }
        onInputChange={handleExcitationInputChange}
        onValidate={validateExcitationInputs}
        onGiveUp={handleGiveUpExcitation}
      />

      {/* State Transition Table */}
      <StateTransitionTableSection
        showStateTransitionTable={showStateTransitionTable}
        showStateTransitionInfo={showStateTransitionInfo}
        stateTransitionTable={stateTransitionTable}
        userStateTransitionInputs={userStateTransitionInputs}
        isDownloadStateTransitionEnabled={isDownloadStateTransitionEnabled}
        isStateTransitionTableComplete={isStateTransitionTableComplete}
        isGenerateStateDiagramButtonEnabled={
          isGenerateStateDiagramButtonEnabled
        }
        isStateTransitionGivenUp={isStateTransitionGivenUp}
        stateTransitionAttemptCount={stateTransitionAttemptCount}
        stateTransitionHeaders={generateStateTransitionTableHeaders()}
        onToggleInfo={() =>
          setShowStateTransitionInfo(!showStateTransitionInfo)
        }
        onExport={() =>
          exportToCSV({
            tableType: "stateTransition",
            generateState,
            excitationTable,
            stateTransitionTable,
            hiddenExcitationCorrectAnswers,
            hiddenStateTransitionCorrectAnswers,
          })
        }
        onInputChange={handleStateTransitionInputChange}
        onValidate={validateStateTransitionInputs}
        onGiveUp={handleGiveUpStateTransition}
      />

      {/* State Diagram Section */}
      <StateDiagramSection
        showStateDiagram={showStateDiagram}
        showStateDiagramInfo={showStateDiagramInfo}
        stateTransitionTable={stateTransitionTable}
        generateState={generateState}
        onToggleInfo={() => setShowStateDiagramInfo(!showStateDiagramInfo)}
        onExport={() => exportStateDiagramAsPNG({ generateState })}
      />

      {/* Download Full Exercise */}
      {showStateDiagram && isDownloadFullExerciseEnabled && (
        <div className="download-exercise-wrapper">
          <button
            type="button"
            className="exportFull-btn"
            onClick={() =>
              downloadFullExercise({
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
              })
            }
            disabled={isFetchingImagesRef.current} // only disable while fetching
            title={isFetchingImagesRef.current ? "Generating images..." : ""}
          >
            {isFetchingImagesRef.current ? (
              <div className="netlist-spinner-full" />
            ) : (
              <>
                <FontAwesomeIcon icon={faDownload} /> Download Full Exercise
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CircuitToState;
