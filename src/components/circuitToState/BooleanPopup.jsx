const BooleanPopup = ({ showBooleanPopup, booleanEquations, onClose }) => {
  if (!showBooleanPopup) return null;

  return (
    <div className="boolean-popup-overlay" onClick={onClose} tabIndex={0}>
      <div
        className="boolean-popup-content"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <h3>Boolean Expressions</h3>
        {booleanEquations.map(({ label, expression }, index) => (
          <p key={index}>
            <strong>{label}</strong> = {expression}
          </p>
        ))}
      </div>
    </div>
  );
};

export default BooleanPopup;
