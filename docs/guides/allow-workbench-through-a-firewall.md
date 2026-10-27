# Allow Workbench through a firewall

If you manage a network, unblock these domains so Workbench works:

- `pydevices.github.io`: Workbench itself, served from GitHub Pages.
- `hub.viper-ide.org`: the relay that [connecting over the internet](connect-over-the-internet.md) uses, inherited from upstream ViperIDE.
- `micropython.org`: the MicroPython package index the package manager reads.
- `raw.githubusercontent.com`: packages installed from GitHub.
- `gitlab.com` and `cors.sh`: packages installed from GitLab, which Workbench fetches through the `cors.sh` proxy.

This list isn't exhaustive. Allow the domains at each of these levels:

1. Network firewall: the domains and their addresses.
2. Content filters.
3. DNS filtering.
4. Proxy servers.
5. Browser settings: no site-specific restrictions.

