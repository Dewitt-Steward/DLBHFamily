import csv
import io
import json
import os
import sys
import requests

CSV_URL = "https://gist.githubusercontent.com/Tucker-Eric/6a1a6b164726f21bb699623b06591389/raw/d87104248e4796f872412993a8b43d583c889176/us_zips.csv"

OUT_DIR = "Geography"
OUT_PATH = os.path.join(OUT_DIR, "geography.json")

def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    try:
        r = requests.get(CSV_URL, timeout=60)
        r.raise_for_status()
    except Exception as e:
        print(e, file=sys.stderr)
        sys.exit(1)

    reader = csv.DictReader(io.StringIO(r.text))

    cleaned = []
    for row in reader:
        cleaned.append({
            "zip": (row.get("zip") or "").strip().zfill(5),
            "city": (row.get("city") or "").strip(),
            "state": (row.get("state") or "").strip(),
        })

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(cleaned, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
