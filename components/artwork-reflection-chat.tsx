"use client";

import { createPortal } from "react-dom";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

type ArtworkReflectionChatProps = {
  question: string;
  artworkTitle: string;
  artistName?: string | null;
  artworkId: string;
};

const MAX_INPUT_CHARS = 600;
const MAX_HISTORY_TOKENS = 1500;
const MAX_STORED_MESSAGES = 50;

function approximateTokens(text: string) {
  return Math.ceil(text.length / 4);
}

function trimMessagesToTokenLimit(messages: ChatMessage[], maxTokens: number) {
  let totalTokens = 0;
  const trimmed: ChatMessage[] = [];
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    const tokenCount = approximateTokens(message.text);
    if (totalTokens + tokenCount > maxTokens && trimmed.length > 0) {
      break;
    }
    totalTokens += tokenCount;
    trimmed.push(message);
  }
  return trimmed.reverse();
}

function DotLoader() {
  return (
    <div className="flex items-center gap-[6px]">
      <span className="dot-loader" />
      <span className="dot-loader dot-loader--delay-1" />
      <span className="dot-loader dot-loader--delay-2" />
    </div>
  );
}

function renderInlineMarkdown(text: string) {
  const segments = text.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  let key = 0;
  return segments.map((segment) => {
    if (!segment) {
      return null;
    }
    if (segment.startsWith("***") && segment.endsWith("***")) {
      const content = segment.slice(3, -3);
      return (
        <strong key={`bolditalic-${key++}`}>
          <em>{content}</em>
        </strong>
      );
    }
    if (segment.startsWith("**") && segment.endsWith("**")) {
      const content = segment.slice(2, -2);
      return <strong key={`bold-${key++}`}>{content}</strong>;
    }
    if (segment.startsWith("*") && segment.endsWith("*")) {
      const content = segment.slice(1, -1);
      return <em key={`italic-${key++}`}>{content}</em>;
    }
    const cleaned = segment.replace(/(?<=\w)\*{1,3}|\*{1,3}(?=\w)/g, "");
    return <span key={`text-${key++}`}>{cleaned}</span>;
  });
}

function renderMarkdown(text: string, className: string) {
  const paragraphs = text.split(/\n{2,}/);
  return paragraphs.map((paragraph, index) => {
    const lines = paragraph.split("\n");
    const lineNodes: ReactNode[] = [];
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) {
        lineNodes.push(<br key={`br-${index}-${lineIndex}`} />);
      }
      lineNodes.push(
        <span key={`line-${index}-${lineIndex}`}>{renderInlineMarkdown(line)}</span>,
      );
    });
    return (
      <p key={`para-${index}`} className={className}>
        {lineNodes}
      </p>
    );
  });
}

