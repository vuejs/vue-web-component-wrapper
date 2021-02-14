/* global test expect el els */
const launchPage = require('./setup')

/* global el, els, MyElement */

test('properties', async () => {
  const { page } = await launchPage(`properties`)

  // props proxying: get
  const foo = await page.evaluate(() => el.foo)
  expect(foo).toBe(123)

  // get camelCase
  const someProp = await page.evaluate(() => el.someProp)
  expect(someProp).toBe('bar')

  // props proxying: set
  await page.evaluate(() => {
    el.foo = 234
    el.someProp = 'lol'
  })
  const newFoo = await page.evaluate(() => el.vueComponent.foo)
  expect(newFoo).toBe(234)
  const newBar = await page.evaluate(() => el.vueComponent.someProp)
  expect(newBar).toBe('lol')
})

test('attributes', async () => {
  const { page } = await launchPage(`attributes`)

  // boolean
  const foo = await page.evaluate(() => el.foo)
  expect(foo).toBe(true)

  // boolean="true"
  const bar = await page.evaluate(() => el.bar)
  expect(bar).toBe(true)

  // absence of boolean with default: true
  const baz = await page.evaluate(() => el.baz)
  expect(baz).toBe(true)

  // boolean="false" with default: true
  const qux = await page.evaluate(() => el.qux)
  expect(qux).toBe(false)

  // some-number="123"
  const someNumber = await page.evaluate(() => el.someNumber)
  expect(someNumber).toBe(123)

  // set via attribute
  await page.evaluate(() => {
    el.setAttribute('foo', 'foo')
    el.setAttribute('bar', 'false')
    el.setAttribute('baz', 'false')
    el.setAttribute('qux', '')
    el.setAttribute('some-number', '234')
  })

  // boolean="boolean"
  expect(await page.evaluate(() => el.foo)).toBe(true)
  expect(await page.evaluate(() => el.bar)).toBe(false)
  expect(await page.evaluate(() => el.baz)).toBe(false)
  expect(await page.evaluate(() => el.qux)).toBe(true)
  expect(await page.evaluate(() => el.someNumber)).toBe(234)
})

test('events', async () => {
  const { page } = await launchPage(`events`)
  await page.evaluate(() => {
    el.shadowRoot.querySelector('button').click()
  })
  expect(await page.evaluate(() => window.emitted)).toBe(true)
  expect(await page.evaluate(() => window.emittedDetail)).toEqual([123])
})

test('slots', async () => {
  const { page } = await launchPage(`slots`)

  const content = await page.evaluate(() => {
    return el.shadowRoot.querySelector('div').innerHTML
  })
  expect(content).toMatch(`<div>default</div><div>foo</div>`)

  // update slots
  await page.evaluate(() => {
    el.innerHTML = `<div>default2</div><div slot="foo">foo2</div>`
  })
  const newContent = await page.evaluate(() => {
    return el.shadowRoot.querySelector('div').innerHTML
  })
  expect(newContent).toMatch(`<div>default2</div><div>foo2</div>`)
})

test('lifecycle', async () => {
  const { page, logs } = await launchPage(`lifecycle`)

  expect(logs).toContain('created')
  expect(logs).toContain('mounted')

  await page.evaluate(() => {
    el.parentNode.removeChild(el)
  })
  expect(logs).toContain('deactivated')

  await page.evaluate(() => {
    document.body.appendChild(el)
  })
  expect(logs).toContain('activated')
})

test('async', async () => {
  const { page } = await launchPage(`async`)

  // should not be ready yet
  expect(await page.evaluate(() => els[0].shadowRoot.querySelector('div'))).toBe(null)
  expect(await page.evaluate(() => els[1].shadowRoot.querySelector('div'))).toBe(null)

  // wait until component is resolved
  await new Promise(resolve => {
    page.on('console', msg => {
      if (msg.text() === 'resolved') {
        resolve()
      }
    })
  })

  // both instances should be initialized
  expect(await page.evaluate(() => els[0].shadowRoot.textContent)).toMatch(`123 bar`)
  expect(await page.evaluate(() => els[1].shadowRoot.textContent)).toMatch(`234 baz`)

  // attribute sync should work
  await page.evaluate(() => {
    els[0].setAttribute('foo', '345')
  })
  expect(await page.evaluate(() => els[0].shadowRoot.textContent)).toMatch(`345 bar`)

  // new instance should work
  await page.evaluate(() => {
    const newEl = document.createElement('my-element')
    newEl.setAttribute('foo', '456')
    document.body.appendChild(newEl)
  })
  expect(await page.evaluate(() => {
    return document.querySelectorAll('my-element')[2].shadowRoot.textContent
  })).toMatch(`456 bar`)
})

test('mounting manually', async () => {
  const { page, logs } = await launchPage(`mounting-manually`)

  // mounting programmatically
  await page.evaluate(() => {
    window.el = new MyElement()
    window.el.foo = 234
    window.el.setAttribute('some-prop', 'lol')
    window.el.someProp = 'ignored as attribute takes precedence'
    document.body.appendChild(window.el)
  })

  // props
  const foo = await page.evaluate(() => el.vueComponent.foo)
  expect(foo).toBe(234)
  const bar = await page.evaluate(() => el.vueComponent.someProp)
  expect(bar).toBe('lol')

  // lifecycle
  expect(logs).toContain('mounted with foo: 234')
  expect(logs).toContain('mounted with someProp: lol')
})
