"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface ChatInputBarProps {
  onSend: (text: string) => void;
}

export default function ChatInputBar({ onSend }: ChatInputBarProps) {
  const [inputText, setInputText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSend(inputText.trim());
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="bg-base-200 p-4 border-base-300 border-t shrink-0">
      <div className="relative w-full">
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Digite sua mensagem..."
          className={`pr-14 hover:border-base-400 focus:border-base-400 rounded-2xl focus:outline-none focus:ring-0 w-full min-h-20 max-h-40 overflow-y-hidden resize-none textarea textarea-bordered`}
          value={inputText}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <button
          className="top-8 right-3 absolute -translate-y-1/2 btn btn-circle btn-primary btn-sm"
          onClick={handleSend}
          disabled={!inputText.trim()}
        >
          <Send className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
