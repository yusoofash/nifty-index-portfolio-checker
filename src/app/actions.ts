"use server";
import neatCsv from "neat-csv";
import { IndexStock } from "./types/IndexStock";

export async function fetchStockListByIndex(index: string) {
  try {
    const url = `https://nsearchives.nseindia.com/content/indices/${index}.csv`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch buffer from ${url}: ${response.status} ${response.statusText}`
      );
    }

    const arr = await neatCsv(await response.text());
    return arr as IndexStock[];
  } catch (error) {
    console.error("Error fetching Index:", error);
    throw error;
  }
}
