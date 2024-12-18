/* CircuitToState.jsx */
import React, { useState } from 'react';
import CircuitDiagram from '../components/CircuitDiagram';
import '../styles/CircuitToState.css'; // Import specific styles for this page

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'; // FontAwesome Arrow

function CircuitToState() {
    // State variables to track dropdown selections
    const [numInputs, setNumInputs] = useState('');
    const [flipFlopType, setFlipFlopType] = useState('');
    const [numFlipFlops, setNumFlipFlops] = useState('');
    const [fsmType, setFsmType] = useState('');
    const [isGenerated, setIsGenerated] = useState(false); // Controls when generation happens
    const [minterms, setMinterms] = useState('');
    const [mintermOutputZ, setMintermOutputZ] = useState(''); // New state for output Z
  
    // State to store the selected values for display
    const [selectedValues, setSelectedValues] = useState({
      inputs: '',
      flipFlop: '',
      flipFlopsNum: '',
      fsm: ''
    });

    // To hold the dropdown selections before clicking "Generate"
    const [dropdownState, setDropdownState] = useState({
        numInputs: '',
        flipFlopType: '',
        numFlipFlops: '',
        fsmType: ''
     });
     

    const [excitationTable, setExcitationTable] = useState({});
    const [stateTransitionTable, setStateTransitionTable] = useState({});
    const [isExcitationTableFilled, setIsExcitationTableFilled] = useState(false);
    const [isStateTransitionTableFilled, setIsStateTransitionTableFilled] = useState(false);

    const [expectedExcitationTable, setExpectedExcitationTable] = useState({});
    const [cellValidation, setCellValidation] = useState({});
    const [isExcitationTableLocked, setIsExcitationTableLocked] = useState(false);
    const [isExcitationTableValidated, setIsExcitationTableValidated] = useState(false);
    const [isStateTransitionTableExpanded, setIsStateTransitionTableExpanded] = useState(false);



  
    // Logic to enable or disable the "Generate" button using dropdownState instead
    const isFormComplete = dropdownState.numInputs && dropdownState.flipFlopType && dropdownState.numFlipFlops && dropdownState.fsmType;
  
    // Helper function to generate a random number between min and max
    const getRandomNumber = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    // Helper function to shuffle an array (Fisher-Yates Shuffle)
    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    // Helper function to generate unique minterms within a defined range
    const generateUniqueMinterms = (limit, maxValue) => {
        const possibleMinterms = Array.from({ length: maxValue }, (_, index) => index); // Create array [0, 1, 2, ..., maxValue-1]

        const shuffledMinterms = shuffleArray(possibleMinterms); // Shuffle the array to randomize the selection

        return shuffledMinterms.slice(0, limit).sort((a, b) => a - b); // Select 'limit' number of unique minterms and sort them in ascending order
    };

    // Helper to generate expected binary inputs for flip-flop columns based on minterms
    const generateExpectedExcitationTable = (uniqueMinterms, numRows) => {
        const expectedTable = {};
        for (let i = 0; i < numRows; i++) {
            // Check if the current row index matches a minterm
            expectedTable[i] = uniqueMinterms.includes(i) ? "1" : "0";  // "1" if present in minterms, otherwise "0"
        }
        return expectedTable;
    };
    
    // Helper to map minterms to correct excitation table rows
    const mapMintermsToRows = (minterms, numStates) => {
      const rows = {};
      for (let i = 0; i < numStates; i++) {
        rows[i] = minterms.includes(i) ? "1" : "0"; // 1 if row index is in minterms, else 0
      }
      return rows;
    };

    // Generate expected excitation table based on minterms
    const generateMinterms = (numInputs, flipFlopType, numFlipFlops) => {
        let maxValue, minMinterms, maxMinterms;
        const expectedExcitationTable = {};
        //const expectedTable = {};
    
        if (numFlipFlops === '2' && numInputs === '1') {
            maxValue = 8;  // 2 flip-flops, 1 input: valid minterms range from 0 to 7
            minMinterms = 2;
            maxMinterms = 4;
        } else {
            maxValue = 16;  // 3 flip-flops or 2 inputs: valid minterms range from 0 to 15
            minMinterms = 2;
            maxMinterms = 8;
        }
    
        const randomMinterms = [];
    
        if (flipFlopType === 'D' || flipFlopType === 'T') {
            for (let i = 1; i <= numFlipFlops; i++) {
                const numMinterms = getRandomNumber(minMinterms, maxMinterms);
                const uniqueMinterms = generateUniqueMinterms(numMinterms, maxValue);

                randomMinterms.push(`${flipFlopType}${i}_input = Σm(${uniqueMinterms.join(', ')})`);
                expectedExcitationTable[`${flipFlopType}${i}`] = mapMintermsToRows(uniqueMinterms, maxValue);

                
            }
        }
    
        if (flipFlopType === 'JK') {
            for (let i = 1; i <= numFlipFlops; i++) {
                const numMintermsJ = getRandomNumber(minMinterms, maxMinterms);
                const numMintermsK = getRandomNumber(minMinterms, maxMinterms);
                const uniqueMintermsJ = generateUniqueMinterms(numMintermsJ, maxValue);
                const uniqueMintermsK = generateUniqueMinterms(numMintermsK, maxValue);
    
                randomMinterms.push(`J${i}_input = Σm(${uniqueMintermsJ.join(', ')})`);
                randomMinterms.push(`K${i}_input = Σm(${uniqueMintermsK.join(', ')})`);
    
                expectedExcitationTable[`J${i}`] = generateExpectedExcitationTable(uniqueMintermsJ, maxValue);
                expectedExcitationTable[`K${i}`] = generateExpectedExcitationTable(uniqueMintermsK, maxValue);
            }
        }
    
        setMinterms(randomMinterms.join(', '));  // Store the generated minterms for display
        setExpectedExcitationTable(expectedExcitationTable);  // Set hidden correct answers

        // Generate Output Z based on Mealy or Moore FSM
        let outputZ = '';
        const numOutputMinterms = getRandomNumber(minMinterms, maxMinterms); // Randomly choose number of output minterms
        if (fsmType === 'Mealy') {
            const uniqueOutputZ = generateUniqueMinterms(numOutputMinterms, maxValue); // Mealy uses more combinations, and sort them
            outputZ = `Z = Σm(${uniqueOutputZ.join(', ')}) based on state & input`;
        } else {
            const uniqueOutputZ = generateUniqueMinterms(numOutputMinterms, maxValue); // Moore uses fewer combinations, and sort them
            outputZ = `Z = Σm(${uniqueOutputZ.join(', ')}) based on state only`;
        }

        setMintermOutputZ(outputZ); // Update the state with generated output Z
    };

    // Dropdown change handlers
    const handleNumInputsChange = (e) => {
        // Handles number of inputs change and flip-flop reset logic
        const newNumInputs = e.target.value;
    
        // If changing to 2 inputs and 3 flip-flops is currently selected, reset the flip-flop selection
        if (newNumInputs === '2' && dropdownState.numFlipFlops === '3') {
            setDropdownState((prevState) => ({
            ...prevState,
                numInputs: newNumInputs,
                numFlipFlops: '', // Reset flip-flop selection
            }));
        } else {
            setDropdownState((prevState) => ({
            ...prevState,
                numInputs: newNumInputs,
            }));
        }
    };

    // Generate button click handler
    const handleGenerate = () => {
        // Reset and set state for excitation and state transition tables, regenerate minterms

        setNumInputs(dropdownState.numInputs);
        setFlipFlopType(dropdownState.flipFlopType);
        setNumFlipFlops(dropdownState.numFlipFlops);
        setFsmType(dropdownState.fsmType);
        
        // Reset the flags to disable the next button
        setIsExcitationTableFilled(false);
        setIsStateTransitionTableFilled(false);
        setIsExcitationTableLocked(false); // Unlock the excitation table
        
        // Clear tables before generating new minterms
        setExcitationTable({});
        setStateTransitionTable({});
        setCellValidation({}); // Reset validation state
        
        setIsGenerated(false); 
    
        // Set the generation process after resetting
        setTimeout(() => {
            setIsGenerated(true); // Activate generation
            generateMinterms(dropdownState.numInputs, dropdownState.flipFlopType, dropdownState.numFlipFlops, dropdownState.fsmType); 
            setSelectedValues({
                inputs: dropdownState.numInputs === '1' ? '1 Input' : '2 Inputs',
                flipFlop: dropdownState.flipFlopType + ' Flip Flop',
                flipFlopsNum: dropdownState.numFlipFlops + ' Flip Flops',
                fsm: dropdownState.fsmType
            });
            console.log("State values updated: ", { numInputs, flipFlopType, numFlipFlops, fsmType }); // Debugging
        }, 0); // Ensuring async state update
    };

    // Excitation Table validation function and enable/disable the Next button
    const validateExcitationTable = (table) => {
        let allFilled = true;
    
        // Calculate the total number of rows and columns expected in the table
        const numStates = Math.pow(2, numFlipFlops);  // Number of state rows
        const numInputCombos = Math.pow(2, numInputs);  // Number of input combinations
    
        // Calculate total expected columns based on flip-flop type
        const numColumns = flipFlopType === 'JK' ? numFlipFlops * 2 : numFlipFlops;
    
        const totalCells = numStates * numInputCombos * numColumns;
    
        let filledCellsCount = 0;  // Counter for correctly filled cells
    
        // Loop through each row in the table
        for (const rowIndex in table) {
            const row = table[rowIndex];
    
            // Check each cell in the row
            for (const colIndex in row) {
                const value = row[colIndex];
                if (value === "0" || value === "1") {
                    filledCellsCount++;
                }
                if (value === "" || value === undefined) {
                  allFilled = false;
              }
            }
        }
    
        // Check if the number of filled cells matches the total number of cells
        allFilled = filledCellsCount === totalCells;
    
        setIsExcitationTableFilled(allFilled);  // Update the state based on whether all cells are filled
    };
        
    // Validate user inputs based on the generated expected table
    const validateUserInputs = (userTable, expectedTable) => {
        const results = [];  // Array to hold validation results
    
        // Compare each cell in userTable to the expectedTable
        for (const rowIndex in userTable) {
            const row = userTable[rowIndex];
    
            // Validate each cell in the row
            for (const colKey in row) {
                const userInput = row[colKey];
                const expectedValue = expectedTable[colKey]?.[rowIndex];  // Get the expected value for the flip-flop input at that row
    
                const isCorrect = userInput === expectedValue;  // Compare user input with correct value
    
                // Push each validation result to the array
                results.push({
                    rowIndex,
                    colKey,
                    isCorrect,
                });
            }
        }
    
        // Update cell validation for incorrect answers
        setCellValidation(results.reduce((acc, { rowIndex, colKey, isCorrect }) => {
            acc[`${rowIndex}-${colKey}`] = isCorrect;  // Update validation for each cell
            return acc;
        }, {}));  // Update the validation state as an object (used for UI)
    
        return results;  // Return an array of results
    };

    // Handle Next button click to validate inputs and transition to the next exercise
    const handleNextButtonClick = () => {
        const validationResults = validateUserInputs(excitationTable, expectedExcitationTable);

        let allCorrect = true;
    
        // Validate each cell in the table
        validationResults.forEach(({ rowIndex, colKey, isCorrect }) => {
          const inputElement = document.getElementById(`input-${rowIndex}-${colKey}`);
          if (isCorrect) {
              inputElement.disabled = true; // Lock correct answers
              inputElement.classList.remove('error-incorrect');
              //lockCorrectCell(rowIndex, colKey);
          } else {
              inputElement.classList.add('error-incorrect'); // Highlight incorrect answers
              //highlightIncorrectCell(rowIndex, colKey);
              allCorrect = false; // Mark as not all correct
          }
        });
    
        // Only proceed if all cells are correct
        if (allCorrect) {
          setIsExcitationTableLocked(true); // Lock Excitation Table
          //expandStateTransitionSection(); // Reveal the next section
          setIsExcitationTableValidated(true); // Mark validation as successful
          setIsStateTransitionTableExpanded(true); // Expand the State Transition Table
        } else {
          console.log("Some answers are incorrect. Please correct them.");
        }
    };
    
    // Excitation Table input change handler
    const handleExcitationInputChange = (rowIndex, colKey, value) => {
        if (value === "0" || value === "1") {
            setExcitationTable((prevTable) => {
                const updatedRow = {
                    ...prevTable[rowIndex],
                    [colKey]: value,  // Update the specific flip-flop input column (J, K, D, T)
                };
                const updatedTable = {
                    ...prevTable,
                    [rowIndex]: updatedRow,
                };
    
                validateExcitationTable(updatedTable);  // Revalidate after input change
                return updatedTable;
            });
        } else if (value === "") {
            // Handle empty input (reset cell)
            setExcitationTable((prevTable) => {
                const updatedRow = {
                    ...prevTable[rowIndex],
                    [colKey]: "",  // Clear the column
                };
                const updatedTable = {
                    ...prevTable,
                    [rowIndex]: updatedRow,
                };
    
                validateExcitationTable(updatedTable);  // Revalidate after clearing input
                return updatedTable;
            });
        } else {
            // Handle invalid input
            const inputElement = document.getElementById(`input-${rowIndex}-${colKey}`);
            if (inputElement) {
                inputElement.classList.add('error-invalid');  // Add shake effect for invalid input
                setTimeout(() => inputElement.classList.remove('error-invalid'), 1000);  // Remove shake effect
            }
        }
    };
    
    // Expand State Transition section
    /*const expandStateTransitionSection = () => {
        setIsStateTransitionTableFilled(false); // Initially not filled
        
        // Expands the state transition section and ensures inputs from excitation table are prefilled
        setIsStateTransitionTableFilled(true);
    };*/
      
    // State Transition Table input change handler
    const handleStateTransitionInputChange = (rowIndex, colIndex, value) => {
        // Handles input changes in the state transition table and validates the inputs
        const validBinary = /^[01]{2,3}$/; // For 2 or 3 binary digits
        if (validBinary.test(value)) {
            setStateTransitionTable((prevTable) => ({
                ...prevTable,
                [`${rowIndex}-${colIndex}`]: value
            }));
        }
    };
    
    // Validate the entire State Transition Table
    const validateStateTransitionTable = () => {
        // Checks if all state transition inputs are valid
        const isFilled = Object.values(stateTransitionTable).every((value) => /^[01]{2,3}$/.test(value));
        setIsStateTransitionTableFilled(isFilled);
    };     

    // Generate the dynamic table header for the current state (Q values) based on flip-flops
    const generateCurrentStateHeader = (numFlipFlops) => {
      return Array.from({ length: numFlipFlops }, (_, i) => `Q${i + 1}`).join(' ');
    };

    // Generate current state (binary Q values) and input combinations (binary X values)
    const generateCurrentStateInputs = (numFlipFlops, numInputs) => {
      const numStates = Math.pow(2, numFlipFlops);
      const numInputCombos = Math.pow(2, numInputs);
      const rows = [];

      for (let i = 0; i < numStates; i++) {
        const currentState = i.toString(2).padStart(numFlipFlops, '0');
        for (let j = 0; j < numInputCombos; j++) {
          const inputs = j.toString(2).padStart(numInputs, '0');
          rows.push({
            currentState: currentState,
            inputs: inputs
          });
        }
      }

      return rows;
    };

    // Render 
    return (
      <div className="circuit-to-state">
        {/* Header */}
        <header>
            <h1>
            Circuit <FontAwesomeIcon icon={faArrowRight} /> State Diagram
            </h1>
        </header>

  
        {/* Dropdown Inputs */}
        <div className="dropdown-container">
          <select value={dropdownState.numInputs} onChange={handleNumInputsChange}>
            <option value="">Select Number of Inputs</option>
            <option value="1">1 Input</option>
            <option value="2">2 Inputs</option>
          </select>
  
          <select value={dropdownState.flipFlopType} onChange={(e) => setDropdownState({ ...dropdownState, flipFlopType: e.target.value })}>
            <option value="">Select Flip-Flop Type</option>
            <option value="D">D Flip-Flop</option>
            <option value="T">T Flip-Flop</option>
            <option value="JK">JK Flip-Flop</option>
          </select>
  
          <select value={dropdownState.numFlipFlops} onChange={(e) => setDropdownState({ ...dropdownState, numFlipFlops: e.target.value })} disabled={!dropdownState.numInputs}>
            <option value="">Select Number of Flip-Flops</option>
            <option value="2">2 Flip-Flops</option>
            <option value="3" disabled={dropdownState.numInputs === '2'}>3 Flip-Flops</option> {/* Visible but disabled for 2 inputs */}
          </select>
  
          <select value={dropdownState.fsmType} onChange={(e) => setDropdownState({ ...dropdownState, fsmType: e.target.value })}>
            <option value="">Select FSM Type</option>
            <option value="Mealy">Mealy</option>
            <option value="Moore">Moore</option>
          </select>
          {/* Generate Button */}
          <button
            className={`generate-btn ${isFormComplete ? '' : 'disabled'}`}
            onClick={handleGenerate}
            disabled={!isFormComplete}
          >
            Generate
          </button>
        </div>
  
        {/* Always render the canvas, but leave it empty until "Generate" is clicked */}
        <CircuitDiagram 
            minterms={minterms} 
            mintermOutputZ={mintermOutputZ} 
            numInputs={numInputs} 
            flipFlopType={flipFlopType} 
            numFlipFlops={numFlipFlops} 
            fsmType={fsmType}
            isGenerated={isGenerated}
        />

        {/* Display selected values in the bottom bar */}
        {isGenerated && (
            <div className="selection-bar">
              <span>{selectedValues.inputs}</span>
              <span>{selectedValues.flipFlop}</span>
              <span>{selectedValues.flipFlopsNum}</span>
              <span>{selectedValues.fsm}</span>
            </div>
          )}

          
  
  
        {/* Excitation Table Section */}
        <div className={`table-container excitation ${isGenerated ? 'expanded' : ''}`}>
          <h2>Excitation Table</h2>
          {isGenerated && (
            <p className="instruction">Complete the Excitation Table with only "0" and "1" values.</p>
          )}
          {!isGenerated ? (
            <div className="placeholder">Exercise 1</div>
          ) : (
            <table className="excitation-table">
              <thead>
                <tr>
                  {/* Table headers based on flip-flop type and inputs */}
                  {/* Dynamically generate the Current State header */}
                  <th style={{ width: '15%' }}>Current State <br />({generateCurrentStateHeader(numFlipFlops)})</th>
                  {numInputs === '2' && <th style={{ width: '15%' }}>Inputs <br />(X1, X2)</th>}
                  {numInputs === '1' && <th style={{ width: '15%' }}>Input <br />(X1)</th>}

                  {/* Generate J and K columns for JK flip-flop */}
                  {flipFlopType === 'JK' &&
                    Array.from({ length: numFlipFlops }, (_, i) => (
                        <React.Fragment key={i}>
                         <th key={`J${i}`}>{`J${i + 1}`}</th>
                         <th key={`K${i}`}>{`K${i + 1}`}</th>
                        </React.Fragment>
                    ))}

                  {/* For D and T flip-flop types, only show a single column */}
                  {flipFlopType !== 'JK' &&
                    Array.from({ length: numFlipFlops }, (_, i) => (
                      <th key={i}>{flipFlopType}{i + 1}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {/* Generate pre-filled rows for current state and inputs */}
                {generateCurrentStateInputs(numFlipFlops, numInputs).map((row, index) => (
                  <tr key={index}>
                    <td>{row.currentState}</td>
                    <td>{row.inputs}</td>
                    {/* Dynamically generate flip-flop inputs */}
                    {flipFlopType === 'JK' &&
                      Array.from({ length: numFlipFlops }, (_, i) => (
                        <React.Fragment key={i}>
                          <td key={`J${i}`}>
                            <input
                                id={`input-${index}-J${i}`} // Add unique id for J input
                                type="text" 
                                placeholder={`J${i + 1}`} 
                                onChange={(e) => handleExcitationInputChange(index, `J${i}`, e.target.value)} 
                                value={excitationTable[`${index}-J${i}`] || ""}
                                disabled={isExcitationTableLocked} // Disable input if locked
                            />
                          </td>
                          <td key={`K${i}`}>
                            <input
                                id={`input-${index}-K${i}`} // Add unique id for K input
                                type="text" 
                                placeholder={`K${i + 1}`} 
                                onChange={(e) => handleExcitationInputChange(index, `K${i}`, e.target.value)} 
                                value={excitationTable[`${index}-K${i}`] || ""}
                                disabled={isExcitationTableLocked} // Disable input if locked
                            />
                          </td>
                        </React.Fragment>
                      ))
                    }
                    {/* For D and T flip-flop types, only show a single column */}  
                    {flipFlopType !== 'JK' &&
                      Array.from({ length: numFlipFlops }, (_, i) => (
                        <td key={i}>
                            <input 
                                id={`input-${index}-${i}`} 
                                type="text" 
                                placeholder={`${flipFlopType}${i + 1}`} 
                                onChange={(e) => handleExcitationInputChange(index, i, e.target.value)} 
                                value={excitationTable[index]?.[i] || ""}  // Reflect the current state value
                                disabled={isExcitationTableLocked || cellValidation[`${index}-${i}`] === true}  // Disable correct cells
                                className={cellValidation[`${index}-${i}`] === false ? 'error-incorrect' : ''}  // Highlight incorrect cells
                            />
                        </td>
                      ))
                    }
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {isGenerated && (
            <button 
                className={`generate-btn ${isExcitationTableFilled ? '' : 'disabled'}`} 
                onClick={handleNextButtonClick} 
                disabled={!isExcitationTableFilled} // Disable button when table is not complete
            >
              Next
            </button>
          )}
        </div>
  
        {/* State Transition Table Section */}
        <div className={`table-container stateTransition ${isStateTransitionTableExpanded ? 'expanded' : ''}`}>
          <h2>State Transition Table</h2>
          {isStateTransitionTableExpanded && (
            <p className="instruction">Complete the State Transition Table with only "0" and "1" values.</p>
          )}
          {!isStateTransitionTableExpanded ? (
            <div className="placeholder">Exercise 2</div>
          ) : (
            <table className="transition-table">
              <thead>
                <tr>
                  <th>Current State ({generateCurrentStateHeader(numFlipFlops)})</th>
                  {numInputs === '2' && <th>Inputs (X1, X2)</th>}
                  {numInputs === '1' && <th>Input (X1)</th>}
                  {/* Prefilled Flip-Flop inputs */}
                  {flipFlopType === 'JK' &&
                    Array.from({ length: numFlipFlops }, (_, i) => (
                        <React.Fragment key={i}>
                            <th key={`J${i}`}>{`J${numFlipFlops - i - 1}`}</th>
                            <th key={`K${i}`}>{`K${numFlipFlops - i - 1}`}</th>
                        </React.Fragment>
                    ))}
                  {flipFlopType !== 'JK' &&
                    Array.from({ length: numFlipFlops }, (_, i) => (
                      <th key={i}>{flipFlopType}{numFlipFlops - i - 1}</th>
                    ))}
                  <th>Next State</th>
                  <th>Output Z</th>
                </tr>
              </thead>
              <tbody>
                {generateCurrentStateInputs(numFlipFlops, numInputs).map((row, index) => (
                  <tr key={index}>
                    <td>{row.currentState}</td>
                    <td>{row.inputs}</td>
                    {/* Flip-Flop inputs */}
                    {flipFlopType === 'JK' &&
                      Array.from({ length: numFlipFlops }, (_, i) => (
                        <React.Fragment key={i}>
                          <td key={`J${i}`}><input type="text" value={excitationTable[`${index}-J${i}`]} readOnly /></td>
                          <td key={`K${i}`}><input type="text" value={excitationTable[`${index}-K${i}`]} readOnly /></td>
                        </React.Fragment>
                      ))}
                    {flipFlopType !== 'JK' &&
                      Array.from({ length: numFlipFlops }, (_, i) => (
                        <td key={i}><input type="text" value={excitationTable[`${index}-${i}`]} readOnly /></td>
                      ))}
                    <td><input type="text" onChange={(e) => handleStateTransitionInputChange(index, 'nextState', e.target.value)} /></td>
                    <td><input type="text" onChange={(e) => handleStateTransitionInputChange(index, 'outputZ', e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {isStateTransitionTableExpanded && (
            <button 
                className={`generate-btn ${isStateTransitionTableFilled ? '' : 'disabled'}`} 
                onClick={validateStateTransitionTable} 
                disabled={!isStateTransitionTableFilled}>
              Next
            </button>
          )}
        </div>
  
        {/* State Diagram Section */}
        <div className={`table-container ${isGenerated ? 'expanded' : ''}`}>
          <h2>State Diagram</h2>
          {!isGenerated ? (
            <div className="placeholder">State Diagram</div>
          ) : (
            <div className="state-diagram">
              {/* State diagram content will go here later */}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  export default CircuitToState;


