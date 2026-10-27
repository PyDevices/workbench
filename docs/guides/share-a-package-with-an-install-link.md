# Share a package with an install link

A link to Workbench can install your library or project onto whatever board the person connects. You can put the link in a README as a button.

For instance, this installs [`aiodns`](https://github.com/vshymanskyy/aiodns):

[<img src="https://raw.githubusercontent.com/vshymanskyy/ViperIDE/refs/heads/main/assets/btn_install.png" alt="Install using Workbench" height="48"/>](https://pydevices.github.io/workbench/?install=github:vshymanskyy/aiodns)

The image is served from ViperIDE's repository.

## Make the link

Use `https://pydevices.github.io/workbench/?install=YOUR_LINK`. `YOUR_LINK` is one of:

- `github:org/repo`
- `github:org/repo/path/to/package.json`
- `github:org/repo@branch-or-tag`
- `gitlab:org/repo`
- `gitlab:org/repo/path/to/package.json`
- `gitlab:org/repo@branch-or-tag`
- `http://example.com/version/x/y/package.json`
- `http://example.com/version/x/y/foo.py`
- `http://example.com/version/x/y/foo.mpy` (not recommended)

The files must be reachable under [CORS rules](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS). That usually holds for files in GitHub and GitLab repositories. Files in GitHub Releases aren't reachable that way: use GitHub Pages to serve them.

## Show a readme first

When someone opens the link, Workbench fetches your `package.json`. If it has a `readme` field, the document opens in a tab, so people can read what the package does before they connect a board.

The `readme` value is a link in the same forms as above. A plain file name is resolved against the `package.json` it's written in, and `@branch-or-tag` from the install link is respected. The readme is rendered as Markdown, and links and images inside it resolve relative to the readme itself, so an image next to it and `github:`/`gitlab:` links both work.

Links in the readme are shown but can't be clicked, because a readme isn't allowed to send the person elsewhere. Write out any address you want people to be able to open.

## Add the button to your README

```md
[<img src="https://raw.githubusercontent.com/vshymanskyy/ViperIDE/refs/heads/main/assets/btn_install.png" alt="Install using Workbench" height="48"/>](https://pydevices.github.io/workbench/?install=YOUR_LINK)
```

