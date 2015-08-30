#!/bin/bash

typeset __abspath=$(cd ${0%/*} && echo $PWD/${0##*/})
typeset __shelldir=`dirname "${__abspath}"`
typeset __testdir=`dirname "${__shelldir}"`
typeset __tmp=`mktemp /tmp/avn-test.XXXXXX`
typeset __written=""
export HOME="${__testdir}/fixtures"

# start in a known location
cd "${__testdir}/fixtures/home"

function _avn() {
  echo "avn called" >> ${__tmp}
}

__rvm_cd_functions_set() {
  echo "rvm after" >> ${__tmp}
}

source "${__shelldir}/helpers.sh"
source "${__testdir}/../bin/avn.sh"

# test that other hooks were called before avn
cd "${__testdir}/fixtures/v0.10"
__written=`echo $(cat ${__tmp})`
assertEqual "avn called rvm after" "${__written}" || exit 1

rm ${__tmp}
