const EquationDisplay = ({
  customEquationValidated,
  isGenerated,
  customEquations,
  logicEquation,
  onShowBooleanPopup,
}) => {
  if (!customEquationValidated && !isGenerated) return null;

  if (customEquationValidated) {
    return (
      <div className={`equation-section ${isGenerated ? "active" : ""}`}>
        <p>
          {customEquations.map(({ formattedEquation, terms, type }) => (
            <span key={formattedEquation} className="equation-item">
              <strong>{formattedEquation}&nbsp;=&nbsp;</strong>
              {type === "Σ" ? (
                <span>Σm</span>
              ) : (
                <span>
                  <span
                    style={{
                      fontFamily: "Times New Roman",
                      fontSize: "1.15em",
                    }}
                  >
                    Π
                  </span>
                  M
                </span>
              )}
              ({terms})
            </span>
          ))}
        </p>

        <button
          type="button"
          className="boolean-btn"
          onClick={onShowBooleanPopup}
        >
          Boolean
        </button>
      </div>
    );
  }

  return (
    <div className={`equation-section ${isGenerated ? "active" : ""}`}>
      <p>
        {logicEquation.map(({ equation, formattedTerms }) => (
          <span key={equation} className="equation-item">
            <strong>{equation}&nbsp;=&nbsp;</strong>
            {formattedTerms}
          </span>
        ))}
      </p>

      <button
        type="button"
        className="boolean-btn"
        onClick={onShowBooleanPopup}
      >
        Boolean
      </button>
    </div>
  );
};

export default EquationDisplay;
