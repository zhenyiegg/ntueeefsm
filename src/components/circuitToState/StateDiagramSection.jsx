import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo, faDownload } from "@fortawesome/free-solid-svg-icons";
import CTSConversion from "./CTSConversion";

const StateDiagramSection = ({
  showStateDiagram,
  showStateDiagramInfo,
  stateTransitionTable,
  generateState,
  onToggleInfo,
  onExport,
}) => {
  return (
    <div
      className={`content-box stateDiagram-box ${
        showStateDiagram ? "active" : ""
      }`}
    >
      <div className="content-header">
        <div className="left-header">
          <h2 className="content-title">State Diagram</h2>
          {showStateDiagram && (
            <button type="button" className="info-icon" onClick={onToggleInfo}>
              <FontAwesomeIcon icon={faCircleInfo} />
            </button>
          )}
        </div>

        {showStateDiagramInfo && (
          <div className="info-tooltip-cts">
            <p>
              Hover or click the transition arrows to view the state transition
              details.
            </p>
          </div>
        )}

        {showStateDiagram && stateTransitionTable.length > 0 && (
          <button
            type="button"
            className="export-btn"
            onClick={onExport}
            title="Download State Diagram PNG"
            aria-label="Download State Diagram PNG"
          >
            <FontAwesomeIcon icon={faDownload} />
          </button>
        )}
      </div>

      <div className="state-container">
        {showStateDiagram && stateTransitionTable.length > 0 && (
          <CTSConversion
            stateTransitionTable={stateTransitionTable}
            fsmType={generateState.fsmType}
            numFlipFlops={parseInt(generateState.numFlipFlops, 10)}
            numInputs={parseInt(generateState.numInputs, 10)}
          />
        )}
      </div>
    </div>
  );
};

export default StateDiagramSection;
