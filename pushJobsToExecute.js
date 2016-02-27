
var Q = require('q');

function pushJobsToExecuteSeq(jobs, jobExecuter) {
  console.log(jobs);
  var deferred = Q.defer();
  jobSeqExec(0);
  function jobSeqExec(jobIndex)
  {

    jobExecuter(jobs[jobIndex]).then(function(finishedJob){
      //console.log(jobs);
      console.log("Below job is done");
      console.log(finishedJob);
      jobs.splice(jobIndex,1);
      jobs[jobIndex] = finishedJob;


      console.log(jobs);
      if(jobIndex<jobs.length-1){
          jobSeqExec(jobIndex+1);
      }
      else {
        deferred.resolve(jobs);
      }

    }).fail(function(jobObj){
      console.log("Job execution has been failed");

      console.log("jobObjCombo");
      console.log(jobObj);
      var oldJob = jobObj.oldJob;
      var newJob = jobObj.newJob;
      console.log("This job has not been executed, hence will get executed in later Run");
      //console.log(jobs[jobIndex]);
      jobs.splice(jobIndex,1);
      console.log("++++old job");
      console.log(oldJob);

      if(oldJob != null){
        console.log("oldJob not null");
        jobs[jobIndex] = oldJob
      }
      else {
        console.log("oldJob null");
        jobs.splice(jobIndex,1);
      }
      jobs.push(newJob);

      console.log("new Job Array ==> ",jobs);
      deferred.resolve(jobs);
    });
  }
  return deferred.promise;

}


module.exports = pushJobsToExecuteSeq;
