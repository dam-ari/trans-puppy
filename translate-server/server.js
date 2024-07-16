const express = require('express');
const chrome = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
const path = require('path');

const app = express();

app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

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

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chrome.args,
      executablePath: await chrome.executablePath,
      headless: chrome.headless,
    });

    const page = await browser.newPage();

    // Navigate to the main URL
    console.log("Navigating to Google Translate...");
    await page.goto(URL, {
      waitUntil: "domcontentloaded",
    });

    // Wait for the textarea to be available and type text into it
    console.log("Waiting for textarea...");
    await page.waitForSelector(".er8xn", { timeout: 30000 });
    await page.type(".er8xn", " ", { delay: 1500 });
    await typeTextSlowly(page, ".er8xn", inputText, 80); // Add delay between each character

    // Wait for the translation result to be available
    console.log("Waiting for translation result...");
    await page.waitForSelector(".ryNqvb[jsname='W297wb']", { timeout: 60000 });

    // Extract the translated text
    console.log("Extracting translated text...");
    const translatedText = await page.evaluate(() => {
      const translatedElement = document.querySelector(".ryNqvb[jsname='W297wb']");
      return translatedElement ? translatedElement.textContent : null;
    });

    console.log("Translated Text:", translatedText);

    return translatedText;
  } catch (error) {
    console.error("Error during translation process:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
