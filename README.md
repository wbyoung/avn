# avn

[![NPM version][npm-image]][npm-url] [![Build status][travis-image]][travis-url] [![Code Climate][codeclimate-image]][codeclimate-url] [![Coverage Status][coverage-image]][coverage-url] [![Dependencies][david-image]][david-url] [![devDependencies][david-dev-image]][david-dev-url]

Automatic Version Switching for Node.js

## Install

``` bash
npm install -g avn avn-nvm avn-n avn-nodebrew
avn setup
```

Now when you `cd` into a directory with a `.node-version` file, `avn` will
automatically detect the change and use your installed version manager to
switch to that version of node.


## Plugins

`avn` supports [`nvm`][nvm], [`n`][n] and [`nodebrew`][nodebrew] through
[`avn-nvm`][avn-nvm], [`avn-n`][avn-n] and [`avn-nodebrew`][avn-nodebrew].

We don't recommend using both tools to manage your versions of node, but feel
free to install both plugins. They won't conflict with each other.


## io.js

Plugins support a consistent syntax in the `.node-version` file for specifying
the use of [io.js][io.js] rather than node. Simply add an `iojs` prefix. For
instance: `iojs-1.4` or `iojs-v1.4`.


## Todo List

 * Support switching back to the previous version of node that you were using
   when you leave a directory.

Pull requests are welcome!


## Troubleshooting

If you're having a problem, please `cd` to the directory where your
`.node-version` file is stored and run (note the double-underscore prefix):

```bash
__avn_debug
```

Create an [issue][issues] and include the output.

Also note that the `avn setup` command will only work with the version of node
with which you installed it. If you install and then switch your node version,
you'll get an error that `avn` can't be found. This is okay, but if you need to
run the setup command again, simply `npm install -g avn` to get a new copy for
your current node version.


## License

This project is distributed under the MIT license.


[travis-image]: http://img.shields.io/travis/wbyoung/avn.svg?style=flat
[travis-url]: http://travis-ci.org/wbyoung/avn
[npm-image]: http://img.shields.io/npm/v/avn.svg?style=flat
[npm-url]: https://npmjs.org/package/avn
[codeclimate-image]: http://img.shields.io/codeclimate/github/wbyoung/avn.svg?style=flat
[codeclimate-url]: https://codeclimate.com/github/wbyoung/avn
[coverage-image]: http://img.shields.io/coveralls/wbyoung/avn.svg?style=flat
[coverage-url]: https://coveralls.io/r/wbyoung/avn
[david-image]: http://img.shields.io/david/wbyoung/avn.svg?style=flat
[david-url]: https://david-dm.org/wbyoung/avn
[david-dev-image]: http://img.shields.io/david/dev/wbyoung/avn.svg?style=flat
[david-dev-url]: https://david-dm.org/wbyoung/avn#info=devDependencies

[issues]: https://github.com/wbyoung/avn/issues
[nvm]: https://github.com/creationix/nvm
[n]: https://github.com/visionmedia/n
[nodebrew]: https://github.com/hokaccha/nodebrew
[avn-nvm]: https://github.com/wbyoung/avn-nvm
[avn-n]: https://github.com/wbyoung/avn-n
[avn-nodebrew]: https://github.com/kuy/avn-nodebrew
[io.js]: https://iojs.org/
