import React from "react"
// import Header from "./header.jsx"
import Aside from "./aside/aside.jsx"
import Main from "./main/main.jsx"
import Popup from "./popup.jsx"

export default function Interface() {

  // const [isDesktop, useIsDesktop] = React.useState(window.outerWidth > 1000)

  // React.useEffect(() => addEventListener("resize", () => useIsDesktop(window.outerWidth > 1000)), [])

  const [displayPopup, setDisplayPopup] = React.useState(false)
  const [popupTitle, setPopupTitle] = React.useState("")

  function makePopup(component, title) {
    setDisplayPopup(component)
    setPopupTitle(title)
  }

  function closePopup() {
    setDisplayPopup(false)
    setPopupTitle("")
  }

  const [downloadList, setDownloadList] = React.useState([])

  function addNewDownlaod(url, name) {
    // TODO: save the download state in the list
    // TODO: save the list in localstorage
    setDownloadList([
      ...downloadList,
      {
        id: `${url.toString(32)}-${name.toString(32)}`,
        url,
        name
      }
    ])
  }

  function removeDownloadEntry(id) {
    setDownloadList(list => (
      list.filter(downloadObj => downloadObj.id !== id)
    ))
  }

  return (
    <div className="main-container">
    
      {/* {isDesktop
      ? <Aside> <Nav /> </Aside>
      : <Header> <Nav /> </Header>} */}

      <Aside makePopup={makePopup} addNewDownlaod={addNewDownlaod} />

      <Main downloadList={downloadList} removeDownloadEntry={removeDownloadEntry} />
      
      {displayPopup &&
      <Popup
        closeFn={closePopup}
        title={popupTitle}
        children={displayPopup} />}

    </div>
  )

}