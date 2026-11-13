# The entry names its sibling at the top level, as bit_world does with
# bit_palette: it only imports once the package's folder is on sys.path.
from sibling_colors import COLORS

print("sibling_pack ran with", len(COLORS), "colors")
