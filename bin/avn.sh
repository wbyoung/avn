function __avn_eval() {
  typeset cmd actions actions_result options

  cmd=$1
  shift

  [[ -t 1 ]] && options="--color"

  actions=$(_avn ${cmd} $options "$@" 3>&1 1>&2)
  actions_result=$?
  if [[ $actions_result -eq 0 ]]
  then
    eval "$actions"
  fi
}

function __avn_before() {
  [[ -f "`pwd`/.node-version" ]] && __avn_eval before-cd `pwd` "$@"
}

function __avn_after() {
  [[ -f "`pwd`/.node-version" ]] && __avn_eval after-cd `pwd` "$@"
}

export -a __bash_before_cd_hooks;
export -a __bash_after_cd_hooks;
export -a __bash_failed_cd_hooks;

# support rvm until wayneeseguin/rvm#2819 is fixed
if [[ ${#__bash_after_cd_hooks[@]} -eq 0 ]]
then
  if typeset -f __rvm_after_cd &>/dev/null
  then
    __bash_after_cd_hooks+=(__rvm_after_cd)
  fi
fi

__bash_before_cd_hooks+=(__avn_before)
__bash_after_cd_hooks+=(__avn_after)
__bash_failed_cd_hooks+=()

function cd() {
  typeset __hook
  typeset __result=0

  for __hook in "${__bash_before_cd_hooks[@]}"
    do "$__hook" "$@" || true
  done

  builtin cd "$@" || __result=$?

  if [[ $__result -eq 0 ]] ;
  then
    for __hook in "${__bash_after_cd_hooks[@]}"
      do "$__hook" "$@" || true
    done
  else
    for __hook in "${__bash_failed_cd_hooks[@]}"
      do "$__hook" "$@" || true
    done
  fi

  return $__result
}

export PATH="$HOME/.avn/bin:$PATH"
