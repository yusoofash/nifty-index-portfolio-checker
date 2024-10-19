"use client";

import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { useEffect, useRef, useState } from "react";
import { fetchStockListByIndex } from "./actions";
import { IndexStock } from "./types/IndexStock";
import { SavedStock } from "./types/SavedStock";
import { ColDef } from "ag-grid-community";

const getSavedStocks = () => {
  return (
    JSON.parse(localStorage.getItem("STOCKS") || "[]") as SavedStockRowData[]
  ).sort((a, b) => {
    if (a.symbol.toLowerCase() < b.symbol.toLowerCase()) {
      return -1;
    }
    if (a.symbol.toLowerCase() > b.symbol.toLowerCase()) {
      return 1;
    }
    return 0;
  });
};

const saveStock = (stock: SavedStock) => {
  const savedStocks = getSavedStocks();
  localStorage.setItem("STOCKS", JSON.stringify([stock, ...savedStocks]));
};

const saveStocks = (stocks: SavedStock[]) => {
  localStorage.setItem("STOCKS", JSON.stringify(stocks));
};

const deleteStock = (symbol: string) => {
  const savedStocks = getSavedStocks();
  localStorage.setItem(
    "STOCKS",
    JSON.stringify(savedStocks.filter((s) => s.symbol !== symbol))
  );
};

const saveIndices = (indices: string[]) => {
  localStorage.setItem("INDICES", JSON.stringify(indices));
};

const getSavedIndices = () => {
  return JSON.parse(localStorage.getItem("INDICES") || "[]") as string[];
};

type SavedStockRowData = SavedStock & {
  actions: any;
};

const INDICES = [
  "ind_nifty500list",
  "ind_nifty50list",
  "ind_niftynext50list",
  "ind_niftysmallcap50list",
  "ind_niftymidcap50list",
];

type IndicesState = {
  index: string;
  stocks: IndexStock[];
};

export default function Home() {
  const [indicesStocks, setIndicesStocks] = useState<IndicesState[]>([]);
  const [savedStocks, setSavedStocks] = useState<SavedStockRowData[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<string[]>(getSavedIndices());

  const symbol = useRef<HTMLInputElement | null>(null);

  const Actions = (params: any) => (
    <button type="button" onClick={() => onDeleteClick(params)}>
      Delete
    </button>
  );
  const colDefs: ColDef<SavedStockRowData>[] = [
    { field: "symbol" },
    { field: "indices", cellRenderer: (params: any) => params.data.indices.join(', ') },
    { field: "actions", cellRenderer: Actions },
  ];

  const onDeleteClick = (params: any) => {
    if (confirm("Are you sure?")) {
      deleteStock(params.data.symbol);
      fetchSavedStocks();
    }

    return;
  };

  const handleSelectChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedValues = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setSelectedIndices(selectedValues);
    saveIndices(selectedValues);
    const indicesState = await fetchStockList(selectedValues);
    saveStocks(
      savedStocks.map((savedStock) => ({
        symbol: savedStock.symbol,
        indices: indicesState
          .filter((i) => i.stocks.some((s) => s.Symbol === savedStock.symbol))
          .map((i) => i.index),
      }))
    );
    fetchSavedStocks();
  };

  const fetchStockList = async (indices: string[]) => {
    const indicesState: IndicesState[] = [];
    for (const index of indices) {
      const stocks = await fetchStockListByIndex(index);
      indicesState.push({
        index,
        stocks,
      });
    }
    setIndicesStocks(indicesState);
    return indicesState;
  };

  const fetchSavedStocks = async () => {
    const savedStocks = getSavedStocks();
    setSavedStocks(savedStocks);
  };

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    let stockSymbol = symbol.current?.value;

    if (!stockSymbol) {
      return;
    }

    stockSymbol = stockSymbol.toUpperCase();

    saveStock({
      symbol: stockSymbol,
      indices: indicesStocks
        .filter((i) => i.stocks.some((s) => s.Symbol === stockSymbol))
        .map((i) => i.index),
    });
    fetchSavedStocks();
    if (symbol.current) symbol.current.value = "";
  };

  useEffect(() => {
    fetchStockList(getSavedIndices());
    fetchSavedStocks();
  }, []);

  return (
    <div>
      <main>
        <select
          name="indices"
          id="indices"
          multiple
          value={selectedIndices}
          onChange={handleSelectChange}
        >
          {INDICES.map((index) => (
            <option key={index} value={index}>
              {index}
            </option>
          ))}
        </select>

        <br />
        <br />

        <form onSubmit={onAdd}>
          <input
            type="text"
            name="symbol"
            id="symbol"
            placeholder="SYMBOL"
            ref={symbol}
          />
          <button type="submit">Add</button>
        </form>

        <br />

        <div className="ag-theme-quartz" style={{ height: "500px" }}>
          <AgGridReact<SavedStockRowData>
            pagination
            rowData={savedStocks}
            columnDefs={colDefs}
          />
        </div>
      </main>
    </div>
  );
}
