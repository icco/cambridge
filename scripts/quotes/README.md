# Quote extractor

Mines quotes that name a clock time from a local ebook library (epub, txt, pdf) and writes `public/quotes/HH.json`. Needs Node 24+.

```sh
cd scripts/quotes && npm install
find /path/to/Books -type f \( -iname '*.epub' -o -iname '*.txt' -o -iname '*.pdf' \) ! -name '._*' | sed 's|^/path/to/Books/||' | sort > files.txt
mkdir out
for i in $(seq 0 15); do node extract.ts files.txt out $i 16 & done; wait
node select.ts out ../../public/quotes 8
```

- `extract.ts` takes a file list, an output dir, a shard index and a shard count. It resumes from `shard-N.done` and logs failures to `shard-N.err`. Set `ROOT` in the script to the library path.
- Excerpts must be whole sentences: `sentence.ts` rejoins sentences that `Intl.Segmenter` splits after honorifics or before a lowercase dialogue tag, drops trailing footnote numbers, and rejects excerpts that start lowercase or end without terminal punctuation. `pnpm test` checks `public/quotes` against the same rule.
- `select.ts` dedupes, ranks by confidence, and keeps up to N quotes per minute, at most one per book and two per author. It writes `out/coverage.txt` listing minutes with fewer than five.
