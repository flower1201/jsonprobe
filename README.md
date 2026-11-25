# jsonprobe

**Walk a tree of `.json` files and report parse errors, BOM, nulls, and blank strings.**

Local-first hygiene for config / fixture trees.

```bash
npm install && npm run build
npx jsonprobe . --out ./jsonprobe-out
```

Exit code `2` when parse errors exist.

## License

MIT
