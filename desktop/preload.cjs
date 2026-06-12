/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("scenelab", {
  apiSettings: {
    load: () => ipcRenderer.invoke("api-settings:load"),
    save: (settings) => ipcRenderer.invoke("api-settings:save", settings),
    clear: () => ipcRenderer.invoke("api-settings:clear"),
    storage: "windows-encrypted",
  },
})
