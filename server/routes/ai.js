const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");

/**
 * AI/NLP Route — Pillar 3, Tier 2
 * Proxies free-text queries to an AI provider (Gemini / OpenAI).
 * System instructions keep the AI focused on library topics only.
 *
 * Replace the fetch call below with your preferred AI SDK when you
 * have an API key. A clear placeholder is left so it is easy to swap.
 */

const SYSTEM_INSTRUCTIONS = `
You are a helpful university library assistant named "LibBot".
Your ONLY role is to answer questions about:
- Library hours and location
- Library policies (noise, food, devices)
- Available resources (books, journals, databases)
- How to book a room or schedule a librarian meeting
- General study tips related to library use

If a question is completely unrelated to the library, politely redirect
the student back to library topics. Keep responses concise and friendly.
Never make up facts — if you don't know, say so and suggest the student
contact a librarian directly.
`;

// @route  POST /api/ai
// @access Protected
router.post("/", protect, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message)
      return res.status(400).json({ message: "Message is required" });

    const apiKey = process.env.AI_API_KEY;

    // ─── PLACEHOLDER: Replace this block with your actual Gemini/OpenAI call ───
    if (!apiKey || apiKey === "your_gemini_or_openai_key_here") {
      return res.json({
        reply:
          "I'm LibBot! My AI brain isn't connected yet — please add an API key in the server .env file. " +
          "For now, try asking me about library hours or booking a room using the quick buttons!",
      });
    }

    // ─── Example: Gemini REST call (uncomment & adjust when key is ready) ───
    // const response = await fetch(
    //   `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    //   {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       system_instruction: { parts: [{ text: SYSTEM_INSTRUCTIONS }] },
    //       contents: [{ parts: [{ text: message }] }],
    //     }),
    //   }
    // );
    // const data = await response.json();
    // const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't process that.";
    // return res.json({ reply });

    res.json({ reply: "AI response placeholder" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
