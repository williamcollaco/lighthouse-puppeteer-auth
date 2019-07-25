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
			localStorage.setItem('abstractionBusUser', `{"identifier":"5505739","authorizationToken":"7a46wWNqaHHmSf_zfpiVyhORkOdwQoIl90z2eRGhMvyROspmBaF6aceI5G_wzpFeABPU15j4IDtXKsCRhXe3psYNFflu68_CyHOBppX9zjA4LGX46pcZabkydp1o45A7Dsu5Dxjy1rAVSvtsvWdj80WaXdoBwK_bApjLXU5SAMBODw9eQ3ndPs1WNeFx3uu_sUeupGIsRPiqooseK-paARlxkva3XyqVnr5pwq4PAhG7J4BUg-5ziTaTIobn66dafkoMKaGEgWRnV5yCgmLBzZmjvrhrOIiIK1Z6iQV6ebHt3ilNOb6dMlUJc3n20SOh_kfyiMssmE2gesb2MML3mYZyYeomBPi5DmMZiApveBiRaT4DG6UofclmLy-59svGUhSUDWmBaVjeGx1r2XZsH4mzSGtnbZIk2sgelQoFSvifCnAx0k_eobsFExIOSNu87YJxvBPXPE2o3r0ppnDgmedbtUZa5au3HIzTzblT97_t-HjwR41wzXqLJIrcSsFD3qQxt0cQhDCK3iLrGxxstSA4cLvIk-EKxsAKMkQN57IWGEvj","refreshToken":"e26076ef383a4ac38024ccc04976551b","expiresIn":86399,"clientAuthDate":1563988189121}`);
			localStorage.setItem('currentOrder', `{"businessModels":[{"businessModel":{"code":1,"name":"Representantes  ","isSaveOrder":false,"function":{"code":1},"orderingDescription":"PEDIDO TRADICIONAL – ENTREGUE EM CASA PELA TRANSPORTADORA","businessModelDefault":false,"profitabilityDefault":30,"configurationSystem":{"allowsGiftPackaging":false,"allowsMultiplePackagingItems":false,"creditLimitConsideringTolerance":false,"displayAlertMenssageExpiredData":false,"displayExportImportItems":false,"displayModalProductReplacement":true,"useAlternativeOrderingDescription":false,"useCompositeMarketing":true,"useCompositeMarketingPastCycles":true,"quantityPastCyclesCompositeMarketing":1,"useCompositeMarketingFutureCycles":false,"quantityFutureCyclesCompositeMarketing":1,"savesReserveOrder":false,"allowsCheckingAccountAdjustment":false,"displayAlertPartialPromotions":true},"minimumScore":15400,"maximumScore":1000000000,"minimumMileageScore":0,"minimumSaleScore":15400,"absoluteToleranceValue":5000,"absoluteExtraCreditValue":0,"errorCode":0},"sellerCreditToleranceData":{"tolerance":5},"deliveryModes":[{"isWithdrawalCenter":false,"distributionCenterCode":203,"distributionCenterName":"DM01_CALMO CD_VARGINHA_MG","address":"RUA PROJETADA PS 333 - AEROPORTO - VARGINHA - MG - CEP 37031090","errorCode":0}],"errorCode":0}],"seller":{"code":5505739,"name":"IVAN NARESSI","birthday":"1984-05-13T00:00:00Z","businessData":{"indicator":{},"timeWorkingCycles":0,"currentCycle":201909,"inactiveCycles":0,"allocationDate":"2019-07-05T00:00:00Z","blocked":false,"comercialSituation":2,"timeWorking":"2 Meses 21 Dias ","nextCycle":201909},"training":{"trainingSituation":1},"registration":{"registrationDate":"2019-04-24T00:00:00Z","registrationSituation":1,"registrationOrigin":7,"expiredData":false,"allowedDisclosureData":false},"multilevel":{"leader":{"code":1699510,"name":"Pessoa SSBU          "}},"document":[{"type":1,"document":"231299977"},{"type":2,"document":"22598287878"}],"commercialStructure":{"code":311,"name":"PANDORA 1","parent":{"code":310,"name":"Setor PANDORA"}},"addresses":[{"type":1,"level0":"BRASIL","level1":"SP","level2":"CAMPINAS","level3":"BOTAFOGO","level4":"RUA BARÃO GERALDO DE RESENDE","number":"123","zipCode":"13020440"},{"type":3,"level0":"BRASIL","level1":"SP","level2":"CAMPINAS","level3":"BOTAFOGO","level4":"RUA BARÃO GERALDO DE RESENDE","number":"123","zipCode":"13020440"}],"commercialInformation":{"roleCode":11,"roleName":"Representante"},"creditData":{"limit":100000,"allocatedToBill":21000,"allocatedToExpire":0,"allocatedOverdue":0,"availableBalance":79000},"inDebit":true,"errorCode":0},"number":50016959}`);
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