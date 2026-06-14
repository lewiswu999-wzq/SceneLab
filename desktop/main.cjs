/* eslint-disable @typescript-eslint/no-require-imports */
const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  net: electronNet,
  safeStorage,
  session,
  shell,
  utilityProcess,
} = require("electron")
const { execFileSync } = require("node:child_process")
const fs = require("node:fs")
const http = require("node:http")
const crypto = require("node:crypto")
const nodeNet = require("node:net")
const path = require("node:path")

const HOST = "127.0.0.1"
const FIRST_PORT = 3210
const DEV_URL = process.env.SCENELAB_DEV_URL || "http://localhost:3000"

let mainWindow
let serverProcess
let upstreamProxyServer
let routeTransitionQueue = Promise.resolve()
let activeDomesticRequests = 0
let domesticRestoreMode

const DOMESTIC_API_HOST_SUFFIXES = [
  "deepseek.com",
  "volces.com",
  "volcengineapi.com",
  "aliyuncs.com",
  "bigmodel.cn",
  "moonshot.cn",
  "minimax.chat",
  "siliconflow.cn",
  "stepfun.com",
  "baidubce.com",
]

function readWindowsProxyServer() {
  if (process.platform !== "win32") {
    return null
  }

  const registryKey = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings"
  try {
    const enabled = execFileSync(
      "reg.exe",
      ["query", registryKey, "/v", "ProxyEnable"],
      { encoding: "utf8", windowsHide: true }
    )
    if (!/\b0x1\b/i.test(enabled)) {
      return null
    }

    const configured = execFileSync(
      "reg.exe",
      ["query", registryKey, "/v", "ProxyServer"],
      { encoding: "utf8", windowsHide: true }
    )
    return configured.match(/ProxyServer\s+REG_SZ\s+(.+)/i)?.[1]?.trim() || null
  } catch {
    return null
  }
}

async function configureNetworkSession() {
  const proxyServer = readWindowsProxyServer()
  if (proxyServer) {
    await session.defaultSession.setProxy({
      mode: "fixed_servers",
      proxyRules: proxyServer,
      proxyBypassRules: "<local>;localhost;127.0.0.1",
    })
    writeLog("using configured Windows proxy for external API requests")
    return
  }

  await session.defaultSession.setProxy({ mode: "system" })
  writeLog("using Windows system network settings for external API requests")
}

function isDomesticApiHost(hostname) {
  const normalized = hostname.toLowerCase()
  return DOMESTIC_API_HOST_SUFFIXES.some(
    (suffix) => normalized === suffix || normalized.endsWith(`.${suffix}`)
  )
}

function withRouteTransition(action) {
  const next = routeTransitionQueue.then(action, action)
  routeTransitionQueue = next.catch(() => {})
  return next
}

async function clashControllerRequest(pathname, init) {
  const response = await electronNet.fetch(`http://127.0.0.1:9090${pathname}`, {
    ...init,
    bypassCustomProtocolHandlers: true,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })
  if (!response.ok) {
    throw new Error(`0dcloud controller returned HTTP ${response.status}`)
  }
  return response
}

