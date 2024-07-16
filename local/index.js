const puppeteer = require("puppeteer");

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

(async (inputText = "Hello World") => {
  console.log("Original Text:", inputText);

  const startTime = Date.now(); // Record the start time
  try {
    const browser = await puppeteer.launch({
      headless: false, // Set to true for headless operation
      defaultViewport: null,
    });

    const page = await browser.newPage();

    // Navigate to the main URL
    await page.goto(URL, {
      waitUntil: "domcontentloaded",
    });

    // Wait for the textarea to be available and type text into it
    await page.waitForSelector(".er8xn", { timeout: 70000 });
    await page.type(".er8xn", " ", { delay: 2000 });
    await typeTextSlowly(page, ".er8xn", inputText, 100); // Add delay between each character

    // Wait for the translation result to be available
    await page.waitForSelector(".ryNqvb[jsname='W297wb']", { timeout: 60000 });

    // Extract the translated text
    const translatedText = await page.evaluate(() => {
      const translatedElement = document.querySelector(".ryNqvb[jsname='W297wb']");
      return translatedElement ? translatedElement.textContent : null;
    });

    console.log("Translated Text:", translatedText);

    // Close the page and browser
    await page.close();
    await browser.close();

    const endTime = Date.now(); // Record the end time
    const duration = (endTime - startTime) / 1000; // Calculate duration in seconds
    console.log(`Total process took ${duration} seconds.`);
  } catch (err) {
    console.error("Error scraping page:", err);
  }
})(process.argv[2]); // Accept input text from the command line argument
