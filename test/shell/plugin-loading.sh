#!/bin/bash

typeset __abspath=$(cd ${0%/*} && echo $PWD/${0##*/})
typeset __shelldir=`dirname "${__abspath}"`
typeset __testdir=`dirname "${__shelldir}"`

export HOME="${__testdir}/fixtures/home_with_loadable_plugin"

function _avn() {
  :
}

source "${__shelldir}/helpers.sh"
source "${__testdir}/../bin/avn.sh"

assertEqual "loadable plugin was loaded" "${plugin_message}" || exit 1
