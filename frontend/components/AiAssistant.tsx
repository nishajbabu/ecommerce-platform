"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, X, ArrowUp, Bot } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Message {
  sender: "user" | "bot";
  text: string;
}

const SUGGESTED_PROMPTS = [
  "Best earbuds under ₹3,000?",
  "What gadgets are currently in stock?",
  "Recommend a gift for a developer",
];

export default function AiAssistant() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Hi! I'm the NeuraShop AI Concierge connected directly to our live catalog. Ask me for comparisons, budget picks, or stock recommendations.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setInput("");
      setMessages((prev) => [...prev, { sender: "user", text: trimmed }]);
      setLoading(true);

      try {
        const res = await apiRequest<{ reply: string }>("/api/ai/chat", {
          method: "POST",
          body: JSON.stringify({ message: trimmed }),
        });
        setMessages((prev) => [...prev, { sender: "bot", text: res.reply }]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "I ran into a temporary connection issue. Please try asking again in a moment.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  // Listen for contextual AI triggers from Product Details & Storefront
  useEffect(() => {
    const handleOpenAi = (event: Event) => {
      const customEvent = event as CustomEvent<{ prompt?: string }>;
      setIsOpen(true);
      if (customEvent.detail?.prompt) {
        sendMessage(customEvent.detail.prompt);
      }
    };

    window.addEventListener("open-ai-assistant", handleOpenAi);
    return () => {
      window.removeEventListener("open-ai-assistant", handleOpenAi);
    };
  }, [sendMessage]);

  if (pathname.startsWith("/login") || pathname.startsWith("/admin")) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white shadow-xl transition-all hover:bg-zinc-900 hover:scale-[1.02] dark:border-zinc-700 cursor-pointer"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span>Ask AI Advisor</span>
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
        </button>
      )}

      {isOpen && (
        <div className="flex h-[520px] w-[350px] sm:w-[400px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-3.5 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-tight">
                  NeuraShop AI
                </h3>
                <p className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Live Catalog Concierge
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              aria-label="Close AI Advisor"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3.5 overflow-y-auto bg-zinc-50/70 p-4 text-[13px] dark:bg-zinc-950">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex gap-2.5",
                  m.sender === "user" ? "justify-end" : "justify-start"
                )}
              >
                {m.sender === "bot" && (
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-indigo-600 shadow-xs dark:border-zinc-800 dark:text-indigo-400">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[82%] rounded-xl px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap",
                    m.sender === "user"
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950"
                      : "border border-zinc-200 bg-white text-zinc-800 shadow-xs"
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {/* Quick Prompt Chips */}
            {messages.length === 1 && !loading && (
              <div className="flex flex-wrap gap-1.5 pt-1 pl-8">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 transition-colors cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-2.5 text-xs text-zinc-400">
                <div className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-200 bg-white text-indigo-600 dark:text-indigo-400">
                  <Bot className="h-3.5 w-3.5 animate-pulse" />
                </div>
                <span>Searching live catalog...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-zinc-200 bg-white p-3"
          >
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 focus-within:border-zinc-900 focus-within:bg-white focus-within:ring-2 focus-within:ring-zinc-900/10 transition-all dark:focus-within:border-zinc-500">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about specs, budget, or stock..."
                className="flex-1 bg-transparent py-1 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800 transition-colors cursor-pointer"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}