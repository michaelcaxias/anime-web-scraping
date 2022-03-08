const puppeteer = require('puppeteer');
const fs = require('fs');

const getVideoLink = async (page) => {
  return page.$eval('.jw-video.jw-reset', (element) => element.getAttribute('src'));
}

const getTitle = async (page) => {
  return page.$eval('title', (element) => element.textContent);
}

const getAnimeTitle = async (page) => {
  const [title] = await page.$eval('.sidebar-holder.kanra-info', (element) => {
    return [...element.childNodes].map((e) => e.textContent).filter((e) => e.trim());
  });
  return title;
}

const addInfoToAnimesJSON = (formatJSON) => {
  const episodesJSON = fs.readFileSync('./animes.json', 'utf8');
  const episodesParsed = JSON.parse(episodesJSON);
  const addNewEpisode = [...episodesParsed, formatJSON];
  fs.writeFileSync('./animes.json', JSON.stringify(addNewEpisode));
  console.log('Added new episode to animes.json');
};

const navigationPage = async (browser, index) => {
  const URL = `https://goyabu.com/videos/${index}/`
  const page = await browser.newPage();
  await page.goto(URL);
  await page.waitForSelector('.jw-video.jw-reset');
  const [videoLink, title, animeTitle] = await Promise.all([
    getVideoLink(page), getTitle(page), getAnimeTitle(page),
  ])
  
  console.log(animeTitle);

  const episodeFormat = {
    anime: animeTitle,
    title: title,
    episode: 0,
    video_link: videoLink,
  }
  
  addInfoToAnimesJSON(episodeFormat);
  console.log(videoLink ? 'SUCCESS: could get video link' : "ERROR: couldn't get src");

  page.close();
}

const MIN = 21;
const MAX = 21;

const main = async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless:true, 
    defaultViewport:null,
    devtools: true,
    args: ["--window-size=1920,1080", "--window-position=1921,0"]
  });

  for (let index = MIN; index <= MAX; index += 1) {
    await navigationPage(browser, index);
  }

  await browser.close();
};

main()