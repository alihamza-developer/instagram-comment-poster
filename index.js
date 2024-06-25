import puppeteer from 'puppeteer';
import GoogleSheet from './Classes/GoogleSheet.js';
import { USERNAME, PASSWORD, SHEET_ID, SHEET_NAME } from './config.js';

const sheet = new GoogleSheet(SHEET_ID, SHEET_NAME);


(async () => {
    //#region Functions
    // Promise 
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    //#endregion Functions 

    //#region Making dataset
    let dataset = {},
        rows = await sheet.read(),
        count = 1,
        limit = 30; // Max posts limit

    console.log("Reading Google Sheet... 📖\n");
    // Loop through all rows except the header one
    for (let i = 1; i < rows.length; i++) {
        if (count > limit) break; // Break the loop if limit exceeds
        let row = rows[i];
        if (!row) continue;
        let url = row[1] ? row[1] : "",
            comment = row[2] ? row[2] : "",
            isPosted = row[3] ? row[3] : "";


        isPosted = isPosted ? isPosted.toLowerCase() == 'yes' ? true : false : false;

        if (isPosted || !url) continue;

        // Store URL
        dataset[url] = {
            comment,
            number: i + 1
        };

        count++; // Increment count
    }


    console.log("Google Sheet read successfully! 📖\n")

    // Check if there are any posts to post on
    if (Object.keys(dataset).length === 0) {
        console.log('No new posts to post on! 📪');
        return;
    }
    //#endregion Making dataset

    // Launch the browser
    const browser = await puppeteer.launch({
        headless: false
    });
    let page = await browser.newPage();


    await page.goto('https://www.instagram.com/', {
        waitUntil: "networkidle2"
    });

    // Login to Instagram
    await page.type('input[name="username"]', USERNAME);
    await page.type('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    console.log('Waiting for 10 seconds to login... ⏳\n');
    await wait(10000);
    console.log('Login Done ✅');

    // Go to each post and comment on it
    for (let url in dataset) {
        let { comment, number } = dataset[url];

        console.log(`Posting on ${url} with comment: ${comment} 🚀\n`);

        // Go to post
        await page.goto(url, {
            waitUntil: "networkidle2"
        });

        await page.waitForSelector('textarea[aria-label="Add a comment…"]', {
            visible: true
        });

        // Type the comment
        await page.type('textarea[aria-label="Add a comment…"]', comment);
        await page.keyboard.press('Enter');
        await wait(7000);


        // Update in Google Sheet
        await sheet.updateCell({
            row: number,
            column: 'D',
            value: 'Yes'
        });
        console.log("Posted! 🚀\n");
    }

    console.log(Object.keys(dataset).length + ' posts have been posted! 📪');

    await browser.close(); // Close Browser
})()