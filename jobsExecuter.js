var Q = require('q');
var fs = require('fs');
var request = require('request');
var path = require('path');
var fluentAgent = require('./fluentAgent');

var pushJobsToExecute = require('./pushJobsToExecute');
function clone(a) {
   return JSON.parse(JSON.stringify(a));
}

var orgJobQFile;
var jobsData;

function jobExecuter(job) {
    var deferred = Q.defer();
    //console.log("Job Came for Execution==> ", job);
    //console.log("Job Executed");
    if (job.repo.gitUserName == 'pranay06') {
        job.repo.gitUserName = "pranay07";
        deferred.reject(job);
    }
    deferred.resolve(job);
    return deferred.promise;
}


var jobs;
var orgData;
var accessTokenDummy = "insertAccessToken";

function gitJobExecuterWrapper(job) {

    var deferred = Q.defer();
    var url;
    if(job.endDate == undefined){
      job.endDate = new Date();
      job.endDate = job.endDate.toISOString();
    }
    if (job.startDate != undefined) {
        url = orgData.gitHost + "/" + path.join("repos", job.repo.gitUserName, job.repo.repo, "commits") + "?" + "since=" + job.startDate + "&" + "until=" + job.endDate + "&per_page=100&access_token=" + accessTokenDummy;

    } else {
        url = orgData.gitHost + "/" + path.join("repos", job.repo.gitUserName, job.repo.repo, "commits") + "?" + "until=" + job.endDate + "&per_page=100&access_token=" + accessTokenDummy;
    }
    gitJobExecuter(url, job, orgData, job.endDate).then(function(completedJob) {
        deferred.resolve(completedJob);
    }).fail(function(newJob, oldJob) {
        deferred.reject(newJob, oldJob);
    });
    return deferred.promise;
}

function checkAuthRemainingReq(gitAuth) {
    var gitHost = orgData.gitHost;
    var deferred = Q.defer();

    var url = gitHost + "/rate_limit?access_token=" + gitAuth;

    var requestParam = {

        url: url,
        method: 'GET', //Specify the method
        headers: { //We can define headers too
            'User-Agent': "tattwaGitAgent",
            'Content-Type': 'MyContentType',
            'Custom-Header': 'Custom Value'
        }
    };

    console.log("gitAuth URL: " + url);
    request(requestParam, function(error, response, gitData) {

        if (!error && response.statusCode == 200) {
            gitData = JSON.parse(gitData);
            // console.log("Inside git Auth Extraction Callback");
            // //console.log(gitData);
            deferred.resolve(gitData);
        } else {

            console.log("could not get");
            console.log(response);
            console.log(error);
            console.log(gitData);
            deferred.reject(error);
        }
    });
    return deferred.promise;
}

function giveAvailableGitAuth() {
  console.log("giveAvailableGitAuth");
  console.log(orgData);
    var deferred = Q.defer();
    checkAuthRemainingReqSeq(0);

    function checkAuthRemainingReqSeq(authIndex) {
        checkAuthRemainingReq(orgData.gitOauthSets[authIndex]).then(
            function(gitAuthStats) {
                if (gitAuthStats.rate.remaining > 500){
                    console.log("Got the repo");
                    console.log(orgData.gitOauthSets[authIndex]);
                    deferred.resolve(orgData.gitOauthSets[authIndex]);
                  }
                else {
                    if (authIndex < orgData.gitOauthSets.length-1)
                        checkAuthRemainingReqSeq(authIndex + 1);
                    else {
                        //console.log("No gitAuth is available for " + orgData.organizationName);

                        deferred.reject("No gitAuth is available for " + orgData.organizationName);
                    }
                }
            }
        ).fail(function(err) {
            //console.log(err);
            if(authIndex<orgData.gitOauthSets.length-1)
            {
              checkAuthRemainingReqSeq(authIndex + 1);
            }
            else
              deferred.reject(err);
        });
    }
    return deferred.promise;
}


