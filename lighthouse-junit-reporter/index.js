const fs = require('fs')
const testSuiteMainHeader = "<testsuites duration=\"0.00\">"; 
const testSuiteMainFooter = "</testsuites>"; 
const testSuiteFooter = "</testsuite>";

module.exports = {
    convert: function(filePath, desiredPath) {
        let jsonFileContent = fs.readFileSync(filePath).toString();

        let xmlfileOutput = module.exports.performConversion(jsonFileContent);
        
        module.exports.writeOutputXml(desiredPath, xmlfileOutput);
    },
    performConversion: function(fileContent){
        let parsedJson = JSON.parse(fileContent);

        let xmlFile = testSuiteMainHeader;

        for(var i = 0; i < parsedJson.length;i++)
        {     
            xmlFile+= module.exports.generateTestSuiteTag(parsedJson[i].url, 5);
            xmlFile+= module.exports.generateTestCaseTag(parsedJson[i].url, 'performance', parsedJson[i].detail.performance);
            xmlFile+= module.exports.generateTestCaseTag(parsedJson[i].url, 'accessibility', parsedJson[i].detail.accessibility);
            xmlFile+= module.exports.generateTestCaseTag(parsedJson[i].url, 'best-practices', parsedJson[i].detail["best-practices"]);
            xmlFile+= module.exports.generateTestCaseTag(parsedJson[i].url, 'seo', parsedJson[i].detail.seo);
            xmlFile+= module.exports.generateTestCaseTag(parsedJson[i].url, 'pwa', parsedJson[i].detail.pwa);
            xmlFile+= testSuiteFooter;
        }

        xmlFile += testSuiteMainFooter;

        return xmlFile;
    },
    writeOutputXml: function(desiredPath,xmlFile) {
        fs.writeFile(desiredPath, xmlFile, function(err, data) {
            if (err) {
                console.log(err);
            }
            else {
                console.log(`Success! JUnit report generated at ${desiredPath}`);
            }
        });    
    },
    generateTestSuiteTag: function(testUrl, testAmount){
        return `<testsuite failures=\"0\" name=\"Lighthouse test for: ${testUrl}\" package=\"\" tests=\"${testAmount}\" time=\"0\">`
    },
    generateTestCaseTag: function(testUrl,testType ,score){
        return `<testcase classname=\"Lighthouse test for: ${testUrl}\" name=\"Score for ${testType}: ${score}\" time="0"/>`;
    }
}