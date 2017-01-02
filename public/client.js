function reqListener (url) {
  return function() {
    console.log(this.responseText);
    let btn = document.querySelectorAll(`[data-pageurl="${url}"]`);
    let li = document.querySelectorAll(btn);
    console.log(btn);
  }

}

function deleteReq(event) {
  console.log('hi', event.target.dataset.pageurl);
  let url = event.target.dataset.pageurl;
  var oReq = new XMLHttpRequest();
  oReq.addEventListener("load", reqListener(url));
  oReq.open("DELETE", `http://localhost:8080${url}`);
  oReq.send();
}