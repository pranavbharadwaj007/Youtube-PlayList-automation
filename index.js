const puppeteer = require("puppeteer");
const pdf = require("pdfkit");
const fsc = require("fs");
let link =
  "https://www.youtube.com/playlist?list=PLRBp0Fe2GpglvwYma4hf0fJy0sWaNY_CL";
let cTab;
(async function () {
  try {
    let browserOpen = puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ["--start-maximized"],
    });
    let browserInstance = await browserOpen;
    let allTabs = await browserInstance.pages();
    cTab = allTabs[0];
    await cTab.goto(link);
    await cTab.waitForSelector("h1#title");
    let name = await cTab.evaluate(function (select) {
      return document.querySelector(select).innerText;
    }, "h1#title");
    console.log(name);

    let allData = await cTab.evaluate(
      getData,
      "#stats .style-scope.ytd-playlist-sidebar-primary-info-renderer"
    );
    //console.log(name, allData.noOfVideos, allData.noOfViews);

    let TotalVideos = allData.noOfVideos.split(" ")[0];
    //console.log(TotalVideos);
    let currentVideos = await getCVideoLength();
    //console.log(currentVideos);

    while (TotalVideos - currentVideos >= 20) {
      await scrollToBottom();
      currentVideos = await getCVideoLength();
    }
    let finalList = await getStats();
    //console.log(finalList);
    let pdfDoc = new pdf();
    pdfDoc.pipe(fsc.createWriteStream("play.pdf"));
    pdfDoc.text(JSON.stringify(finalList));
    pdfDoc.end();
  } catch (error) {
    console.log(error);
  }
})();

function getData(selector) {
  let allElems = document.querySelectorAll(selector);
  console.log(allElems);
  let noOfVideos = allElems[0].innerText;
  let noOfViews = allElems[1].innerText;
  //console.log(noOfViews, "hhhhhhhhhhhh");
  //let noOfVideos = 1;
  //let noOfViews = 2;
  return {
    noOfVideos,
    noOfViews,
  };
}
async function getCVideoLength() {
  let length = cTab.evaluate(
    getLength,
    "#container>#thumbnail .yt-simple-endpoint.inline-block.style-scope.ytd-thumbnail"
  );
  return length;
}

function getLength(durationSelect) {
  let durationElement = document.querySelectorAll(durationSelect);
  return durationElement.length;
}

async function scrollToBottom() {
  await cTab.evaluate(goToBottom);
  function goToBottom() {
    window.scrollBy(0, window.innerHeight);
  }
}

async function getStats() {
  let list = await cTab.evaluate(
    getNameAndDuration,
    "#video-title",
    "#container>#thumbnail #text.style-scope.ytd-thumbnail-overlay-time-status-renderer"
  );
  return list;
}

function getNameAndDuration(videoSelector, durationSelector) {
  let videoElem = document.querySelectorAll(videoSelector);
  let durationElem = document.querySelectorAll(durationSelector);

  let currentList = [];
  for (let i = 0; i < durationElem.length; i++) {
    let videoTitle = videoElem[i].innerText;
    let duration = durationElem[i].innerText;
    currentList.push({ videoTitle, duration });
  }
  return currentList;
}