function gitJobExecuter(url, job, orgData, lastDate) {
    var deferred = Q.defer();
    //console.log("gitJobExecuter");


    giveAvailableGitAuth().then(function(gitAuth) {
        console.log("Got the REPO!!!!!!!!!!!!!!!!!!!!");
        url = url.replace(accessTokenDummy, gitAuth);
        console.log("url==> " + url);
        var requestParam = {
            url: url,
            method: 'GET', //Specify the method
            headers: { //We can define headers too
                'User-Agent': "gitAgent",
                'Content-Type': 'MyContentType',
                'Custom-Header': 'Custom Value'
            }
        };
        request(requestParam, function(error, response, gitData) {
            var urlRegex = new RegExp('(https:\/\/api.github.com\/.*&access_token=(.{40}).*)>; rel="next"');
            // var sleep = require('sleep');
            console.log("inside the callback of commits request");
            // response = JSON.parse(response);
            gitData = JSON.parse(gitData);
            if (Object.keys(gitData).length != 0) {

                var promises = gitData.map(function(commit) {
                    // sleep.sleep(1);
                    //console.log("Before gitFileChangesExtraction");
                    return gitFileChangesExtraction(gitData, commit, orgData, job,gitAuth);
                    // sleep.sleep(1);
                });
                Q.allSettled(promises)
                    .then(function(arrayOfCommits) {
                      //All the commits have been extracted and dumped to fluent
                        arrayOfCommits.map(function(commit) {
                            console.log("Trying to push the data in fluent");
                            fluentAgent.fluentLogger(commit.value, orgData.dbName, "gitLogs");
                        });

                        if(lastDate == job.endDate){
                          job.latestProcessingDate = new Date(gitData[0].commit.committer.date);
                          job.latestProcessingDate.setSeconds(job.latestProcessingDate.getSeconds()+1);
                          job.latestProcessingDate = job.latestProcessingDate.toISOString();
                        }
                        lastDate = new Date(gitData[gitData.length-1].commit.committer.date);
                        lastDate.setSeconds(lastDate.getSeconds() -1);
                        lastDate = lastDate.toISOString();
                        job.lastProcessingDate = lastDate;
                        if (response.headers['link'] != undefined) {
                            console.log("Link is present in the header");
                            var nextLinkExtraction = response.headers.link.match(urlRegex);
                            if (nextLinkExtraction) {
                                //PG: Next link is present
                                nextLinkExtraction[1] = nextLinkExtraction[1].replace("accessToken", "access_token");
                                var nextLink = nextLinkExtraction[1].replace(nextLinkExtraction[2], accessTokenDummy);
                                gitJobExecuter(nextLink, job, orgData, lastDate).then(function(jobReturned){
                                  //PG:Next link got executed
                                  jobReturned.startDate = jobReturned.latestProcessingDate;
                                  delete jobReturned.endDate;
                                  delete jobReturned.lastProcessingDate;
                                  delete jobReturned.latestProcessingDate;

                                  // job.startDate = job.lastProcessingDate;
                                  deferred.resolve(jobReturned);
                                }).fail(function(newJob){
                                  //PG:Not able to execute next link
                                  deferred.reject(newJob);
                                });

                            }else {
                              job.startDate = job.latestProcessingDate;
                              delete job.endDate;
                              delete job.lastProcessingDate;
                              delete job.latestProcessingDate;
                              //PG:Not able to extract next link
                              deferred.resolve(job);
                            }

                        }
                        else {
                          //PG: Next link is not present in the header
                          // job.startDate = job.lastProcessingDate;
                          job.startDate = job.latestProcessingDate;
                          delete job.endDate;
                          delete job.lastProcessingDate;
                          delete job.latestProcessingDate;
                          deferred.resolve(job);
                        }


                    })
                    .fail(function(error) {
                        //PG: Respective insertion/deletion of the commits of this link have not been executed properly
                        console.log(error);
                        var forwardJob = null;
                        var backwardJob = null;
                        if(lastDate != job.endDate){
                          forwardJob= {};
                          backwardJob = {};
                          forwardJob = clone(job);
                          forwardJob.startDate = job.latestProcessingDate;
                          delete forwardJob.endDate;
                          delete forwardJob.latestProcessingDate;
                          delete forwardJob.lastProcessingDate;
                          backwardJob = clone(job);
                          backwardJob.endDate = job.lastProcessingDate;
                          delete backwardJob.startDate;
                          delete backwardJob.lastProcessingDate;
                          delete backwardJob.latestProcessingDate;
                        }
                        else {
                          delete job.latestProcessingDate;
                          delete job.lastProcessingDate;
                          forwardJob = job;
                        }
                        deferred.reject({newJob:forwardJob, oldJob:backwardJob});
                      });
            } else {
                //No further commits are present
                // job.startDate = job.lastProcessingDate;
                job.startDate = job.latestProcessingDate;
                delete job.endDate;
                delete job.lastProcessingDate;
                delete job.latestProcessingDate;
                deferred.resolve(job);
            }
        });

    }).fail(function(err) {
        //PG: No further gitAuths are available
        console.log(err);
        var forwardJob = null;
        var backwardJob = null;
        if(lastDate != job.endDate){
          forwardJob= {};
          backwardJob = {};
          forwardJob = clone(job);
          forwardJob.startDate = job.latestProcessingDate;
          delete forwardJob.endDate;
          delete forwardJob.latestProcessingDate;
          delete forwardJob.lastProcessingDate;
          backwardJob = clone(job);
          backwardJob.endDate = job.lastProcessingDate;
          delete backwardJob.startDate;
          delete backwardJob.lastProcessingDate;
          delete backwardJob.latestProcessingDate;
        }
        else {
          delete job.latestProcessingDate;
          delete job.lastProcessingDate;
          forwardJob = job;
        }
        deferred.reject({newJob:forwardJob, oldJob:backwardJob});

        // deferred.reject(job);
    });
    return deferred.promise;
}


