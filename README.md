# avn

[![NPM version][npm-image]][npm-url] [![Build status][travis-image]][travis-url] [![Code Climate][codeclimate-image]][codeclimate-url] [![Coverage Status][coverage-image]][coverage-url] [![Dependencies][david-image]][david-url]

Automatic Version Switching for Node.js

## Install

``` bash
npm install -g avn avn-nvm avn-n
avn setup
```

Now when you `cd` into a directory with a `.node-version` file, `avn` will
automatically detect the change and use your installed version manager to
switch to that version of node.


## Plugins

`avn` supports both [`nvm`][nvm] and [`n`][n] through [`avn-nvm`][avn-nvm] and
[`avn-n`][avn-n].

We don't recommend using both tools to manage your versions of node, but feel
free to install both plugins. They won't conflict with each other.


## Todo List

 * Add test coverage.
 * Improve compatibility with `rvm` and other tools that override `cd`.
 * Support switching back to the previous version of node that you were using
   when you leave a directory.

Pull requests are welcome!


## Troubleshooting

If you're having a problem, please `cd` to the directory where your
`.node-version` file is stored and run (note the underscore prefix):

```bash
_avn explain -v .
```

Create an [issue][issues] and include the output.

Also note that the `avn setup` command will only work with the version of node
with which you installed it. If you install and then switch your node version,
you'll get an error that `avn` can't be found. This is okay, but if you need to
run the setup command again, simply `npm install -g avn` to get a new copy for
your current node version.


## License

This project is distributed under the MIT license.


[travis-url]: http://travis-ci.org/wbyoung/avn
[travis-image]: https://secure.travis-ci.org/wbyoung/avn.png?branch=master
[npm-url]: https://npmjs.org/package/avn
[npm-image]: https://badge.fury.io/js/avn.png
[codeclimate-image]: https://codeclimate.com/github/wbyoung/avn.png
[codeclimate-url]: https://codeclimate.com/github/wbyoung/avn
[coverage-image]: https://coveralls.io/repos/wbyoung/avn/badge.png
[coverage-url]: https://coveralls.io/r/wbyoung/avn
[david-image]: https://david-dm.org/wbyoung/avn.png?theme=shields.io
[david-url]: https://david-dm.org/wbyoung/avn

[issues]: https://github.com/wbyoung/avn/issues
[nvm]: https://github.com/creationix/nvm
[n]: https://github.com/visionmedia/n
[avn-nvm]: https://github.com/wbyoung/avn-nvm
[avn-n]: https://github.com/wbyoung/avn-n
