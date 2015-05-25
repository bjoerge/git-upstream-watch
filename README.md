# git-upstream-watch

Get notified when one or more local git repos diverge from the upstream tracking branch.

Divergence happens when there are local commits that aren't pushed, or when there are upstream/remote commits that aren't pulled.

# Getting started
```sh
$ npm install git-upstream-watch -g
```

# Usage (command line)
```
  Usage: git-upstream-watch [options] [directories...]

  Options:

    -h, --help                        output usage information
    -V, --version                     output the version number
    -a, --always                      Always notify about pending changes.
    -i, --check-interval [interval]   Recheck for changes in upstream branch every n seconds. If this option is given, the process will run forever
    -n, --notify-interval [interval]  Don't notify about each repo more often than every n seconds. This option will only have an effect when --check-interval is specified
```

## Examples:

### Watch local clones of node and browserify, check every 30 mins

```sh
$ git-upstream-watch node browserify --always --check--interval 1800
```

### Watch all repos found in projects directory

```sh
$ git-upstream-watch ~/projects/* --always --watch --interval 1800
```

# Usage (as a library)
```js
require("git-upstream-watch")({checkInterval: 600, notifyInterval: 300})
```
This will shedule a new upstream check every ten minutes, notifying about changes at most every 5 minutes.  

## Manually check
```js
var createChecker = require("git-upstream-watch/check");

// Check current directory

check(process.cwd, function(error, status) {
  // Diverging commits are now found in status.commits
  console.log(status)
});

```

# License

MIT