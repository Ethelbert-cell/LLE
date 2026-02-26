const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const { protect } = require("../middleware/auth");

/**
 * AI/NLP Route — Pillar 3, Tier 2
 * Uses Groq (llama3-8b-8192) with system instructions that keep the
 * assistant focused strictly on library topics.
 */

const SYSTEM_INSTRUCTIONS = `You are LibBot, a helpful and friendly AI assistant for a university library.

Your ONLY role is to answer questions strictly about:
- Library opening hours and location
- Library policies (noise levels, food/drink, device usage)
- Available resources (books, journals, academic databases like JSTOR, Scopus, PubMed)
- How to book a study room or schedule a librarian meeting via this app
- General study tips related to library use
- Book borrowing, returns, and renewals

Response rules:
- Keep answers concise and friendly (2–4 sentences max)
- Use bullet points only when listing multiple items
- If the question is completely unrelated to the library, politely redirect: "I'm specialised in library topics — for that question I'd suggest speaking to a librarian directly via Live Chat."
- Never fabricate facts. If unsure, say: "I don't have that information — please contact a librarian via Live Chat for accurate details."
- Do NOT answer questions about general topics like weather, politics, coding, etc.`;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// @route  POST /api/ai
// @access Protected
router.post("/", protect, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim())
      return res.status(400).json({ message: "Message is required" });

    // Build conversation context (last 6 messages max to stay within token limits)
    const recentHistory = history.slice(-6).map((m) => ({
      role: m.role, // 'user' or 'assistant'
      content: m.content,
    }));

    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTIONS },
        ...recentHistory,
        { role: "user", content: message },
      ],
      temperature: 0.5,
      max_tokens: 512,
    });

    const reply =
      chatCompletion.choices?.[0]?.message?.content?.trim() ||
      "I couldn't generate a response right now. Please try again or contact a librarian via Live Chat.";

    res.json({ reply });
  } catch (err) {
    console.error("Groq AI Error:", err.message);
    res.status(500).json({
      message:
        "AI service error. Please try Live Chat to speak with a librarian directly.",
    });
  }
});

module.exports = router;
