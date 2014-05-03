# avn

[![NPM version][npm-image]][npm-url] [![Build status][travis-image]][travis-url] [![Code Climate][codeclimate-image]][codeclimate-url] [![Coverage Status][coverage-image]][coverage-url] [![Dependencies][david-image]][david-url]

Automatic Version Switching for Node

## Install

``` bash
npm install avn avn-n avn-nvm
avn setup
```

Now when you `cd` into a directory with a `.node-version` file, `avn` will
automatically detect the change and use your installed version manager to
switch to that version of node.


## Plugins

`avn` supports both [`nvm`][nvm] and [`n`][n] through [`avn-nvm`][avn-nvm] and
[`avn-n`][avn-n].

We don't recommend using both tools to manage your versions of `node`, but feel
free to install both plugins. They won't conflict with each other.


## Unsupported Functionality

Currently `avn` doesn't switch back to the previous version of `node` that you
were using when you leave a directory. Pull requests are welcome!


## Troubleshooting

If you're having a problem, please `cd` to the directory where your
`.node-version` file is stored and run `_avn explain -v .`, then create an
[issue][issues] and include the output.

You shouldn't run into problems with this, but the `avn` command will only be
available when you're using the node version you originally installed it with.
Everything should continue to work fine, though.


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
[n]: https://github.com/visionmedia/n
[nvm]: https://github.com/creationix/nvm
[avn-nvm]: https://github.com/wbyoung/avn-nvm
[avn-n]: https://github.com/wbyoung/avn-n
