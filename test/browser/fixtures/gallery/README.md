# Gallery fixtures

A stand-in for <https://pydevices.github.io/pydevices-examples/gallery/>, laid
out the way the site is: `python-files.json` lists every example and helper
file, examples live under `lib/examples/` and helpers under `lib/utils/`.
`gallery-open.spec.js` serves it at the gallery's own address.

The files are copies from pydevices-examples (commit `0ef28ef6`). They are
frozen test data: nothing keeps them in step with the repository, and nothing
needs to, since what is under test is how Workbench reads a gallery, not the
examples themselves.
