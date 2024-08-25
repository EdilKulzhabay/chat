import React, { useRef } from "react";

function AutoResizingTextarea({ message, setMessage }) {
  const textareaRef = useRef(null);

  const handleInputChange = (event) => {
    setMessage(event.target.value);

    const textarea = textareaRef.current;
    textarea.style.height = "auto"; // Reset the height to auto
    const maxHeight = 4 * 24; // Assuming each row is approximately 24px tall
    const newHeight =
      textarea.scrollHeight > maxHeight ? maxHeight : textarea.scrollHeight;
    textarea.style.height = `${newHeight}px`;
  };

  return (
    <textarea
      ref={textareaRef}
      id="messageTextarea"
      rows={1}
      className="min-w-full outline-none px-2 py-1 rounded-lg text-sm resize-none"
      value={message}
      onChange={handleInputChange}
      style={{ overflowY: "scroll" }}
    />
  );
}

export default AutoResizingTextarea;
