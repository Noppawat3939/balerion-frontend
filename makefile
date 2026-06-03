dev:
	bun run dev

benchmark:
	bun src/scripts/benchmark.ts $(count)

.PHONY: dev benchmark