function gitFileChangesExtraction(gitData, commit, orgData, job, gitAuth) {
    var deferred = Q.defer();
    console.log("Inside gitFileChangesExtraction");


    var url = orgData.gitHost + "/" + path.join("repos", job.repo.gitUserName, job.repo.repo, "commits", commit.sha) + "?&access_token=" + gitAuth;


    var requestParam = {

        url: url,
        method: 'GET', //Specify the method
        headers: { //We can define headers too
            'User-Agent': "gitAgent",
            'Content-Type': 'MyContentType',
            'Custom-Header': 'Custom Value'
        }
    };
    request(requestParam, function(error, response, gitData) {
          console.log("inside addtion and deletion callback");
          // console.log("url: ",url);
          // //console.log(response);
        if (!error && response.statusCode == 200) {
            // console.log("url in addtion deletion " + url);
            // console.log("Insh ide File Extraction");
            // c++;
            // //console.log(c);
            // //console.log(gitData);
            try{
              if(gitData != undefined) {
                var gitDataJson = JSON.parse(gitData);
                var reviewersExtractRegString = "\nReviewed-By:([^<]*)<([^>]*)";
                var reviewersExtractRegG = new RegExp(reviewersExtractRegString, "g");
                var reviewersExtractReg = new RegExp(reviewersExtractRegString);
                var reviewersArr = [];

                var reviewUnits = commit.commit.message.match(reviewersExtractRegG);
                if (reviewUnits) {
                    reviewUnits.map(function(reviewUnit) {
                        var reviewExtracts = reviewUnit.match(reviewersExtractReg);
                        reviewersArr.push({
                            name: reviewExtracts[1].trim(),
                            email: reviewExtracts[2].trim()
                        });
                    });
                }
                var monthsArr = ["January","February","March","April","May","June","July","August","September","October","November","December"];
                var daysArr = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                var comDate = new Date(commit.commit.committer.date);
                var commitDay = daysArr[comDate.getDay()];
                var commitMonth = monthsArr[comDate.getMonth()];
                var commitYear = comDate.getFullYear().toString();
                var gitFormatedDataJson = {
                    commitDate: commit.commit.committer.date,
                    commitDay: commitDay,
                    commitMonth: commitMonth,
                    commitYear: commitYear,
                    noOfFiles: gitDataJson.files.length,
                    insertion: gitDataJson.stats.additions,
                    deletion: gitDataJson.stats.deletions,
                    repo: job.repo.repo,
                    gitRepoId: job.repo.gitRepoId,
                    gitUserName: job.repo.gitUserName,
                    reviewers: reviewersArr,
                    committer: {
                        name: commit.commit.committer.name,
                        email: commit.commit.committer.email
                    },
                    author: {
                        name: commit.commit.author.name,
                        email: commit.commit.author.email
                    },
                    commitId: commit.sha,

                };

                gitFormatedDataJson.committer.gitUserId = (commit.committer) ? commit.committer.id : "NA";

                gitFormatedDataJson.author.gitUserId = (commit.author) ? commit.author.id : "NA";
                // fluentLogger(gitFormatedDataJson, orgData.dbName, orgData.collectionName, orgData._id);
                console.log("gitFormatedDataJson", gitFormatedDataJson);
                deferred.resolve(gitFormatedDataJson);
                // //console.log("*******************************************");
                // //console.log(gitFormatedDataJson);
                // //console.log("++++++++++++++++++++++++++++++++++++++++++++");
                // response.resume();
                // this.destroy();
              }
              else {
                // console.log("Unstructred Git  Data");
                throw("Unstructred Git  Data");
              }
            }catch (e) {
              console.log(url);
              console.log(gitData);
              console.log(e);
            }
        } else {
            deferred.reject(error);
        }
    });

    return deferred.promise;
}




module.exports.gitLogFetchAndDumpInit = function(orgJobQFileParam, organisationFile) {
  console.log("gitLogFetchAndDumpInit");
  console.log(orgJobQFileParam);
  console.log(organisationFile);
  orgFile = organisationFile;
  orgJobQFile = orgJobQFileParam;

  jobsData = fs.readFileSync(orgJobQFile);
  console.log(orgJobQFile);
  console.log(jobsData);
  jobsData = JSON.parse(jobsData);
  jobsData.status = "running";
  // JSON.stringify(, null, '\t');
  fs.writeFileSync(orgJobQFile, JSON.stringify(jobsData, null, '\t'), 'utf8');
  // fs.writeFile(orgJobQFile, JSON.stringify(jobsData, null, '\t'), function(err) {
  //       if (err) return console.log(err);
  //     //console.log("Data has been written in the file");
  // });
  jobs = jobsData.jobQue;
  console.log("jobs");

  console.log(jobs);

  console.log(orgJobQFile);
  orgData = fs.readFileSync(orgFile);
  orgData = JSON.parse(orgData);
  fluentAgent.loggerIntializer(orgData.dbName);


}

module.exports.getAndDumpGitLogs = function(){
  console.log("getAndDumpGitLogs");
  console.log(jobs);
  pushJobsToExecute(jobs,gitJobExecuterWrapper).then(function(updatedJobs){
    jobsData.jobQue=updatedJobs;
    jobsData.status = "idle";
    fs.writeFile(orgJobQFile, JSON.stringify(jobsData, null, '\t'), function(err) {
          if (err) return console.log(err);
        //console.log("Data has been written in the file");
    });
  });

}
