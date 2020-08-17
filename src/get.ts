import { tokenizePath, Ref, TokenizePathOptions } from './tokenize'
import { isObj, isProp, isNum, isArr } from './utils'

export interface Scope {
  [key: string]: Scope | any
}

export interface GetOptions extends TokenizePathOptions {
  /**
   * When set to a truthy value, we throw a `ReferenceError` for invalid paths and refs.
   * - An invalid ref specifies an array of properties that does not exist in the scope.
   * - An invalid path is a string that is tokenized to an invalid ref.
   *
   * When set to a falsy value, we use an empty string for paths and refs that don't exist in the
   * scope.
   *
   * If a value does not exist in the scope, two things can happen:
   * - if `validateRef` is falsy, the value will be assumed empty string
   * - if `validateRef` is truthy, a `ReferenceError` will be thrown
   */
  readonly validateRef?: boolean
}

/**
 * Looks up the value of a given [[Ref]] in the [[Scope]]
 * It can also be used in your custom resolver functions if needed.
 *
 * @see https://github.com/userpixel/micromustache/wiki/Known-issues
 * If it cannot find a value in the specified ref, it may return undefined or throw an error
 * depending on the value of the `validateRef` option
 * @param ref the tokenized path (see [[tokenizePath]])
 * @param scope an object to resolve value from
 * @throws any error that [[tokenizePath]] may throw
 * @throws `TypeError` if the arguments have the wrong type
 * @throws `ReferenceError` if the scope does not contain the requested key and the `validateRef`
 * is set to a truthy value
 * @returns the value or undefined
 */
export function refGet(ref: Ref, scope: Scope, options: GetOptions = {}): any {
  if (!isObj(scope)) {
    throw new TypeError(`refGet() expects an object scope. Got ${typeof options}`)
  }

  if (!isObj(options)) {
    throw new TypeError(`refGet() expects an object option. Got ${typeof options}`)
  }

  if (!isArr(ref)) {
    throw new TypeError(`Expected an array ref. Got ${ref}`)
  }

  const { maxRefDepth = 10 } = options
  if (!isNum(maxRefDepth) || maxRefDepth <= 0) {
    throw new RangeError(`Expected a positive number for maxRefDepth. Got ${maxRefDepth}`)
  }

  const propNamesAsStr = () => ref.join(' > ')

  if (ref.length > maxRefDepth) {
    throw new ReferenceError(
      `The ref cannot be deeper than ${maxRefDepth} levels. Got "${propNamesAsStr()}"`
    )
  }

  let currentScope = scope
  for (const prop of ref) {
    if (isProp(currentScope, prop)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      currentScope = currentScope[prop]
    } else if (options.validateRef) {
      throw new ReferenceError(`${prop} is not defined in the scope at ref: "${propNamesAsStr()}"`)
    } else {
      // This undefined result will be stringified later according to the explicit option
      return
    }
  }
  return currentScope
}

/**
 * A useful utility function that is used internally to lookup a path in an object.
 * It can also be used in your custom resolver functions if needed.
 * Under the hood it uses [[refGet]]
 *
 * @param path the path string as it appeared in the template
 * @param scope an object to resolve value from
 * @throws any error that [[refGet]] or [[tokenizePath]] may throw
 * @returns the value or undefined
 */
export function pathGet(path: string, scope: Scope, options: GetOptions = {}): any {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return refGet(tokenizePath(path, options), scope, options)
}
