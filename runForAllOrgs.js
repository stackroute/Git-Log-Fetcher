var fs = require('fs');
var organisation = fs.readFileSync(process.argv[2]);
organisation  = JSON.parse(organisation);

var jobsExecuter = require('./jobsExecuter');
var orgJobMaker = require('./orgJobMaker');

var exec = require('child_process').execSync;



function runForAllOrgs() {

    console.log("Going to start for "+ organisation.organizationFileName);
    //exec('sudo service td-agent restart');


    orgJobMaker(organisation.organizationFileName, organisation.organizationJobFileName);
    console.log(organisation.organizationJobFileName);
    var orgJobs = fs.readFileSync(organisation.organizationJobFileName);
    console.log(orgJobs);
    orgJobs = JSON.parse(orgJobs);
    console.log("orgJobs");
    console.log(orgJobs);
    if(orgJobs.status != "running"){
      //Run all the jobs
      console.log("jobs are idle");
      jobsExecuter.gitLogFetchAndDumpInit(organisation.organizationJobFileName,organisation.organizationFileName);
      jobsExecuter.getAndDumpGitLogs();
    }


}
 runForAllOrgs();
setInterval(runForAllOrgs, 1800000);
