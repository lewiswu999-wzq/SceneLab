/* eslint-disable @typescript-eslint/no-require-imports */
const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  safeStorage,
  shell,
  utilityProcess,
} = require("electron")
const fs = require("node:fs")
const http = require("node:http")
const net = require("node:net")
const path = require("node:path")

const HOST = "127.0.0.1"
const FIRST_PORT = 3210
const DEV_URL = process.env.SCENELAB_DEV_URL || "http://localhost:3000"

let mainWindow
let serverProcess

function apiSettingsPath() {
  return path.join(app.getPath("userData"), "api-settings.bin")
}

function validateApiSettings(value) {
  const provider = (candidate) => ({
    apiKey: String(candidate?.apiKey ?? "").trim().slice(0, 4096),
    baseUrl: String(candidate?.baseUrl ?? "").trim().slice(0, 2048),
    model: String(candidate?.model ?? "").trim().slice(0, 512),
  })

  return {
    deepseek: provider(value?.deepseek),
    jimeng: provider(value?.jimeng),
  }
}

function registerApiSettingsHandlers() {
  ipcMain.handle("api-settings:load", () => {
    const settingsFile = apiSettingsPath()
    if (!fs.existsSync(settingsFile) || !safeStorage.isEncryptionAvailable()) {
      return null
    }
    try {
      return JSON.parse(safeStorage.decryptString(fs.readFileSync(settingsFile)))
    } catch (error) {
      writeLog(`api settings load failed: ${error instanceof Error ? error.message : String(error)}`)
      return null
    }
  })

  ipcMain.handle("api-settings:save", (_event, value) => {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error("Windows 加密存储当前不可用。")
    }
    const encrypted = safeStorage.encryptString(JSON.stringify(validateApiSettings(value)))
    fs.writeFileSync(apiSettingsPath(), encrypted)
  })

  ipcMain.handle("api-settings:clear", () => {
    fs.rmSync(apiSettingsPath(), { force: true })
  })
}

function writeLog(message) {
  const timestamp = new Date().toISOString()
  fs.appendFileSync(
    path.join(app.getPath("userData"), "desktop.log"),
    `[${timestamp}] ${message}\n`
  )
}

function canListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.unref()
    server.once("error", () => resolve(false))
    server.listen(port, HOST, () => {
      server.close(() => resolve(true))
    })
  })
}

async function findAvailablePort() {
  for (let port = FIRST_PORT; port < FIRST_PORT + 20; port += 1) {
    if (await canListen(port)) {
      return port
    }
  }
  throw new Error("SceneLab 无法找到可用的本地端口。")
}

function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now()

  return new Promise((resolve, reject) => {
    function check() {
      const request = http.get(url, (response) => {
        response.resume()
        if (response.statusCode && response.statusCode < 500) {
          resolve()
          return
        }
        retry()
      })

      request.on("error", retry)
      request.setTimeout(1500, () => request.destroy())
    }

    function retry() {
      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error("本地服务启动超时。"))
        return
      }
      setTimeout(check, 250)
    }

    check()
  })
}

async function startProductionServer() {
  const port = await findAvailablePort()
  const standaloneDirectory = path.join(process.resourcesPath, "standalone")
  const serverPath = path.join(standaloneDirectory, "server.js")

  serverProcess = utilityProcess.fork(serverPath, [], {
    cwd: standaloneDirectory,
    env: {
      ...process.env,
      HOSTNAME: HOST,
      NODE_ENV: "production",
      PORT: String(port),
    },
    stdio: "pipe",
    serviceName: "SceneLab Local Server",
  })

  serverProcess.stdout?.on("data", (data) => writeLog(`server: ${String(data).trim()}`))
  serverProcess.stderr?.on("data", (data) => writeLog(`server error: ${String(data).trim()}`))
  serverProcess.once("spawn", () => writeLog(`local server spawned on ${HOST}:${port}`))
  serverProcess.once("exit", (code) => {
    writeLog(`local server exited with code ${code}`)
    if (!app.isQuitting && code !== 0) {
      dialog.showErrorBox("SceneLab 启动失败", "本地服务意外退出，请重新启动客户端。")
    }
  })

  const url = `http://${HOST}:${port}`
  await waitForServer(url)
  return url
}

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1040,
    minHeight: 720,
    backgroundColor: "#080a0b",
    icon: path.join(__dirname, "..", "app", "favicon.ico"),
    show: false,
    title: "SceneLab",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
      sandbox: true,
    },
  })

  mainWindow.removeMenu()
  mainWindow.once("ready-to-show", () => mainWindow.show())
  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    shell.openExternal(targetUrl)
    return { action: "deny" }
  })
  mainWindow.webContents.on("will-navigate", (event, targetUrl) => {
    if (!targetUrl.startsWith(url)) {
      event.preventDefault()
      shell.openExternal(targetUrl)
    }
  })
  mainWindow.loadURL(url)
}

app.whenReady().then(async () => {
  try {
    registerApiSettingsHandlers()
    const url = app.isPackaged ? await startProductionServer() : DEV_URL
    writeLog(`loading ${url}`)
    createWindow(url)
  } catch (error) {
    writeLog(error instanceof Error ? error.stack ?? error.message : String(error))
    dialog.showErrorBox(
      "SceneLab 启动失败",
      error instanceof Error ? error.message : "无法启动本地客户端。"
    )
    app.quit()
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0 && mainWindow) {
      mainWindow.show()
    }
  })
})

app.on("before-quit", () => {
  app.isQuitting = true
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill()
  }
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
