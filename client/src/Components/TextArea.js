import React, { useState, useRef, useEffect } from "react";

function AutoResizingTextarea(props) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    textarea.style.height = "auto"; // Reset the height to auto to calculate the correct scrollHeight
    const maxHeight =
      textarea.scrollHeight > 100 ? "100px" : `${textarea.scrollHeight}px`;
    textarea.style.height = maxHeight; // Set the height to either maxHeight or the calculated scrollHeight
  }, [message]);

  return (
    <textarea
      ref={textareaRef}
      id="messageTextarea"
      rows={1}
      className="min-w-full outline-none px-2 py-1 rounded-lg text-sm max-h-[100px] resize-none"
      value={message}
      onChange={(event) => setMessage(event.target.value)}
      style={{ overflowY: "hidden" }} // Hide scrollbar
    />
  );
}

export default AutoResizingTextarea;
