const args = require('minimist')(process.argv.slice(2))
const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const urls = require('./config/urls.json')
const loginSteps = require('./config/loginSteps.json')
const lhouseJunitReporter = require('./lighthouse-junit-reporter/index.js');
const fs = require('fs');
let reportContent = '[';
let headless = false;
let junit = false;

async function gatherLighthouseMetrics(page, config, url) {
    const port = await page.browser().wsEndpoint().split(':')[2].split('/')[0];
    return await lighthouse(page.url(), {
			port: port
		}, config).then(results => 
			{
			console.log('Generating results for: %s', url);
			generateReportContent(results, url);
			console.log('Results generated.');		
			return results;
		}
	);
}

const runPuppeteerOnPage = async (url, auth) => {
	await puppeteer.launch({
		headless: headless
	}).then(async browser => {
		
		const page = await browser.newPage();
		await page.goto(url);
		
		if(auth)
		{	
			await page.waitForSelector(loginSteps.selectorVerifyLoginPage);
	
			loginSteps.steps.sort(function(a, b){return a.order-b.order})
			
			for(const step of loginSteps.steps)
			{
				if(step.action == "click")
				{
					await page.click(step.selector);
				}
				if(step.typeOnField)
				{
					await page.keyboard.type(step.typeOnField);
				}
			}
		
			await page.waitForSelector(loginSteps.selectorVerifyPostLoginPage);
	
			await page.goto(url);
		
			browser.on('targetchanged', async target => {
				const page = await target.page();
				if (page.url().startsWith('http')) {						
					restoreLocalStorage(page);
				}
			});
		}
		
		await gatherLighthouseMetrics(page, '', url);	

		await browser.close();			
	});	
}
	
function generateReportContent(results, url){
	let categories = results.lhr.categories;

	var detail = { 
		performance: categories.performance.score,
		accessibility: categories.accessibility.score,
		["best-practices"]: categories["best-practices"].score,
		seo: categories.seo.score,
		pwa: categories.pwa.score
	}
	
	var root = {
		url: url.replace("\r","").trim(),
		score: ((detail.performance + detail.accessibility + detail["best-practices"] + detail.seo + detail.pwa) / 5),
		detail: detail		
	}
	
	reportContent += JSON.stringify(root) + ',';
}

const restoreLocalStorage = async (page) => {
	try {
		await page.evaluate((page) => {
//			localStorage.setItem();
//			localStorage.setItem();
		})
	}
	catch(err){
	}
}
function manageArgs(){	
	if(args['headless'])
	{
		headless = true;
	}
	if(args['junit'])
	{		
		junit = true;
	}
}
async function manageTestFlow(){
	for(const item of urls) {
		let auth = item.auth;
		let url = item.url;
	
		console.log('-----Running on url '+ url);
		console.log('-----Auth: ' + auth);
	
		await runPuppeteerOnPage(url, auth);	
					
		console.log('-----Test ended on url '+ url +"\r\n");
	}
	
	if(reportContent.endsWith(",")){
		reportContent = reportContent.substring(0, reportContent.length-1);
		reportContent += "]";
	}
	
	fs.writeFile('../test/performance/lighthouse-puppeteer-auth/report/light-puppeteer/summary.json', reportContent, (err) => {
        if (err) throw err;
        console.log("The output report has been saved at '../test/performance/lighthouse-puppeteer-auth/report/light-puppeteer/summary.json'.");
		if(junit){
			lhouseJunitReporter.convert('../test/performance/lighthouse-puppeteer-auth/report/light-puppeteer/summary.json','../test/performance/lighthouse-puppeteer-auth/report/light-junit/junit.xml');
		}
    });
}

(async () => {
	  
	manageArgs();
	
	manageTestFlow();
	
})();
