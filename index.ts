import puppeteer from 'puppeteer';
import fs from 'fs';
import Episode from './interfaces';

type EpisodesParsed = Episode[] | []

const getVideoLink = async (page: puppeteer.Page): Promise<string> => {
  return page.$eval('.jw-video.jw-reset', (element): string => element.getAttribute('src') || '');
}

const getTitle = async (page: puppeteer.Page): Promise<string> => {
  return page.$eval('title', (element): string => element.textContent || '');
}

const getAnimeTitle = async (page: puppeteer.Page): Promise<string> => {
  const [title] = await page.$eval('.sidebar-holder.kanra-info', (element): string[] => {
    return [...element.childNodes]
    .map((e): string => e.textContent || '')
    .filter((e): string => e.trim());
  });
  return title;
}

const addInfoToAnimesJSON = (formatJSON: Episode): void => {
  const episodesJSON = fs.readFileSync('./animes.json', 'utf8');
  const episodesParsed: EpisodesParsed = JSON.parse(episodesJSON);
  const addNewEpisode = [...episodesParsed, formatJSON];
  fs.writeFileSync('./animes.json', JSON.stringify(addNewEpisode));
  console.log('Added new episode to animes.json');
};

const navigationPage = async (browser: puppeteer.Browser, index: number): Promise<void> => {
  const URL = `https://goyabu.com/videos/${index}/`
  const page = await browser.newPage();
  await page.goto(URL);
  await page.waitForSelector('.jw-video.jw-reset');
  const [videoLink, title, animeTitle] = await Promise.all([
    getVideoLink(page), getTitle(page), getAnimeTitle(page),
  ])
  
  const episodeFormat: Episode = {
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
  const browser: puppeteer.Browser = await puppeteer.launch({
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