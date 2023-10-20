import Parser from "rss-parser";
import dayjs from "dayjs";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import type { Article } from "../../types";

const parser = new Parser<Omit<Article, "type">>();

export async function fetchArticles(): Promise<Article[]> {
  const zenn = await parser.parseURL("https://zenn.dev/yusukehirao/feed");
  const notePage = await fetch("https://note.com/yusukehirao");
  const noteHtml = await notePage.text();
  const noteDom = new JSDOM(noteHtml);
  const noteTitles = noteDom.window.document.querySelectorAll(
    "h3.m-noteBody__title",
  );
  const noteData = Array.from(noteTitles).map<Article>((el) => {
    const title = el.textContent?.trim() || "";
    const section = el.closest("section");
    const href = section?.querySelector("a")?.href;
    const date = section?.querySelector("time")?.getAttribute("datetime") || "";
    return {
      type: "note",
      title,
      link: `https://note.com${href}`,
      pubDate: date,
    };
  });

  const data: Article[] = [
    // @ts-ignore
    ...zenn.items.map<Article>((item) => ({ ...item, type: "zenn" })),
    ...noteData,
  ];
  data.sort((a, b) => {
    return dayjs(b.pubDate).unix() - dayjs(a.pubDate).unix();
  });

  return data;
}
