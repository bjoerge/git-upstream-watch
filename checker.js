var exec = require('child_process').exec;
var events = require('events');
var util = require("util");
var async = require("async");
var xtend = require("xtend");

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
      _this.emit("error", null);
      return cb(null, null);
    }
    var event = {branch: local, remote: remote, path: _this.path};
    _this.emit('fetch', event);
    exec('git fetch origin', {cwd: _this.path, timeout: 1000*60*5}, function() {
      _this.emit('check', event);
      execWithCwd("git log --pretty=format:'%H;%an;%cr;%s' --numstat "+local+"..."+remote, function() {
        var stdout = arguments[1] && arguments[1].trim();
        var commits = stdout ? parseLogLines(stdout) : [];
        var isError = !!arguments[0];
        if (isError) {
          _this.emit("error", null);
          return cb(null, null);
        }
        if (commits.length) {
          _this.emit("divergence", xtend(event, {commits: commits}));
        }
        else {
          _this.emit("inSync", event);
        }
        if (cb) cb(null, event);
      });
    });
  });
};

module.exports = UpstreamChecker;
