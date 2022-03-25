import express from "express"
import range from "@ceicc/range"
import http from "http"
import https from "https"
import { URL, fileURLToPath } from "url"
import { dirname } from "path"

const router = express.Router({ strict: true })

export default router


router.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Headers", "x-wdm")
  res.setHeader("Access-Control-Expose-Headers", "content-length, x-wdm-finalurl")
  next()
})

router.get('/api/get', (req, res) => {

  const href = req.headers["x-wdm"]

  if (!href)
    return res.sendStatus(404)

  delete req.headers["x-wdm"]


  requestPage(href, req.headers, serverRes => {

    res.writeHead(serverRes.statusCode, serverRes.statusMessage, serverRes.headers)
    serverRes.pipe(res)

  }, error => {

    // console.error(error)
    !res.headersSent && res.sendStatus(500)

  })
})

router.get('/api/youtube', (req, res) => {

  const { id } = req.query

  if (!isValidYoutubeID(id))
    return res.sendStatus(400)

  res.status(201).json({ test: true })
})

router.get('*', range({
  baseDir: dirname(fileURLToPath(import.meta.url)) + '/public',
  maxAge: process.env.DEVELOPMENT ? 0 : 86400
}))


function requestPage(href, headers, cb, errorCb) {

  delete headers["host"]
  delete headers["origin"]

  const url = new URL(href)

  const options = {
    headers: {
      ...headers,
      Host: url.host,
      Origin: url.origin,
      referer: url.origin + '/'
    }
  }

  if (url.protocol === "http:")
    http.get(url, options, handleRes).on("error", errorCb)
  else
    https.get(url, options, handleRes).on("error", errorCb)

  function handleRes(res) {

    if (res.statusCode.toString()[0] === "3" && "location" in res.headers) {

      if (res.headers.location[0] === "/") {
        requestPage(url.origin + res.headers.location, headers, cb, errorCb)
      }

      else {
        requestPage(res.headers.location, headers, cb, errorCb)
      }

      return
    }

    res.headers["x-wdm-finalurl"] = url.href

    delete res.headers["set-cookie"]

    cb(res)
  }

}

function isValidYoutubeID(id) {
  return typeof id === "string" && id.match(/^[a-zA-Z0-9_-]{11}$/)
}