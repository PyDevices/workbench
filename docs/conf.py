# SPDX-FileCopyrightText: 2026 Brad Barnett
#
# SPDX-License-Identifier: MIT

"""Sphinx configuration for the Workbench documentation.

Everything shared by the PyDevices documentation projects (theme, top bar,
Markdown setup) comes from omnipython-docs. Workbench is a tool, not a library,
so there is no API reference to generate.
"""

from omnipython_docs import configure

globals().update(configure(
    "Workbench", __file__,
    repo="PyDevices/workbench", edit_path="docs",
    version_file=None,
))


# index.md is plain Markdown so the docs read on GitHub too; the site
# navigation lives in contents.md.
master_doc = "contents"
