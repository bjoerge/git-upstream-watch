var exec = require('child_process').exec;
var events = require('events');
var util = require("util");
var async = require("async");

/**
 * Parses stdout from the git log command issued below and turns it into a more manageable js object
 * @param logOutput
 * @return {Object} an object representing the divergence
 */
var parseLogLines = function(logOutput) {
  var commits = logOutput.split("\n\n");
  return commits.map(function(commit) {
    var lines = commit.split("\n");
    var info = lines[0].split(";");
    var diffLines = lines.slice(1);
    var meta = {hash: info[0], author: info[1], timeSince: info[2], subject: info[3]};
    meta.fileStats = diffLines.map(function(line){
      var stats = line.split(/\s+/);
      return {filename: stats[2], added: stats[0], deleted: stats[1]}
    });
    return meta;
  })
};
/**
 * Creates a new upstream branch checker for a given path
 */
function UpstreamChecker(path) {
  this.path = path;
  events.EventEmitter.call(this);
}
util.inherits(UpstreamChecker, events.EventEmitter);

/**
 * Check for changes in upstream branch.
 * Emits the 'divergence' event if any divergence between local and upstream branch are found.
 * @param cb callback to invoke when check is done
 */
UpstreamChecker.prototype.check = function(cb) {
  console.log();
  console.log("Checking "+this.path);
  var _this = this;
  var execWithCwd = function(cmd, cb) {
    return exec(cmd, {cwd: _this.path}, cb);
  };
  async.map(['git rev-parse --abbrev-ref HEAD', 'git rev-parse --symbolic-full-name --abbrev-ref @{u}'], execWithCwd, function(err, results) {
    var local = results[0] && results[0].trim();
    var remote = results[1] && results[1].trim();
    if (!(local && remote)) {
      if (!local) console.warn("\t? \033[31mDon't know which local branch to use in "+_this.path+"\033[0m");
      if (!remote) console.warn("\t? \033[31mDon't know which upstream branch to fetch in "+_this.path+"\033[0m");
      return cb(null, null);
    }
    console.log("\t· Fetching origin in "+_this.path+", please hang on...");
    exec('git fetch origin', {cwd: _this.path, timeout: 1000*60*5}, function() {
      console.log("\t· Checking "+local+" against "+remote+" in "+_this.path);
      execWithCwd("git log --pretty=format:'%H;%an;%cr;%s' --numstat "+local+"..."+remote, function() {
        var stdout = arguments[1] && arguments[1].trim();
        var data = stdout ? {branch: local, remote: remote, commits: parseLogLines(stdout) } : null;
        // todo: check stderr and emit "error" / cb(err, null)
        if (data) {
          console.log("\t! \033Divergence of "+data.commits.length+" commits between "+local+" and "+remote+"\033[0m");
          _this.emit("divergence", data);
        }
        else {
          console.log("\t✓ \033[32mLocal branch "+local+" is up to date with upstream branch "+remote+"\033[0m");
        }
        cb(null, data);
      });
    });
  });
};

module.exports = UpstreamChecker;