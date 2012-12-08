# git-upstream-watch

Get notified when one or more local git repos diverge from the upstream tracking branch.

Divergence happens when there are local commits that aren't pushed, or when there are upstream/remote commits that aren't pulled.

# Getting started
```sh
$ npm install git-upstream-watch -g
```

# Usage (command line)
```
  Usage: git-upstream-watch repodir1 [repodir2, ...] [options]

  Options:

    -h, --help                       output usage information
    -V, --version                    output the version number
    -a, --always                     Always notify about pending changes
    -w, --watch                      Keep checking upstream branch at regular intervals
    -n, --notifyinterval [interval]  Don't notify about each repo more often than every n seconds
    -i, --interval [interval]        Recheck for changes in upstream branch every n seconds
    -c, --command [command]          Command to execute in repo dir when divergence is found. I.e. "git pull"
```

Instead of listing each repodir, wildcard paths/glob strings are supported.

## Examples:

### Watch local clones of node and browserify, check every 30 mins

```sh
$ git-upstream-watch node browserify --always --watch --interval 1800
```

### Watch all repos found in projects directory

```sh
$ git-upstream-watch ~/projects --always --watch --interval 1800
```

### Execute git pull in repo dir when divergence is detected

```sh
$ git-upstream-watch ~/projects --command "git pull"
```

# Usage (as a library)
```js

var UpstreamChecker = require("git-upstream-watch");
checker = new UpstreamChecker("/path/to/my/local/clone");

// Check once every 10 minutes
setInterval(function() { checker.check() }, 10*60*1000);

checker.on("divergence", function(data) {
  console.log("Detected a divergence of "+data.commits.length+" commits between local and upstream branch");
  console.log(JSON.stringify(data));
});

```

# License

MIT