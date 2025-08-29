// index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// helpers
const isIntegerString = (s) => /^-?\d+$/.test(s);
const isAlphaString = (s) => /^[A-Za-z]+$/.test(s);

function buildUserId() {
  const full = (process.env.FULL_NAME_LOWER || "your_name").replace(/\s+/g, "_").toLowerCase();
  const dob = process.env.DOB_DDMMYYYY || "01011999";
  return `${full}_${dob}`;
}

function altCapsReverse(chars) {
  const r = [...chars].reverse();
  return r.map((ch, i) => (i % 2 === 0 ? ch.toUpperCase() : ch.toLowerCase())).join("");
}

function baseEnvelope(is_success, extras = {}) {
  // ALWAYS include all required keys
  return {
    is_success,                                 // 1. Status
    user_id: buildUserId(),                     // 2. User ID
    email: process.env.EMAIL || "",             // 3. Email ID
    roll_number: process.env.ROLL_NUMBER || "", // 4. College Roll Number
    odd_numbers: [],                            // 6. Odd numbers (as strings)
    even_numbers: [],                           // 5. Even numbers (as strings)
    alphabets: [],                              // 7. Alphabets (UPPERCASE)
    special_characters: [],                     // 8. Special characters
    sum: "0",                                   // 9. Sum of numbers (as STRING)
    concat_string: "",                          // 10. Alternating caps of reversed letters
    ...extras,
  };
}

app.post("/bfhl", (req, res) => {
  try {
    const data = Array.isArray(req.body?.data) ? req.body.data.map(String) : null;
    if (!data) {
      return res.status(200).json(
        baseEnvelope(false, { message: 'Invalid payload: "data" must be an array.' })
      );
    }

    const even_numbers = [];
    const odd_numbers = [];
    const alphabets = [];
    const special_characters = [];
    const allLetters = [];
    let sumN = 0;

    for (const raw of data) {
      const v = String(raw).trim();

      // collect letters from every token (for concat_string)
      for (const m of v.matchAll(/[A-Za-z]/g)) allLetters.push(m[0]);

      if (isIntegerString(v)) {
        const n = parseInt(v, 10);
        sumN += n;
        (Math.abs(n) % 2 === 0 ? even_numbers : odd_numbers).push(v); // keep as strings
      } else if (isAlphaString(v)) {
        alphabets.push(v.toUpperCase());
      } else if (v.length) {
        special_characters.push(v);
      }
    }

    const out = baseEnvelope(true, {
      even_numbers,
      odd_numbers,
      alphabets,
      special_characters,
      sum: String(sumN),
      concat_string: altCapsReverse(allLetters),
    });

    return res.status(200).json(out);
  } catch (e) {
    return res.status(200).json(
      baseEnvelope(false, { message: "Unexpected error" })
    );
  }
});

app.get("/", (_req, res) => res.status(200).send("OK"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
