import { ICompilerOptions, compile } from './compile'
import { Scope } from './get'
import { Template, TagFn } from './tokenize'

/**
 * Replaces every {{variable}} inside the template with values provided by scope.
 *
 * @param template The template containing one or more {{variableNames}} every variable
 * names that is used in the template. If it's omitted, it'll be assumed an empty object.
 * @param scope An object containing values for every variable names that is used in the template.
 * If it's omitted, it'll be set to an empty object essentially removing all {{varName}}s from the template.
 * @param options compiler options
 * @returns Template where its variable names replaced with corresponding values.
 * If a value is not found or is invalid, it will be assumed empty string ''.
 * If the value is an object itself, it'll be stringified by JSON.
 * In case of a JSON stringify error the result will look like "{...}".
 */
export function render(
  template: Template,
  scope?: Scope,
  options?: ICompilerOptions
): string {
  return compile(template, options).render(scope)
}

export async function asyncRender(
  template: Template,
  scope?: Scope,
  options?: ICompilerOptions
): Promise<string> {
  return compile(template, options).asyncRender(scope)
}

export function renderTag(
  scope: Scope,
  options: ICompilerOptions
): TagFn<string> {
  return function tag(strings: string[], ...values: any): string {
    return render({ strings, values }, scope, options)
  }
}

export function asyncRenderTag(
  scope: Scope,
  options: ICompilerOptions
): TagFn<Promise<string>> {
  return function tag(strings: string[], ...values: any): Promise<string> {
    return asyncRender({ strings, values }, scope, options)
  }
}
