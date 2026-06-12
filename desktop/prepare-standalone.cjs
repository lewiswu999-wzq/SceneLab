/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs")
const path = require("node:path")

const root = path.resolve(__dirname, "..")
const standalone = path.join(root, ".next", "standalone")

function replaceDirectory(source, destination) {
  if (!fs.existsSync(source)) {
    return
  }

  fs.rmSync(destination, { recursive: true, force: true })
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.cpSync(source, destination, { recursive: true })
}

replaceDirectory(path.join(root, "public"), path.join(standalone, "public"))
replaceDirectory(
  path.join(root, ".next", "static"),
  path.join(standalone, ".next", "static")
)

console.log("Prepared Next.js standalone runtime for SceneLab desktop.")
