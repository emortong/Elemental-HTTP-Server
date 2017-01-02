function reqListener () {
  console.log(this.responseText);
}

function deleteReq(event) {
  console.log('hi', event.target.dataset.pageurl);
  let url = event.target.dataset.pageurl;
  var oReq = new XMLHttpRequest();
  oReq.addEventListener("load", reqListener);
  oReq.open("DELETE", `http://localhost:8080${url}`);
  oReq.send();
}