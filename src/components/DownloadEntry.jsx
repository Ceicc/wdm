import React from "react"
import { format } from "bytes"
import prettyMS from "pretty-ms"


export default function DownloadEntry({ id, url, name, parts, resumable, size, removeDownloadEntry, downloadDirHandle }) {

  const [finishedDownloading, setFinishedDownloading] = React.useState(false)

  const [partsState, setPartsState] = React.useState(Array(Number(parts)).fill(null).map(function fragmentMapFunction(v, i) {
    return {
      finished: false,
      fragmentSize: size / parts, //! need to round it (no float)
      startOffset: (size / parts) * i,
      downloadedBytes: 0,
      domElement: React.useRef(null), //! Possible memory leak
      index: i,
    }
  }))

  React.useEffect(() => {

    const abortController = new AbortController()

    for (const fragment of partsState) {

      (async () => {

        const fileHandle = await downloadDirHandle.getFileHandle(name.concat(`.part${fragment.index}`), { create: true })

        const fileWritable = await fileHandle.createWritable({ keepExistingData: false })

        const res = await fetch("apt/get", {
          redirect: "manual",
          cache: "no-store",
          referrer: "",
          headers: {
            'x-wdm': url,
            "range": `bytes=${fragment.startOffset}-${fragment.startOffset + fragment.fragmentSize}` //!! ????
          },
          signal: abortController.signal,
        })

        const reader = res.body.getReader()

        while (true) {

          const { done, value } = await reader.read()

          if (done) {

            await fileWritable.close()

            setPartsState(parts => parts.map(fragmentObj => {

              if (fragmentObj.index === fragment.index) {
                fragmentObj.finished = true
              }

              return fragmentObj
            }))

            break
          }

          await fileWritable.write(value)

          setPartsState(parts => parts.map(fragmentObj => {

            if (fragmentObj.index === fragment.index) {
              fragmentObj.downloadedBytes += value.length
            }

            return fragmentObj
          }))

        }

      })()

    }

    return () => {
      console.log("aborting right now")
      abortController.abort()
    }
  }, [])

  React.useEffect(() => {

    const allFinishedDownloading = partsState.reduce((finished, fragment) => {
      if (!finished) // At least one part did not finish
        return false
      else
        return fragment.finished
    }, true)

    if (!allFinishedDownloading)
      return

    (async () => {

      const fileHandle = await downloadDirHandle.getFileHandle(name, { create: true })

      const fileWritable = await fileHandle.createWritable({ keepExistingData: false })

      const promisesArray = parts.map( async fragment => new Promise(async (resolve, reject) => {

        const fragmentFileHandle = await downloadDirHandle.getFileHandle(`${name}.part${fragment.index}`, { create: false })

        //TODO: get readable from fragmentFileHandle and pipe it to fileWritable
        //TODO: after finishing DONT close fileWritable, just call resolve()

      }))

      for (const fragmentWritePromise of promisesArray) {
        await fragmentWritePromise()
      }

      fileWritable.close()

      setFinishedDownloading(true)

    })

  }, [partsState])


  return (
    <li>

      <div className={`download-progress ${finishedDownloading && "finished"}`}>
        {partsState.map(fragment => (
          <span
            className={`fragment ${fragment.finished && "finished"}`}
            ref={fragment.domElement}
            style={`--fragment-download-progress: ${fragment.downloadedBytes / fragment.fragmentSize}%;`}
            key={fragment.index}>
          </span>))}
      </div>

      <p className="filename">
        {name}
      </p>

      <span className="download-url" title={url}>
        {url}
      </span>

      <div className="download-prog">
        {/* replace it with a div container and n span children
        the n is relative to the download parts. e.g. 8 spans */}

        {
          state.finished && <DownloadSummary time={(state.endTime - state.startTime) / 1000} size={state.downloadedBytes} />
          || state.fileSize && <progress max="100" value={state.progress}></progress>
          || <progress></progress>
        }
      </div>

      {/* TODO: add a pause/resume button */}
      {/* <div className="controll-button">
        <button type="button" className="play"></button>
      </div> */}

      {
        !state.finished &&
        <div className="controll-buttons">

          {resumable && (
            <button type="button" className="pause">
              <img src="icons/pause_24.svg" alt="Pause Icon" />
              Pause
            </button>
          )}

          <button type="button" className="cancel" onClick={() => removeDownloadEntry(id)}>
            <img src="icons/delete-forever_white_hq_18dp.png" alt="Delete Icon" />
            Cancel
          </button>

        </div>
      }
    </li>
  )
}

function DownloadSummary({ time, size }) {
  return (
    <div className="download-summary">
      <span className="check-mark">
        <img src="icons/check-mark_24.png" alt="Check Mark" />
      </span>
      Downloaded {format(size, { unitSeparator: ' ' })} in {prettyMS(Number(time.toFixed() + "000"))}
    </div>
  )
}