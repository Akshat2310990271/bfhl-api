require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

const EMAIL = process.env.OFFICIAL_EMAIL;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

const fibonacci = (n) => {
  if (n < 0 || n > 1000) throw "Out of range";
  let a = 0, b = 1, arr = [0];
  for (let i = 1; i <= n; i++) {
    arr.push(b);
    [a, b] = [b, a + b];
  }
  return arr;
};

const primesFromArray = (arr) => {
  const isPrime = (x) => {
    if (x < 2) return false;
    for (let i = 2; i * i <= x; i++)
      if (x % i === 0) return false;
    return true;
  };
  return arr.filter(isPrime);
};

const gcd = (a, b) => (!b ? a : gcd(b, a % b));
const hcfArray = (arr) => arr.reduce((a, b) => gcd(a, b));

const lcmTwo = (a, b) => (a * b) / gcd(a, b);
const lcmArray = (arr) => arr.reduce((a, b) => lcmTwo(a, b));

async function askAI(question) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt =
    question +
    " . Reply strictly in ONE single word only with no punctuation.";

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return text.split(/\s+/)[0];
}

function validateSingleKey(body) {
  const keys = ["fibonacci", "prime", "lcm", "hcf", "AI"];
  const found = keys.filter((k) => k in body);

  if (found.length !== 1) {
    return "Request must contain exactly one valid key.";
  }
  return null;
}

app.get("/health", (req, res) => {
  res.json({
    is_success: true,
    official_email: EMAIL,
  });
});

app.post("/bfhl", async (req, res) => {
  try {
    const error = validateSingleKey(req.body);
    if (error) {
      return res.status(400).json({
        is_success: false,
        official_email: EMAIL,
        error,
      });
    }

    if ("fibonacci" in req.body) {
      const n = req.body.fibonacci;
      if (typeof n !== "number")
        throw "fibonacci must be integer";

      return res.json({
        is_success: true,
        official_email: EMAIL,
        data: fibonacci(n),
      });
    }

    if ("prime" in req.body) {
      const arr = req.body.prime;
      if (!Array.isArray(arr))
        throw "prime must be array";

      return res.json({
        is_success: true,
        official_email: EMAIL,
        data: primesFromArray(arr),
      });
    }

    if ("lcm" in req.body) {
      const arr = req.body.lcm;
      if (!Array.isArray(arr))
        throw "lcm must be array";

      return res.json({
        is_success: true,
        official_email: EMAIL,
        data: lcmArray(arr),
      });
    }

    if ("hcf" in req.body) {
      const arr = req.body.hcf;
      if (!Array.isArray(arr))
        throw "hcf must be array";

      return res.json({
        is_success: true,
        official_email: EMAIL,
        data: hcfArray(arr),
      });
    }

    if ("AI" in req.body) {
      const q = req.body.AI;
      if (typeof q !== "string")
        throw "AI must be string";

      const answer = await askAI(q);

      return res.json({
        is_success: true,
        official_email: EMAIL,
        data: answer,
      });
    }
  } catch (err) {
    res.status(400).json({
      is_success: false,
      official_email: EMAIL,
      error: err.toString(),
    });
  }
});

app.use((err, req, res, next) => {
  res.status(500).json({
    is_success: false,
    official_email: EMAIL,
    error: "Internal Server Error",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("Server running on", PORT)
);
