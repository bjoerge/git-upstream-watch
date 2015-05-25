var check = require("./check");
var notifier = require('node-notifier');
var debug = require('debug')('git-upstream-watch');
var defaults = require('defaults');

var NOTIFICATION_IMAGE = require.resolve('./git-icon.png');

function createNotifier(options) {
  var prevNotifyTime = 0;
  var prevCommit = null;

  var interval = options.interval || 0;
  var always = options.always;

  debug("Creating notifier: %o", options)

  return function notify(status) {
    var now = new Date().getTime();
    var latestCommit = status.commits[0].hash;

    var enoughTimeHasPassed = !prevNotifyTime || (now - prevNotifyTime) > interval;
    var newCommits = !prevCommit || prevCommit !== latestCommit;

    var show = enoughTimeHasPassed && (newCommits || always)

    debug("Notify? %s. enoughTimeHasPassed=%s, newCommits=%s, always=%s", show, enoughTimeHasPassed, newCommits, always)

    if (show) {
      prevNotifyTime = now;
      prevCommit = latestCommit;
      notifier.notify(createNotification(status))
    }
  }
}

function createNotification(status) {
  var commits = status.commits;
  var latest = commits[0];

  var message = 'Branches has diverged with ' + commits.length + ' commits. ' +
    'Latest was ' + latest.timeSince + ' by ' + latest.author + ": " + latest.subject;

  return {
    title: status.local + " out of sync with " + status.remote,
    message: message,
    icon: NOTIFICATION_IMAGE
  }
}

var DEFAULT_OPTIONS = {
  cwd: process.cwd,
  always: false,
  checkInterval: 0,
  notifyInterval: 30
};

module.exports = function upstreamWatch(opts) {
  opts = defaults(opts, DEFAULT_OPTIONS);

  var cwd = opts.cwd;
  var checkInterval = opts.checkInterval * 1000;
  var notifyInterval = opts.notifyInterval * 1000;

  var notify = createNotifier({
    always: opts.always,
    interval: notifyInterval
  });

  if (opts.checkInterval) {
    function tick() {
      check(cwd, function (err, status) {
        onCheck(err, status);
        setTimeout(tick, checkInterval)
      })
    }
    return tick();
  }

  check(cwd, onCheck);

  function onCheck(err, status) {
    if (err) {
      return debug('Check failed: ', err);
    }

    if (status.commits.length) {
      notify(status)
    }
  }

};

