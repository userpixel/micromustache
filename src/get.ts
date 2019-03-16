import { isValidScope, isString, assert } from './util'

export type Paths = string[]

const quoteChars = '\'"`'

function isQuote(str: string): boolean {
  return quoteChars.indexOf(str) !== -1
}

/**
 * Trim and remove the starting dot if it exists
 * @param rawPath - the raw path like ".a" or " . a"
 * @return - the input trimmed and without a leading dot
 */
function normalizePath(rawPath: string) {
  const path = rawPath.trim()
  if (path.startsWith('.')) {
    return path.substr(1)
  }
  return path
}

export function unquote(value: string): string {
  const key = value.trim()
  // in our algorithms key is always a string and never only a string of spaces
  const firstChar = key.charAt(0)
  const lastChar = key.substr(-1)
  if (isQuote(firstChar) || isQuote(lastChar)) {
    assert(
      key.length >= 2 && firstChar === lastChar,
      SyntaxError,
      'Invalid or unexpected token',
      key
    )
    return key.substring(1, key.length - 1)
  }

  // Normalize leading plus from numerical indices
  if (firstChar === '+') {
    return key.substr(1)
  }

  return key
}

function pushString(str: string, strArr: string[]) {
  str = normalizePath(str)
  if (str !== '') {
    const splitPath = str.split('.')
    for (const p of splitPath) {
      const sTrimmed = p.trim()
      assert(
        sTrimmed !== '',
        SyntaxError,
        'Unexpected token. Encountered empty path when parsing',
        str
      )
      strArr.push(sTrimmed)
    }
  }
}

export function toPath(path: string): Paths {
  assert(isString(path), TypeError, 'Path must be a string but. Got', path)

  path = normalizePath(path)
  if (path === '') {
    return []
  }

  let openBracketIndex: number
  let closeBracketIndex: number = 0
  let beforeBracket: string
  let varName: string

  const ret: Paths = []

  for (
    let currentIndex = 0;
    currentIndex < path.length;
    currentIndex = closeBracketIndex
  ) {
    openBracketIndex = path.indexOf('[', currentIndex)
    if (openBracketIndex === -1) {
      break
    }

    closeBracketIndex = path.indexOf(']', openBracketIndex)
    assert(
      closeBracketIndex !== -1,
      SyntaxError,
      'Missing',
      ']',
      'in path',
      path
    )

    varName = path.substring(openBracketIndex + 1, closeBracketIndex).trim()

    assert(!varName.includes('['), SyntaxError, 'Missing', ']', 'in path', path)

    closeBracketIndex++
    beforeBracket = path.substring(currentIndex, openBracketIndex)
    pushString(beforeBracket, ret)

    assert(varName.length, SyntaxError, 'Unexpected token', ']')
    ret.push(unquote(varName))
  }

  const rest = path.substring(closeBracketIndex)
  pushString(rest, ret)

  return ret
}

// tslint:disable-next-line ban-types
export type Scope = {} | Function

/**
 * Similar to lodash _.get()
 *
 * Differences with JavaScript:
 * No support for keys that include `[` or `]`.
 * No support for keys that include `'` or `"` or `.
 * `foo[bar]` is allowed while JavaScript treats `bar` as a variable and tries to lookup
 * its value or throws a `ReferenceError` if there is no variable called `bar`.
 * @throws TypeError if the object variable is not an object
 * @param scope - the scope object
 * @param path - the variable path to lookup
 * @returns - the value or undefined. If path or scope are undefined or scope is null the result is always undefined.
 */
export function get(scope: Scope, path: string): any {
  assert(
    isValidScope(scope),
    TypeError,
    'The scope should be an object or function but is',
    typeof scope,
    scope
  )
  const pathArr = toPath(path)
  return getKeys(scope, pathArr)
}

/**
 * Same as get() but expects an array of keys instead of the path string.
 * @throws ReferenceError if the scope does not contain the keys in the pathArr
 * parameter and the `allowInvalidPaths` is set to false
 * @param scope - an object to resolve value from
 * @param pathArr - an array of keys that specify the path to the lookup
 * @param allowInvalidPaths - should we throw if we cannot resolve the path in
 * the provided scope? (defaults to true)
 * @returns - the value or undefined. If path or scope are undefined or scope is
 * null the result is always undefined.
 */
export function getKeys(
  scope: Scope,
  pathArr: Paths,
  allowInvalidPaths?: boolean
): any {
  let currentScope = scope
  for (const key of pathArr) {
    if (isValidScope(currentScope)) {
      // @ts-ignore
      currentScope = currentScope[key]
    } else if (allowInvalidPaths) {
      return
    } else {
      throw new ReferenceError(
        key + ' is not defined in the scope. Parsed path: ' + pathArr
      )
    }
  }
  return currentScope
}
