# The entry names its sibling at the top level, as a multi-file example may
# do: it only imports once the package's folder is on sys.path.
from sibling_colors import COLORS

print("sibling_pack ran with", len(COLORS), "colors")
