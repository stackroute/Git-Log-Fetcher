var fs = require('fs');

function orgJobMaker(orgConfigFile, orgJobQFile) {
    console.log("inisde org job maker");
    console.log(orgJobQFile);
    var jobFileStatus = fs.existsSync(orgJobQFile);
    console.log("Inside stats");

    if (jobFileStatus == false) {
        console.log("File does not exists");
        var organisationData = fs.readFileSync(orgConfigFile);
        organisationData = JSON.parse(organisationData);
        var orgId = organisationData._id;
        var now = new Date();
        now = now.toISOString();
        var jobObject = {};
        var jobsArray = [];
        organisationData.repositoryData.map(function(repo) {
            var newJob = {
                repo: repo,
                endDate: now
            }
            jobsArray.push(newJob);
        });
        jobObject = {
            orgId: orgId,
            jobQue: jobsArray,
            status: "idle"
        }

        fs.writeFileSync(orgJobQFile, JSON.stringify(jobObject, null, '\t'), 'utf8');
        // fs.writeFile(orgJobQFile, JSON.stringify(jobObject, null, '\t'), function(err) {
        //     if (err) return console.log(err);
        //     console.log("Data has been written in the file");
        // });
    }



}

module.exports = orgJobMaker;