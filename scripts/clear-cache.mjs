import { rmSync } from 'fs'
import { join } from 'path'

const root = join(import.meta.dirname, '..')
const dirs = ['.next', '.turbo']

for (const dir of dirs) {
  const p = join(root, dir)
  try {
    rmSync(p, { recursive: true, force: true })
    console.log(`Deleted ${dir}`)
  } catch {
    console.log(`${dir} not found, skipping`)
  }
}
console.log('Cache cleared! Restart dev server.')
