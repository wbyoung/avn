#!/bin/bash

typeset __abspath=$(cd ${0%/*} && echo $PWD/${0##*/})
typeset __shelldir=`dirname "${__abspath}"`
typeset __testdir=`dirname "${__shelldir}"`
typeset __tmp=`mktemp /tmp/avn-test.XXXXXX`
typeset __written=""

# start in a known location
cd "${__testdir}/fixtures/home"

function _avn() {
  echo avn called >> ${__tmp}
}

function __other_before_cd {
  echo other before >> ${__tmp}
}

function __other_after_cd {
  echo other after >> ${__tmp}
}

function __other_failed_cd {
  echo other failed >> ${__tmp}
}

export -a __bash_before_cd_hooks; __bash_before_cd_hooks+=(__other_before_cd)
export -a __bash_after_cd_hooks;  __bash_after_cd_hooks+=(__other_after_cd)
export -a __bash_failed_cd_hooks; __bash_failed_cd_hooks+=(__other_failed_cd)


source "${__shelldir}/helpers.sh"
source "${__testdir}/../bin/avn.sh"

# test that other hooks were called & called before avn
cd "${__testdir}/fixtures/v0.10"
__written=`echo $(cat ${__tmp})`
assertEqual "other before other after avn called" "${__written}" || exit 1

# change to a directory that doesn't exist
cd "${__testdir}/fixtures/home"
echo "" > ${__tmp} # clear output
cd "/path/to/some/place/that/we/expect/never/exists" &> /dev/null
__written=`echo $(cat ${__tmp})`
assertEqual "other before other failed" "${__written}" || exit 1

rm ${__tmp}
