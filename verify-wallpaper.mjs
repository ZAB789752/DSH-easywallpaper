// dsh-wallpaper 发布前自检：校验 dsh.client 契约、host 半边、客户端 bundle 注册与插件导出。
// 用法：node verify-wallpaper.mjs（在仓库根目录运行）
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const pkgDir = path.dirname(fileURLToPath(import.meta.url))

// 1) package.json 的 dsh.client 契约 + 客户端 bundle 存在
const pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'))
if (!pkg.dsh || pkg.dsh.client?.platform !== 'web') throw new Error('dsh.client.platform != web')
const clientRel = pkg.exports?.['./client']
if (typeof clientRel !== 'string') throw new Error('exports["./client"] missing')
const clientAbs = path.join(pkgDir, clientRel)
if (!fs.existsSync(clientAbs)) throw new Error('client bundle missing: ' + clientAbs)
console.log('1) dsh.client contract OK ->', clientRel)

// 2) host 半边可加载且导出 apply
const host = await import(pathToFileURL(path.join(pkgDir, 'index.js')))
if (typeof host.apply !== 'function') throw new Error('host apply missing')
console.log('2) host half OK ->', Object.keys(host))

// 3) 模拟浏览器加载 bundle：应通过 window.__ModuleLoader__.load 注册，导出 default 插件
let handoff = null
globalThis.window = { __ModuleLoader__: { load: (h) => { handoff = h } } }
const reactStub = { useState: () => [null, () => {}], useEffect: () => {}, createElement: () => ({}) }
const requireStub = (spec) => {
  if (spec === 'react') return reactStub
  throw new Error('unexpected require: ' + spec)
}
const code = fs.readFileSync(clientAbs, 'utf8')
new Function('window', code)(globalThis.window) // eslint-disable-line no-new-func
if (!handoff) throw new Error('bundle did not register via __ModuleLoader__.load')
if (handoff.id !== pkg.name) throw new Error('handoff id mismatch: ' + handoff.id)
const plugin = handoff.factory(requireStub).default
if (!plugin || typeof plugin.apply !== 'function') throw new Error('default export is not a plugin')
if (!Array.isArray(plugin.inject) || !plugin.inject.includes('slots') || !plugin.inject.includes('theme')) {
  throw new Error('plugin.inject must declare slots and theme: ' + JSON.stringify(plugin.inject))
}
console.log('3) client bundle handoff OK ->', handoff.id, '| inject =', JSON.stringify(plugin.inject))
console.log('ALL CHECKS PASSED')
