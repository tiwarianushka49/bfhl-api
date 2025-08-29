import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const isIntegerString = (s) => /^-?\d+$/.test(s);
const isAlphaString   = (s) => /^[A-Za-z]+$/.test(s);

function buildUserId() {
  const full = (process.env.FULL_NAME_LOWER || "john_doe").replace(/\s+/g, "_").toLowerCase();
  const dob  = process.env.DOB_DDMMYYYY || "17091999";
  return `${full}_${dob}`;
}

function altCapsReversed(chars) {
  const rev = [...chars].reverse();
  return rev.map((ch, i) => (i % 2 === 0 ? ch.toUpperCase() : ch.toLowerCase())).join("");
}

app.post("/bfhl", (req, res) => {
  const email = process.env.EMAIL || "john@xyz.com";
  const roll  = process.env.ROLL_NUMBER || "ABCD123";
  const user_id = buildUserId();

  try {
    const { data } = req.body || {};
    if (!Array.isArray(data)) {
      return res.status(200).json({
        is_success: false,
        user_id, email, roll_number: roll,
        message: 'Invalid payload: "data" must be an array.'
      });
    }

    const even_numbers = [];
    const odd_numbers = [];
    const alphabets = [];              // only pure A-Z tokens (UPPERCASED)
    const special_characters = [];     // everything else (incl. mixed, symbols)
    let sum = 0;
    const letterChars = [];            // letters from ALL tokens for concat_string

    for (const item of data) {
      const v = String(item).trim();

      // collect letters from every token for concat_string
      for (const m of v.matchAll(/[A-Za-z]/g)) letterChars.push(m[0]);

      if (isIntegerString(v)) {
        const n = parseInt(v, 10);
        sum += n;
        (Math.abs(n) % 2 === 0 ? even_numbers : odd_numbers).push(v);
      } else if (isAlphaString(v)) {
        alphabets.push(v.toUpperCase());
      } else if (v.length) {
        special_characters.push(v);
      }
    }

    return res.status(200).json({
      is_success: true,
      user_id,
      email,
      roll_number: roll,
      odd_numbers,
      even_numbers,
      alphabets,
      special_characters,
      sum: String(sum),
      concat_string: altCapsReversed(letterChars),
    });
  } catch (e) {
    return res.status(200).json({
      is_success: false,
      user_id, email, roll_number: roll,
      message: "Unexpected error"
    });
  }
});

app.get("/", (_req, res) => res.status(200).send("OK"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
