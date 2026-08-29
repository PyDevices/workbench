
## Whitelist Domains for Workbench

To ensure the correct functionality of the Workbench web app, IT departments are advised to unblock or whitelist the following domains:

- `pydevices.github.io` - the main IDE server (hosted on GitHub Pages)
- `hub.viper-ide.org` - the collaborative features and remote device connection services (inherited from upstream ViperIDE, still used by the WebREPL relay)
- `micropython.org` - MicroPython package index / library manager
- `raw.githubusercontent.com`, `gitlab.com` - additional MicroPython packages

These domains must be allowed at least on the following levels (the list is not exhaustive):

1. **Network Firewall**: Ensure the domains and associated IP addresses are accessible through the network firewall.
2. **Content Filters**: Remove any content filtering that might block access to these domains.
3. **DNS Filtering**: Ensure that DNS filtering services allow requests to these domains.
4. **Proxy Servers**: Configure proxy servers to permit traffic to these domains.
5. **Browser Settings**: Check browser settings and ensure no site-specific restrictions are applied to these domains.
