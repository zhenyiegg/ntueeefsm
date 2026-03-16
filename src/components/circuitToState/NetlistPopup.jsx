const NetlistPopup = ({
  showNetlistPopup,
  netlistPopupContent,
  fetchImagesCompleted,
  netlistImages,
  netlistEquations,
  onClose,
}) => {
  if (!showNetlistPopup) return null;

  return (
    <div className="popup-overlay-netlist" onClick={onClose}>
      <div className="popup-box-netlist" onClick={(e) => e.stopPropagation()}>
        <h3>Schematic Logic Circuit</h3>

        {fetchImagesCompleted &&
          netlistImages.some((img) => img.image === null) && (
            <p style={{ color: "#b45309", marginBottom: "0.75rem" }}>
              Unable to generate the schematic logic circuit images. The
              netlists are shown below instead.
            </p>
          )}

        {netlistPopupContent.length === 0 ? (
          <div className="netlist-spinner-container">
            <div className="netlist-spinner" />
          </div>
        ) : (
          netlistPopupContent.map(({ label, image }) => (
            <div key={label} style={{ marginBottom: "1rem" }}>
              <p>
                <strong>{label}</strong> - {image ? "Circuit" : "Netlist"}
              </p>

              {image ? (
                <img
                  src={image}
                  alt={`Netlist for ${label}`}
                  style={{ maxWidth: "100%", height: "auto" }}
                />
              ) : (
                <pre
                  style={{
                    whiteSpace: "pre-wrap", // preserves indents & line breaks
                    background: "#f4f4f4",
                    padding: "0.5rem",
                    borderRadius: "4px",
                    textAlign: "left",
                    overflowX: "auto",
                    fontFamily: "monospace",
                  }}
                >
                  {JSON.stringify(
                    netlistEquations.find((e) => e.label === label)?.netlist,
                    null,
                    2,
                  )}
                </pre>
              )}
            </div>
          ))
        )}

        <button type="button" className="close-netlist-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default NetlistPopup;
