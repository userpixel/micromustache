/*global micromustache,examples*/

/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

const id = (id) => document.getElementById(id)
const createEl = (tagName) => document.createElement(tagName)
const text = (el, contents) => (el.innerText = contents)
const getVal = (el) => {
  switch (el.type) {
    case 'checkbox':
      return el.checked
    case 'number':
      return el.valueAsNumber
    default:
      return el.value
  }
}
const setVal = (el, value) => (el.value = value)
const on = (el, eventName, handler) => el.addEventListener(eventName, handler)
const onInput = (el, handler) => on(el, 'input', handler)
const fire = (el, eventName) => el.dispatchEvent(new Event(eventName))
const ready = (fn) =>
  ['complete', 'interactive'].includes(document.readyState)
    ? fn()
    : on(document, 'DOMContentLoaded', fn)

const exampleSelector = id('example-selector')
const template = id('template')
const optionsToggle = id('options-toggle')
const options = id('options')
const templateError = id('template-error')
const scope = id('scope')
const scopeError = id('scope-error')
const result = id('result')
const resultError = id('result-error')

// Runs a function showing its results or errors in appropriate DOM elements
function runFn(successEl, errorEl, fn) {
  if (typeof fn !== 'function') {
    throw new TypeError(`Expected a function. Got ${fn}`)
  }
  try {
    const result = fn()
    successEl.classList.remove('error')
    text(errorEl, '')
    return result
  } catch (err) {
    successEl.classList.add('error')
    text(errorEl, '⛔ ' + err)
  }
}

function render() {
  console.log('Render', getVal(id('validatePath')))
  // Handle the template errors
  const renderer = runFn(template, templateError, () =>
    micromustache.compile(getVal(template), {
      validatePath: getVal(id('validatePath')),
      validateRef: getVal(id('validateRef')),
      explicit: getVal(id('explicit')),
      maxPathLen: getVal(id('maxPathLen')),
      maxRefDepth: getVal(id('maxRefDepth')),
      tags: [getVal(id('tags0')), getVal(id('tags1'))],
    })
  )
  // Handle the scope errors
  const scopeObj = runFn(scope, scopeError, () => JSON.parse(getVal(scope)))

  if (!renderer || !scopeObj) {
    return text(result, '')
  }

  // If all is well try to generate the results handling the errors
  text(
    result,
    runFn(result, resultError, () => renderer.render(scopeObj))
  )
}

ready(() => {
  examples.forEach((example, i) => {
    const option = createEl('option')
    text(option, example.name)
    setVal(option, i)
    exampleSelector.appendChild(option)
  })

  onInput(optionsToggle, () => (options.hidden = !optionsToggle.checked))
  onInput(scope, render)
  onInput(template, render)
  onInput(id('validatePath'), render)
  onInput(id('validateRef'), render)
  onInput(id('explicit'), render)
  onInput(id('maxPathLen'), render)
  onInput(id('maxRefDepth'), render)
  onInput(id('tags0'), render)
  onInput(id('tags1'), render)

  onInput(exampleSelector, () => {
    const example = examples[getVal(exampleSelector)]
    setVal(template, example.template)
    setVal(scope, JSON.stringify(example.scope, null, 2))
    render()
  })
  fire(exampleSelector, 'input')
})
