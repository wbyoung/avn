function __avn_eval() {
  typeset cmd actions actions_result options

  echo "eval with $@"
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
  echo "before checking $1/.node-version"
  [[ -f "$1/.node-version" ]] && __avn_eval before-cd "$@"
}

function __avn_after() {
  echo "after checking $1/.node-version"
  [[ -f "$1/.node-version" ]] && __avn_eval after-cd "$@"
}

function cd() {
  typeset __result=0
  __avn_before `pwd` "$@" || true
  builtin cd "$@" || __result=$?
  __avn_after `pwd` "$@" || true
  return $__result
}

export PATH="$HOME/.avn/bin:$PATH"
