const ValidationPopup = ({
  showValidationPopup,
  validationMessage,
  popupRef,
  onClose,
}) => {
  if (!showValidationPopup) return null;

  return (
    <div className="error-popup-overlay" tabIndex={0} onClick={onClose}>
      <div
        className="error-popup-content"
        ref={popupRef}
        onClick={(e) => e.stopPropagation()}
      >
        <p>{validationMessage}</p>
      </div>
    </div>
  );
};

export default ValidationPopup;
