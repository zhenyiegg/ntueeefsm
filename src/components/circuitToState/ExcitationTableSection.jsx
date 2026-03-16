import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo, faDownload } from "@fortawesome/free-solid-svg-icons";

const ExcitationTableSection = ({
  showExcitationTable,
  showExcitationInfo,
  excitationTable,
  userExcitationInputs,
  isDownloadExcitationEnabled,
  isExcitationTableComplete,
  isNextExcitationButtonEnabled,
  isExcitationGivenUp,
  excitationAttemptCount,
  excitationHeaders,
  onToggleInfo,
  onExport,
  onInputChange,
  onValidate,
  onGiveUp,
}) => {
  return (
    <div
      className={`content-box excitation-box ${
        showExcitationTable ? "active" : ""
      }`}
    >
      <div className="content-header">
        <div className="left-header">
          <h2 className="content-title">Excitation Table</h2>
          {showExcitationTable && (
            <button type="button" className="info-icon" onClick={onToggleInfo}>
              <FontAwesomeIcon icon={faCircleInfo} />
            </button>
          )}
        </div>

        {excitationTable.length > 0 && showExcitationTable && (
          <button
            type="button"
            className={`export-btn ${
              isDownloadExcitationEnabled ? "active" : "disabled"
            }`}
            disabled={!isDownloadExcitationEnabled}
            onClick={onExport}
            title="Download Excitation Table CSV"
            aria-label="Download Excitation Table CSV"
          >
            <FontAwesomeIcon icon={faDownload} />
          </button>
        )}
      </div>

      {showExcitationInfo && (
        <div className="info-tooltip-cts">
          <p>
            Determine the <strong>flip-flop inputs</strong> based on the logic
            equations. Fill in each flip-flop input with a single-bit binary{" "}
            <strong>0</strong> or <strong>1</strong>.
            <br />
            <br />
            All fields must be correct to proceed. You may give up after two
            incorrect attempts.
          </p>
        </div>
      )}

      {excitationTable.length > 0 && showExcitationTable && (
        <div>
          <div className="table-container">
            <table border="1">
              <thead>
                <tr>
                  {excitationHeaders.map((header, index) => (
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
                            onFocus={(e) => {
                              e.target.focus({ preventScroll: true });
                              e.target.select();
                            }}
                            onChange={(e) =>
                              onInputChange(rowIndex, flipFlop, e.target.value)
                            }
                            disabled={
                              status === "correct" || status === "given-up"
                            }
                            className={
                              status === "given-up"
                                ? "input-givenup"
                                : status === "correct"
                                  ? "input-correct"
                                  : status === "incorrect"
                                    ? "input-incorrect"
                                    : "input-default"
                            }
                          />
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="content-btn-group">
            {!isExcitationTableComplete && (
              <>
                <button
                  type="button"
                  className={`next-btn ${
                    isNextExcitationButtonEnabled ? "active" : "disabled"
                  }`}
                  disabled={!isNextExcitationButtonEnabled}
                  onClick={onValidate}
                >
                  Next
                </button>

                {!isExcitationGivenUp && (
                  <button
                    type="button"
                    className={`giveup-btn ${
                      excitationAttemptCount >= 2 ? "active" : "disabled"
                    }`}
                    disabled={excitationAttemptCount < 2}
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

export default ExcitationTableSection;