export function ArtworkReflectionChat({
  question,
  artworkTitle,
  artistName,
  artworkId,
}: ArtworkReflectionChatProps) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [focusLatest, setFocusLatest] = useState(false);
  const latestMessagesRef = useRef<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const pendingExitFocusRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.getElementById("app-viewport"));
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const id = requestAnimationFrame(() => setIsActive(true));
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  useEffect(() => {
    latestMessagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!isOpen || focusLatest) {
      return;
    }
    const container = scrollRef.current;
    if (!container || !shouldAutoScrollRef.current) {
      return;
    }
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [isOpen, focusLatest, messages, isThinking]);

  useLayoutEffect(() => {
    if (!focusLatest) {
      return;
    }
    const container = scrollRef.current;
    if (!container) {
      return;
    }
    container.scrollTop = container.scrollHeight;
  }, [focusLatest, messages, isThinking]);

  useEffect(() => {
    if (focusLatest || !pendingExitFocusRef.current) {
      return;
    }
    pendingExitFocusRef.current = false;
    const container = scrollRef.current;
    if (!container) {
      return;
    }
    container.scrollTo({ top: container.scrollHeight });
  }, [focusLatest]);

  useEffect(() => {
    if (!artworkId || typeof window === "undefined") {
      return;
    }
    try {
      const raw = window.localStorage.getItem(`artwork-chat:${artworkId}`);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setMessages(parsed as ChatMessage[]);
      }
    } catch {
      // ignore cache errors
    }
  }, [artworkId]);

  const saveMessages = (nextMessages: ChatMessage[]) => {
    if (typeof window === "undefined") {
      return;
    }
    const capped = nextMessages.slice(-MAX_STORED_MESSAGES);
    try {
      window.localStorage.setItem(
        `artwork-chat:${artworkId}`,
        JSON.stringify(capped),
      );
    } catch {
      // ignore cache errors
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsActive(false);
    window.setTimeout(() => setIsOpen(false), 260);
  };

  const title = useMemo(() => {
    if (artistName) {
      return `${artworkTitle} by ${artistName}`;
    }
    return artworkTitle;
  }, [artworkTitle, artistName]);

  const handleInputChange = (value: string) => {
    const next = value.slice(0, MAX_INPUT_CHARS);
    setInputValue(next);
  };

  const appendToAssistant = (assistantId: string, delta: string) => {
    setMessages((prev) => {
      const next = prev.map((message) =>
        message.id === assistantId
          ? { ...message, text: message.text + delta }
          : message,
      );
      saveMessages(next);
      return next;
    });
  };

  const finalizeStream = () => {
    setIsThinking(false);
  };

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }
    if (focusLatest) {
      return;
    }
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 80;
  };

  const handleExitFocus = () => {
    if (!focusLatest) {
      return;
    }
    pendingExitFocusRef.current = true;
    setFocusLatest(false);
    shouldAutoScrollRef.current = false;
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!focusLatest) {
      return;
    }
    if (event.deltaY > 6) {
      handleExitFocus();
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!focusLatest) {
      return;
    }
    const startY = touchStartYRef.current;
    const currentY = event.touches[0]?.clientY;
    if (startY == null || currentY == null) {
      return;
    }
    if (startY - currentY > 6) {
      handleExitFocus();
      touchStartYRef.current = null;
    }
  };

  const handleSend = async (overrideText?: string) => {
    if (isThinking) {
      return;
    }
    const trimmed = (overrideText ?? inputValue).trim();
    if (!trimmed) {
      return;
    }
    const timestamp = Date.now();
    const userMessage: ChatMessage = {
      id: `user-${timestamp}`,
      role: "user",
      text: trimmed,
    };
    const assistantMessage: ChatMessage = {
      id: `assistant-${timestamp}`,
      role: "assistant",
      text: "",
    };
    setInputValue("");
    setIsThinking(true);
    setFocusLatest(false);
    setMessages((prev) => {
      const next = [...prev, userMessage, assistantMessage];
      saveMessages(next);
      return next;
    });

    const sendHistory = trimMessagesToTokenLimit(
      [...latestMessagesRef.current, userMessage],
      MAX_HISTORY_TOKENS,
    ).map((message) => ({
      role: message.role,
      content: message.text,
    }));

    let receivedDelta = false;
    let hadError = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, 20000);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          artworkId,
          artworkTitle,
          artworkName: artistName ?? "",
          artistName: artistName ?? "",
          messages: sendHistory,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Streaming failed.");
      }

      if (!response.body) {
        throw new Error("Streaming failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        buffer = buffer.replace(/\r\n/g, "\n");
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) {
            continue;
          }
          const payload = line.replace("data:", "").trim();
          if (!payload) {
            continue;
          }
          if (payload === "[DONE]") {
            finalizeStream();
            return;
          }
          const parsed = JSON.parse(payload) as { delta?: string; error?: string };
            if (parsed.error) {
              throw new Error(parsed.error);
            }
          if (parsed.delta) {
            receivedDelta = true;
            appendToAssistant(assistantMessage.id, parsed.delta);
          }
        }
      }
      if (buffer.trim()) {
        const payload = buffer.replace("data:", "").trim();
        if (payload && payload !== "[DONE]") {
          const parsed = JSON.parse(payload) as { delta?: string; error?: string };
          if (parsed.error) {
            throw new Error(parsed.error);
          }
          if (parsed.delta) {
            receivedDelta = true;
            appendToAssistant(assistantMessage.id, parsed.delta);
          }
        }
      }
    } catch (error) {
      hadError = true;
      const fallback =
        error instanceof DOMException && error.name === "AbortError"
          ? "This is taking too long. Please try again."
          : error instanceof Error && error.message.trim()
            ? error.message
            : "Sorry, something went wrong. Please try again.";
      setMessages((prev) => {
        const next = prev.map((message) =>
          message.id === assistantMessage.id ? { ...message, text: fallback } : message,
        );
        saveMessages(next);
        return next;
      });
    } finally {
      window.clearTimeout(timeoutId);
      if (!receivedDelta && !hadError) {
        setMessages((prev) => {
          const next = prev.map((message) =>
            message.id === assistantMessage.id
              ? {
                  ...message,
                  text: "Sorry, I couldn't generate a response. Please try again.",
                }
              : message,
          );
          saveMessages(next);
          return next;
        });
      }
      finalizeStream();
      window.setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSend();
    }
  };

  if (!question) {
    return null;
  }

  const showEmptyState = messages.length === 0 && !isThinking;
  const showFocus = focusLatest && messages.length > 0;
  const latestUser = showFocus
    ? [...messages].reverse().find((message) => message.role === "user") ?? null
    : null;
  const latestAssistant = showFocus
    ? [...messages].reverse().find((message) => message.role === "assistant") ?? null
    : null;

  return (
    <>
      <div
        className="rounded-full p-[1px] shadow-[0px_1px_10px_rgba(4,98,153,0.15),0px_-1px_10px_rgba(221,98,249,0.15)]"
        style={{
          background:
            "linear-gradient(95deg, #0296ED 0%, #F9A8D4 42%, #C287DE 100%)",
        }}
      >
        <button
          className="flex w-full items-center rounded-full bg-[#f5f5f5] px-[20px] py-[16px] text-left"
          type="button"
          onClick={handleOpen}
        >
          <span className="text-[16px] text-[#707070] [font-family:var(--font-instrument-sans)]">
            {question}
          </span>
        </button>
      </div>

      {isOpen && portalTarget
        ? createPortal(
            <div className="absolute inset-0 z-40">
              <button
                type="button"
                className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
                aria-label="Close conversation"
                onClick={handleClose}
              />
              <div
                className={`absolute bottom-0 left-0 right-0 flex h-[92%] flex-col rounded-t-[28px] bg-white shadow-[0_-16px_40px_rgba(0,0,0,0.18)] ${
                  isActive
                    ? "sheet-in"
                    : "translate-y-full transition-transform duration-250 ease-in"
                }`}
                style={{
                  willChange: "transform",
                }}
                role="dialog"
                aria-modal="true"
                aria-label={`Conversation about ${artworkTitle}`}
              >
                <div className="relative flex h-full flex-col">
                  <div className="pointer-events-none absolute left-1/2 top-[8px] h-[4px] w-[48px] -translate-x-1/2 rounded-full bg-[#d9d9d9]" />
                  <div
                    className="flex h-[100px] w-full items-end bg-gradient-to-t from-[rgba(255,255,255,0)] to-white px-[20px] pb-[16px]"
                    style={{
                      backgroundImage:
                        "linear-gradient(180.34086741623048deg, rgba(255, 255, 255, 0) 1.4162%, rgb(255, 255, 255) 56.069%)",
                    }}
                  >
                    <div className="flex w-full items-center gap-[16px]">
                      <div className="flex items-center">
                        <button
                          type="button"
                          className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[rgba(217,217,217,0.33)] p-[8px] shadow-[0px_0px_32px_0px_rgba(0,0,0,0.2)] backdrop-blur-[16px]"
                          onClick={handleClose}
                          aria-label="Close"
                        >
                          <img
                            alt=""
                            aria-hidden="true"
                            className="h-[24px] w-[24px]"
                            src="/images/ui/other/icon-x-outline.svg"
                          />
                        </button>
                      </div>
                      <p className="flex-1 truncate text-[16px] font-medium text-[#1e1e1e] [font-family:var(--font-instrument-sans)]">
                        {title}
                      </p>
                    </div>
                  </div>

                  <div className="relative flex-1">
                    <div
                      ref={scrollRef}
                      className="absolute inset-0 overflow-y-auto"
                      style={{ paddingBottom: "140px", scrollPaddingBottom: "140px" }}
                      onScroll={handleScroll}
                      onWheel={handleWheel}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                    >
                      <div className="flex min-h-full flex-col items-start">
                        {showEmptyState ? (
                          <div className="flex w-full flex-1 flex-col items-center justify-end px-[20px] py-[16px]">
                            <button
                              type="button"
                              className="rounded-[24px] border border-[#d9d9d9] px-[16px] py-[12px] text-left"
                              onClick={() => handleSend(question)}
                              aria-label="Send suggested prompt"
                              disabled={isThinking}
                            >
                              <span className="text-[16px] text-[#1e1e1e] [font-family:var(--font-instrument-sans)]">
                                {question}
                              </span>
                            </button>
                          </div>
                        ) : showFocus ? (
                          <div className="w-full px-[20px] py-[16px]">
                            {latestUser ? (
                              <div className="flex w-full justify-end pb-[12px]">
                                <div className="max-w-[327px] rounded-[24px] bg-[#f5f5f5] px-[16px] py-[12px]">
                                  <p className="text-[16px] leading-[22px] text-[#1e1e1e] [font-family:var(--font-instrument-sans)] whitespace-pre-wrap">
                                    {latestUser.text}
                                  </p>
                                </div>
                              </div>
                            ) : null}
                            {latestAssistant && latestAssistant.text === "" ? (
                              <DotLoader />
                            ) : null}
                            {latestAssistant && latestAssistant.text ? (
                              <div className="mt-[16px] space-y-[8px]">
                                {renderMarkdown(
                                  latestAssistant.text,
                                  "text-[16px] leading-[22px] text-[#1e1e1e] [font-family:var(--font-instrument-sans)]",
                                )}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <>
                            {messages.map((message) => (
                              <div
                                key={message.id}
                                className={
                                  message.role === "assistant"
                                    ? "w-full px-[20px] py-[16px]"
                                    : "flex w-full justify-end px-[20px] py-[16px]"
                                }
                              >
                                {message.role === "assistant" ? (
                                  message.text ? (
                                    <div className="space-y-[8px]">
                                      {renderMarkdown(
                                        message.text,
                                        "text-[16px] leading-[22px] text-[#1e1e1e] [font-family:var(--font-instrument-sans)]",
                                      )}
                                    </div>
                                  ) : (
                                    <DotLoader />
                                  )
                                ) : (
                                  <div className="max-w-[327px] rounded-[24px] bg-[#f5f5f5] px-[16px] py-[12px]">
                                    <p className="text-[16px] leading-[22px] text-[#1e1e1e] [font-family:var(--font-instrument-sans)] whitespace-pre-wrap">
                                      {message.text}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>

                    <div
                      className="absolute bottom-0 left-0 right-0 flex w-full flex-col items-center gap-[8px] px-[20px] pb-[16px]"
                      style={{
                        backgroundImage:
                          "linear-gradient(180.3579103542304deg, rgba(255, 255, 255, 0) 1.4162%, rgb(255, 255, 255) 56.069%)",
                      }}
                    >
                      <div className="flex h-[45px] w-full items-center justify-between rounded-[100px] bg-[#f5f5f5] pl-[16px] pr-[8px] py-[8px]">
                        <div className="flex flex-1 items-center">
                        <input
                          className="w-full bg-transparent text-[16px] text-[#1e1e1e] placeholder:text-[#b3b3b3] outline-none [font-family:var(--font-instrument-sans)]"
                          placeholder="Ask about the artwork"
                          value={inputValue}
                          onChange={(event) => handleInputChange(event.target.value)}
                          onKeyDown={handleInputKeyDown}
                          maxLength={MAX_INPUT_CHARS}
                          disabled={isThinking}
                          ref={inputRef}
                        />
                        </div>
                        <button
                          type="button"
                          className={`flex h-[32px] w-[32px] items-center justify-center rounded-full ${
                            inputValue.trim() ? "bg-[#2c2c2c]" : "bg-[#2c2c2c]/50"
                          }`}
                          onClick={handleSend}
                          aria-label="Send"
                          disabled={!inputValue.trim() || isThinking}
                        >
                          <img
                            alt=""
                            aria-hidden="true"
                            className="h-[20px] w-[20px]"
                            src="/images/ui/other/icon-arrow-up.png"
                          />
                        </button>
                      </div>
                      <p className="text-[12px] text-[#757575] [font-family:var(--font-instrument-sans)]">
                        Generated from web results, but may still contain errors.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            portalTarget,
          )
        : null}
    </>
  );
}
