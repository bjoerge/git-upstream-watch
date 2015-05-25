var exec = require('child_process').exec;

/**
 * Parses stdout from the git log command issued below and turns it into a more manageable js object
 * @param string
 * @return {Object} an object representing the divergence
 */
function parseLogLines(string) {
  var commits = string.split("\n\n").filter(Boolean);
  return commits.map(function (commit) {
    var lines = commit.split("\n");
    var info = lines[0].split(";");
    var diffLines = lines.slice(1);
    var meta = {hash: info[0], author: info[1], timeSince: info[2], subject: info[3]};
    meta.fileStats = diffLines.map(function (line) {
      var stats = line.split(/\s+/);
      return {filename: stats[2], added: stats[0], deleted: stats[1]}
    });
    return meta;
  })
}

module.exports = function getDiffs(path, callback) {

  function getBranch(type, callback) {
    var cmd = type === 'local' ? 'git rev-parse --abbrev-ref HEAD' : 'git rev-parse --symbolic-full-name --abbrev-ref @{u}'
    exec(cmd, {cwd: path}, function (err, res) {
      res = res.trim();
      if (!err && !res) {
        return callback(new Error("Could not resolve " + type + " git branch from " + path))
      }
      callback(err, res);
    })
  }

  function fetchOrigin(callback) {
    exec('git fetch origin', {cwd: path, timeout: 1000 * 60 * 5}, callback);
  }

  function getDiffCommits(local, remote, callback) {
    exec("git log --pretty=format:'%H;%an;%cr;%s' --numstat " + local + "..." + remote, {cwd: path}, callback);
  }

  getBranch('remote', function (err, remote) {
    if (err) {
      return callback(err)
    }
    getBranch('local', function (err, local) {
      if (err) {
        return callback(err)
      }
      fetchOrigin(function (err, res) {
        if (err) {
          return callback(err);
        }
        getDiffCommits(local, remote, function (err, commits) {
          if (err) {
            return callback(err);
          }
          callback(null, {
            local: local,
            remote: remote,
            commits: parseLogLines(commits)
          });
        })
      })
    })
  })
};
