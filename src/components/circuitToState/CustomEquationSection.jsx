import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";

const CustomEquationSection = ({
  isUsingCustomEquation,
  customEquationValidated,
  showCustomEqnInfo,
  customEquations,
  onToggleInfo,
  onEquationTypeChange,
  onEquationTermsChange,
  onValidate,
}) => {
  if (!isUsingCustomEquation || customEquationValidated) return null;

  return (
    <div className="content-box">
      <div className="customEqn-header">
        <div className="customEqn-title-wrapper">
          <h2 className="customEqn-title">Custom Equation</h2>
          <button type="button" className="info-icon" onClick={onToggleInfo}>
            <FontAwesomeIcon icon={faCircleInfo} />
          </button>
        </div>
      </div>

      {showCustomEqnInfo && (
        <div className="customEqn-tooltip">
          <p>
            <b>Number Ranges:</b>
          </p>
          <ul>
            <li>
              <b>1 input & 2 or 3 F/F:</b> Enter values between <b>0-7</b>.
            </li>
            <li>
              <b>2 inputs & 2 F/F:</b> Enter values between <b>0-15</b>.
            </li>
          </ul>
          <p>
            <b>Moore FSM:</b> Output Z depends only on the current state, not
            input X.
          </p>
          <ul>
            <li>
              <b>2 F/F:</b> Enter values between <b>0-3</b>.
            </li>
            <li>
              <b>3 F/F:</b> Enter values between <b>0-7</b>.
            </li>
          </ul>
        </div>
      )}

      <p className="customEqn-subtitle">
        Select minterms (Σm) or maxterms (<span className="maxterm">Π</span>M){" "}
        and enter terms separated by commas.
      </p>

      {customEquations.map((eq, index) => (
        <div key={index} className="custom-equation">
          <strong>{eq.formattedEquation} = </strong>
          <select
            className="custom-select"
            value={eq.type}
            onChange={(e) => onEquationTypeChange(index, e.target.value)}
          >
            <option value="Σ">Σm</option>
            <option value="Π">ΠM</option>
          </select>

          <div className="custom-input">
            (
            <input
              type="text"
              value={eq.terms}
              onChange={(e) => onEquationTermsChange(index, e.target.value)}
            />
            )
          </div>
        </div>
      ))}

      <button type="button" className="ok-btn" onClick={onValidate}>
        OK
      </button>
    </div>
  );
};

export default CustomEquationSection;
