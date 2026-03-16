const ControlPanel = ({
  dropdownState,
  isFormComplete,
  isCustomEquationChecked,
  onDropdownChange,
  onCustomEquationCheckboxChange,
  onGenerate,
  onAutoGenerate,
}) => {
  return (
    <div className="dropdown-container">
      <select
        value={dropdownState.numInputs}
        onChange={(e) => onDropdownChange("numInputs", e.target.value)}
      >
        <option value="">Number of Inputs</option>
        <option value="1">1 Input X0</option>
        <option value="2">2 Inputs X1, X0</option>
      </select>

      <select
        value={dropdownState.flipFlopType}
        onChange={(e) => onDropdownChange("flipFlopType", e.target.value)}
      >
        <option value="">Flip-Flop Type</option>
        <option value="D">D Flip-Flop</option>
        <option value="T">T Flip-Flop</option>
        <option value="JK">JK Flip-Flop</option>
      </select>

      <select
        value={dropdownState.numFlipFlops}
        onChange={(e) => onDropdownChange("numFlipFlops", e.target.value)}
      >
        <option value="">Number of Flip-Flops</option>
        <option value="2">2 Flip-Flops</option>
        <option value="3" disabled={dropdownState.numInputs === "2"}>
          3 Flip-Flops
        </option>
      </select>

      <select
        value={dropdownState.fsmType}
        onChange={(e) => onDropdownChange("fsmType", e.target.value)}
      >
        <option value="">FSM Type</option>
        <option value="Mealy">Mealy</option>
        <option value="Moore">Moore</option>
      </select>

      <select
        value={dropdownState.preFillOption}
        onChange={(e) => onDropdownChange("preFillOption", e.target.value)}
      >
        <option value="">Difficulty</option>
        <option value="random75">Easy</option>
        <option value="random50">Medium</option>
        <option value="random25">Hard</option>
        <option value="none">Expert</option>
      </select>

      <div className="dropdown-btn-group">
        <div className="checkbox-container">
          <input
            type="checkbox"
            id="customEquationCheckbox"
            checked={isCustomEquationChecked}
            onChange={onCustomEquationCheckboxChange}
          />
          <label htmlFor="customEquationCheckbox" className="custom-label">
            Custom Equation
          </label>
        </div>

        <button
          type="button"
          className={`generate-btn ${isFormComplete ? "" : "disabled"}`}
          onClick={onGenerate}
          disabled={!isFormComplete}
          title="Regenerate equations"
        >
          Generate
        </button>

        <button
          type="button"
          className="auto-generate-btn"
          onClick={onAutoGenerate}
          title="Randomise selections"
        >
          Auto Generate
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
