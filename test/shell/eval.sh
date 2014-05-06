#!/bin/bash

typeset __abspath=$(cd ${0%/*} && echo $PWD/${0##*/})
typeset __shelldir=`dirname "${__abspath}"`
typeset __testdir=`dirname "${__shelldir}"`
typeset __tmp=`mktemp /tmp/avn-test.XXXXXX`
typeset __written=""

# start in a known location
cd "${__testdir}/examples/home"

# what _avn writes to fd 3 should be eval'd by the cd
function _avn() {
  echo "echo $1 >> ${__tmp}; export AVN_LAST_DIR=${@: -1};" >&3
}

source "${__shelldir}/helpers.sh"
source "${__testdir}/../bin/avn.sh"
cd "${__testdir}/examples/v0.11.13"
__written=`echo $(cat ${__tmp})`

assertEqual `pwd` "${__testdir}/examples/v0.11.13" || exit 1
assertEqual "${AVN_LAST_DIR}" "${__testdir}/examples/v0.11.13" || exit 1
assertEqual "after-cd" "${__written}" || exit 1

rm ${__tmp}
