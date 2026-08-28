"""
从 pdf_tables.json 重建 defect_library.json（判定标准全量表）。
"""
import json
import re
import sys
from collections import OrderedDict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPO = ROOT.parent
SRC = REPO / "pdf_tables.json"
OUTS = [
    ROOT / "data" / "defect_library.json",
    REPO / "defect_library.json",
]

AREA = {
    "X": ("箱装外观缺陷", "纸箱及箱内大条相关缺陷"),
    "T": ("条装外观缺陷", "条盒（含透明纸、拉线等）相关缺陷"),
    "H": ("盒装外观缺陷", "小盒（含透明纸、拉线、商标纸、内衬纸等）相关缺陷"),
    "J": ("烟支外观缺陷", "烟支本身及物理指标相关缺陷"),
}

CODE_RE = re.compile(r"^[A-Z]{2,5}[A-D]$")


def _cell(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").replace("\n", " ")).strip()


def _loc(value: str) -> str:
    text = re.sub(r"\s+", "", value or "")
    if text.startswith("注"):
        return ""
    return text


def rebuild() -> OrderedDict:
    tables = json.loads(SRC.read_text(encoding="utf-8"))
    items = []
    loc = name = ""
    for table in tables:
        rows = table.get("rows") or []
        if not rows:
            continue
        header = [_cell(c).replace(" ", "") for c in rows[0]]
        if "缺陷代码" not in "".join(header):
            continue
        page = table.get("page")
        for row in rows[1:]:
            cells = [_cell(c) for c in row]
            if len(cells) < 5:
                continue
            while len(cells) < 6:
                cells.append("")
            loc_cell = _loc(cells[0])
            if loc_cell:
                loc = loc_cell
            if cells[1]:
                name = _loc(cells[1]) or cells[1]
            code = (cells[2] or "").replace(" ", "").upper()
            if not CODE_RE.match(code):
                continue
            if not loc or not name:
                continue
            items.append({
                "location": loc,
                "name": name,
                "code": code,
                "standard": cells[3],
                "category": (cells[4] or "").strip().upper()[:1],
                "source_page": page,
                "appendix": cells[5],
            })

    library: OrderedDict = OrderedDict()
    for prefix, (area_name, desc) in AREA.items():
        library[area_name] = {"description": desc, "locations": OrderedDict()}

    for item in items:
        prefix = item["code"][:1]
        area_name = AREA.get(prefix, AREA["H"])[0]
        locations = library[area_name]["locations"]
        loc_name = item["location"]
        locations.setdefault(loc_name, [])
        locations[loc_name].append(item)
    return library


def main() -> int:
    if not SRC.exists():
        print(f"missing {SRC}", file=sys.stderr)
        return 1
    library = rebuild()
    payload = json.dumps(library, ensure_ascii=False, indent=2)
    count = sum(
        len(items)
        for area in library.values()
        for items in area["locations"].values()
    )
    for path in OUTS:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(payload + "\n", encoding="utf-8")
        print(f"wrote {path} ({count} items)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
