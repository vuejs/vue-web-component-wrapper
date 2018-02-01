const puppeteer = require('puppeteer')
const { createServer } = require('http-server')

const port = 3000
const puppeteerOptions = process.env.CI
  ? { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
  : {}

let browser, server

async function launchPage (name) {
  const url = `http://localhost:${port}/test/fixtures/${name}.html`
  const page = await browser.newPage()
  const logs = []
  const ready = new Promise(resolve => {
    page.on('console', msg => {
      logs.push(msg.text())
      if (msg.text() === `ready`) resolve()
    })
  })
  await page.goto(url)
  await ready
  return { browser, page, logs }
}

beforeAll(async () => {
  browser = await puppeteer.launch(puppeteerOptions)
  server = createServer({ root: process.cwd() })
  await new Promise((resolve, reject) => {
    server.listen(port, err => {
      if (err) return reject(err)
      resolve()
    })
  })
})

afterAll(async () => {
  await browser.close()
  server.close()
})

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
  const newFoo = await page.evaluate(()  => el.vueComponent.foo)
  expect(newFoo).toBe(234)
  const newBar = await page.evaluate(()  => el.vueComponent.someProp)
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

  // some-number="123"
  const someNumber = await page.evaluate(() => el.someNumber)
  expect(someNumber).toBe(123)

  // set via attribute
  await page.evaluate(() => {
    el.setAttribute('foo', 'foo')
    el.setAttribute('bar', 'false')
    el.setAttribute('some-number', '234')
  })

  // boolean="boolean"
  expect(await page.evaluate(() => el.foo)).toBe(true)
  expect(await page.evaluate(() => el.bar)).toBe(false)
  expect(await page.evaluate(() => el.someNumber)).toBe(234)
})

test('events', async () => {
  const { page } = await launchPage(`events`)
  await page.evaluate(() => {
    el._shadowRoot.querySelector('button').click()
  })
  expect(await page.evaluate(() => window.emitted)).toBe(true)
})

test('slots', async () => {
  const { page } = await launchPage(`slots`)

  const content = await page.evaluate(() => {
    return el._shadowRoot.querySelector('div').innerHTML
  })
  expect(content).toMatch(`<div>default</div><div>foo</div>`)

  // update slots
  await page.evaluate(() => {
    el.innerHTML = `<div>default2</div><div slot="foo">foo2</div>`
  })
  const newContent = await page.evaluate(() => {
    return el._shadowRoot.querySelector('div').innerHTML
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
