# Open a gallery example

Any card of the [PyDevices gallery](https://pydevices.github.io/pydevices-examples/gallery/) opens in Workbench by name:

```
https://pydevices.github.io/workbench/?vm=1&example=paint
```

That starts the simulator, writes the example's files to it and opens the entry file in the editor, ready for Run.

Leave `vm=1` off and the example waits for whatever you connect next, so the same link puts it on a board over USB.

Where the files go:

- A single-file example lands in the root, next to `main.py`, with the modules it imports beside it.
- A package example goes under `/lib/<name>/`, where a `mip` install would put it.
- The helpers it uses from the examples repository's `lib/utils/` go in `/lib/`.
- Files it names in a `# manifests:` header are installed through the package manager.

If some of those files already exist on the device, Workbench asks before overwriting them.

