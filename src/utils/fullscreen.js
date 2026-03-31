const getDocument = () => document

const getFullscreenElement = () => {
  const doc = getDocument()
  return doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement || null
}

const callMethod = async (target, names) => {
  for (const name of names) {
    if (typeof target?.[name] === 'function') {
      return target[name]()
    }
  }
  return undefined
}

export const isFullscreenActive = () => Boolean(getFullscreenElement())

export const canFullscreen = (element) => {
  if (!element) return false
  return Boolean(
    element.requestFullscreen
    || element.webkitRequestFullscreen
    || element.msRequestFullscreen
    || document.documentElement?.requestFullscreen
    || document.documentElement?.webkitRequestFullscreen
    || document.documentElement?.msRequestFullscreen,
  )
}

export const enterFullscreen = async (element) => {
  const target = element || document.documentElement
  await callMethod(target, ['requestFullscreen', 'webkitRequestFullscreen', 'msRequestFullscreen'])
}

export const exitFullscreen = async () => {
  const doc = getDocument()
  await callMethod(doc, ['exitFullscreen', 'webkitExitFullscreen', 'msExitFullscreen'])
}

export const toggleFullscreen = async (element) => {
  if (isFullscreenActive()) {
    await exitFullscreen()
    return false
  }
  await enterFullscreen(element)
  return true
}

export const subscribeFullscreenChange = (listener) => {
  const events = ['fullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange']
  for (const eventName of events) {
    document.addEventListener(eventName, listener)
  }
  return () => {
    for (const eventName of events) {
      document.removeEventListener(eventName, listener)
    }
  }
}
