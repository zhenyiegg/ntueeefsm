import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo, faDownload } from "@fortawesome/free-solid-svg-icons";

const StateTransitionTableSection = ({
  showStateTransitionTable,
  showStateTransitionInfo,
  stateTransitionTable,
  userStateTransitionInputs,
  isDownloadStateTransitionEnabled,
  isStateTransitionTableComplete,
  isGenerateStateDiagramButtonEnabled,
  isStateTransitionGivenUp,
  stateTransitionAttemptCount,
  stateTransitionHeaders,
  onToggleInfo,
  onExport,
  onInputChange,
  onValidate,
  onGiveUp,
}) => {
  return (
    <div className={`content-box ${showStateTransitionTable ? "active" : ""}`}>
      <div className="content-header">
        <div className="left-header">
          <h2 className="content-title">State Transition Table</h2>
          {showStateTransitionTable && (
            <button type="button" className="info-icon" onClick={onToggleInfo}>
              <FontAwesomeIcon icon={faCircleInfo} />
            </button>
          )}
        </div>

        {stateTransitionTable.length > 0 && showStateTransitionTable && (
          <button
            type="button"
            className={`export-btn ${
              isDownloadStateTransitionEnabled ? "active" : "disabled"
            }`}
            disabled={!isDownloadStateTransitionEnabled}
            onClick={onExport}
            title="Download State Transition Table CSV"
            aria-label="Download State Transition Table CSV"
          >
            <FontAwesomeIcon icon={faDownload} />
          </button>
        )}
      </div>

      {showStateTransitionInfo && (
        <div className="info-tooltip-cts">
          <p>
            Determine the <strong>Next State</strong> based on the flip-flop
            inputs in the excitation table. Then, compute the{" "}
            <strong>Output Z</strong> using the logic equations. Fill in the
            Next State and Output Z values with binary <strong>0</strong> or{" "}
            <strong>1</strong>.
            <br />
            <br />
            All fields must be correct to proceed. You may give up after two
            incorrect attempts.
          </p>
        </div>
      )}

      {showStateTransitionTable && stateTransitionTable.length > 0 && (
        <div>
          <table border="1">
            <thead>
              <tr>
                {stateTransitionHeaders.map((header, index) => (
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
                          e.target.focus({ preventScroll: true });
                          e.target.select();
                        }}
                        onChange={(e) =>
                          row.nextState.editable &&
                          onInputChange(rowIndex, "nextState", e.target.value)
                        }
                        disabled={!row.nextState.editable}
                        className={
                          row.nextState.status === "given-up"
                            ? "input-givenup"
                            : row.nextState.status === "correct"
                              ? "input-correct"
                              : row.nextState.status === "incorrect"
                                ? "input-incorrect"
                                : "input-default"
                        }
                      />

                      {row.nextState.focusTooltip && (
                        <span className="tooltip-focus">
                          {row.nextState.focusTooltip}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="outputZ-column">
                    <input
                      type="text"
                      value={row.output.value}
                      onFocus={(e) => {
                        e.target.focus({ preventScroll: true });
                        e.target.select();
                      }}
                      onChange={(e) =>
                        row.output.editable &&
                        onInputChange(rowIndex, "output", e.target.value)
                      }
                      disabled={!row.output.editable}
                      className={
                        row.output.status === "correct"
                          ? "input-correct"
                          : row.output.status === "incorrect"
                            ? "input-incorrect"
                            : row.output.status === "given-up"
                              ? "input-givenup"
                              : "input-default"
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="content-btn-group">
            {!isStateTransitionTableComplete && (
              <>
                <button
                  type="button"
                  className={`next-btn ${
                    isGenerateStateDiagramButtonEnabled ? "active" : "disabled"
                  }`}
                  disabled={!isGenerateStateDiagramButtonEnabled}
                  onClick={onValidate}
                >
                  Generate State Diagram
                </button>

                {!isStateTransitionGivenUp && (
                  <button
                    type="button"
                    className={`giveup-btn ${
                      stateTransitionAttemptCount >= 2 ? "active" : "disabled"
                    }`}
                    disabled={stateTransitionAttemptCount < 2}
                    onClick={onGiveUp}
                  >
                    Give Up
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StateTransitionTableSection;
