const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000;

app.use(express.json());

const URL = "https://translate.google.com/?sl=auto&tl=en&op=translate";

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

async function typeTextSlowly(page, selector, text, delayTime) {
  for (const char of text) {
    await page.type(selector, char);
    await delay(delayTime);
  }
}

async function translateText(inputText) {
  console.log("Original Text:", inputText);

  const browser = await puppeteer.launch({
    headless: true, // Set to true for headless operation
    defaultViewport: null,
  });

  const page = await browser.newPage();

  // Navigate to the main URL
  await page.goto(URL, {
    waitUntil: "domcontentloaded",
  });

  // Wait for the textarea to be available and type text into it
  await page.waitForSelector(".er8xn", { timeout: 30000 });
  await page.type(".er8xn", " ", { delay: 1500 });
  await typeTextSlowly(page, ".er8xn", inputText, 80); // Add delay between each character

  // Wait for the translation result to be available
  await page.waitForSelector(".ryNqvb[jsname='W297wb']", { timeout: 60000 });

  // Extract the translated text
  const translatedText = await page.evaluate(() => {
    const translatedElement = document.querySelector(".ryNqvb[jsname='W297wb']");
    return translatedElement ? translatedElement.textContent : null;
  });

  await page.close();
  await browser.close();

  return translatedText;
}

app.post('/translate', async (req, res) => {
  const inputText = req.body.text || req.query.text || "Hello World";
  
  try {
    const translatedText = await translateText(inputText);
    res.json({ original: inputText, translated: translatedText });
  } catch (error) {
    console.error("Error translating text:", error);
    res.status(500).json({ error: "Failed to translate text" });
  }
});

app.get('/translate', async (req, res) => {
  const inputText = req.query.text || "Hello World";
  
  try {
    const translatedText = await translateText(inputText);
    res.json({ original: inputText, translated: translatedText });
  } catch (error) {
    console.error("Error translating text:", error);
    res.status(500).json({ error: "Failed to translate text" });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