async function withDomesticApiRoute(target, request) {
  if (!isDomesticApiHost(target.hostname)) {
    return request()
  }

  await withRouteTransition(async () => {
    if (activeDomesticRequests === 0) {
      domesticRestoreMode = undefined
      try {
        const configResponse = await clashControllerRequest("/configs")
        const config = await configResponse.json()
        if (config.mode === "global") {
          await clashControllerRequest("/configs", {
            method: "PATCH",
            body: JSON.stringify({ mode: "rule" }),
          })
          domesticRestoreMode = "global"
          writeLog(`temporarily using shared rule routing for ${target.hostname}`)
        }
      } catch (error) {
        writeLog(
          `0dcloud unavailable; using direct connection for ${target.hostname}: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      }
    }
    activeDomesticRequests += 1
  })

  try {
    return await request()
  } finally {
    await withRouteTransition(async () => {
      activeDomesticRequests = Math.max(0, activeDomesticRequests - 1)
      if (activeDomesticRequests === 0 && domesticRestoreMode === "global") {
        try {
          await clashControllerRequest("/configs", {
            method: "PATCH",
            body: JSON.stringify({ mode: "global" }),
          })
          writeLog("restored 0dcloud global routing")
        } catch (error) {
          writeLog(
            `failed to restore 0dcloud routing: ${
              error instanceof Error ? error.message : String(error)
            }`
          )
        }
        domesticRestoreMode = undefined
      }
    })
  }
}

function apiSettingsPath() {
  return path.join(app.getPath("userData"), "api-settings.bin")
}

function validateApiSettings(value) {
  const stream = (candidate, defaultPath) => ({
    apiKey: String(candidate?.apiKey ?? "").trim().slice(0, 4096),
    baseUrl: String(candidate?.baseUrl ?? "").trim().slice(0, 2048),
    model: String(candidate?.model ?? "").trim().slice(0, 512),
    apiPath: String(candidate?.apiPath ?? defaultPath).trim().slice(0, 512),
  })

  return {
    text: stream(value?.text ?? value?.deepseek, "/chat/completions"),
    image: stream(value?.image ?? value?.jimeng, "/images/generations"),
    video: stream(value?.video, "/videos/generations"),
    identities:
      value?.identities && typeof value.identities === "object"
        ? value.identities
        : undefined,
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
    const server = nodeNet.createServer()
    server.unref()
    server.once("error", () => resolve(false))
    server.listen(port, HOST, () => {
      server.close(() => resolve(true))
    })
  })
}

function readJsonBody(request, maxBytes = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0

    request.on("data", (chunk) => {
      size += chunk.length
      if (size > maxBytes) {
        reject(new Error("API 转发请求体过大。"))
        request.destroy()
        return
      }
      chunks.push(chunk)
    })
    request.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")))
      } catch {
        reject(new Error("API 转发请求格式无效。"))
      }
    })
    request.on("error", reject)
  })
}

async function startUpstreamProxy() {
  const token = crypto.randomBytes(32).toString("hex")

  upstreamProxyServer = http.createServer(async (request, response) => {
    if (
      request.method !== "POST" ||
      request.url !== "/fetch" ||
      request.headers.authorization !== `Bearer ${token}`
    ) {
      response.writeHead(404).end()
      return
    }

    try {
      const payload = await readJsonBody(request)
      const target = new URL(String(payload?.url || ""))
      if (target.protocol !== "https:" && target.protocol !== "http:") {
        throw new Error("API 转发仅支持 HTTP 或 HTTPS 地址。")
      }

      const upstream = await withDomesticApiRoute(target, async () => {
        const fetchImplementation = isDomesticApiHost(target.hostname)
          ? globalThis.fetch
          : electronNet.fetch
        const timeoutMs =
          String(payload?.method || "GET").toUpperCase() === "GET" ? 45000 : 90000
        const upstreamResponse = await fetchImplementation(target.toString(), {
          method: String(payload?.method || "GET"),
          headers:
            payload?.headers && typeof payload.headers === "object"
              ? payload.headers
              : undefined,
          body: typeof payload?.body === "string" ? payload.body : undefined,
          redirect: "follow",
          signal: AbortSignal.timeout(timeoutMs),
        })

        return {
          status: upstreamResponse.status,
          contentType:
            upstreamResponse.headers.get("content-type") || "application/octet-stream",
          body: Buffer.from(await upstreamResponse.arrayBuffer()),
        }
      })
      response.writeHead(upstream.status, {
        "Content-Type": upstream.contentType,
        "Cache-Control": "no-store",
      })
      response.end(upstream.body)
    } catch (error) {
      const cause =
        error instanceof Error && error.cause && typeof error.cause === "object"
          ? error.cause
          : undefined
      const detail =
        cause?.code ||
        cause?.message ||
        (error instanceof Error ? error.message : "桌面网络请求失败。")
      response.writeHead(502, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      })
      response.end(JSON.stringify({ error: { message: `桌面网络请求失败：${detail}` } }))
    }
  })

  await new Promise((resolve, reject) => {
    upstreamProxyServer.once("error", reject)
    upstreamProxyServer.listen(0, HOST, resolve)
  })
  const address = upstreamProxyServer.address()
  if (!address || typeof address === "string") {
    throw new Error("无法启动桌面 API 网络适配器。")
  }

  return {
    url: `http://${HOST}:${address.port}/fetch`,
    token,
  }
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
  const upstreamProxy = await startUpstreamProxy()
  const standaloneDirectory = path.join(process.resourcesPath, "standalone")
  const serverPath = path.join(standaloneDirectory, "server.js")
  const projectsDirectory = path.join(app.getPath("documents"), "SceneLab Projects")
  fs.mkdirSync(projectsDirectory, { recursive: true })

  serverProcess = utilityProcess.fork(serverPath, [], {
    cwd: standaloneDirectory,
    env: {
      ...process.env,
      HOSTNAME: HOST,
      NODE_ENV: "production",
      PORT: String(port),
      SCENELAB_UPSTREAM_PROXY_URL: upstreamProxy.url,
      SCENELAB_UPSTREAM_PROXY_TOKEN: upstreamProxy.token,
      SCENELAB_PROJECTS_DIR: projectsDirectory,
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
    title: "SceneLab Agent",
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
    await configureNetworkSession()
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
  upstreamProxyServer?.close()
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill()
  }
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
