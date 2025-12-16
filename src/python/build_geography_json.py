import csv
import io
import json
import os
import sys
import requests

ZIP_CSV_URL = "https://gist.githubusercontent.com/Tucker-Eric/6a1a6b164726f21bb699623b06591389/raw/d87104248e4796f872412993a8b43d583c889176/us_zips.csv"
AREA_CODE_CSV_URL = "https://raw.githubusercontent.com/ravisorg/Area-Code-Geolocation-Database/refs/heads/master/us-area-code-cities.csv"

# Script lives in: <repo>/src/python/build_geography_json.py
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))

# Output: <repo>/data/geography.json
OUT_DIR = os.path.join(REPO_ROOT, "data")
OUT_PATH = os.path.join(OUT_DIR, "geography.json")

# Census Region mapping (by state abbreviation)
STATE_ABBR_TO_REGION = {
    # Northeast
    "CT": "Northeast", "ME": "Northeast", "MA": "Northeast", "NH": "Northeast",
    "RI": "Northeast", "VT": "Northeast", "NJ": "Northeast", "NY": "Northeast", "PA": "Northeast",

    # Midwest
    "IL": "Midwest", "IN": "Midwest", "MI": "Midwest", "OH": "Midwest", "WI": "Midwest",
    "IA": "Midwest", "KS": "Midwest", "MN": "Midwest", "MO": "Midwest", "NE": "Midwest",
    "ND": "Midwest", "SD": "Midwest",

    # South
    "DE": "South", "FL": "South", "GA": "South", "MD": "South", "NC": "South", "SC": "South",
    "VA": "South", "WV": "South", "DC": "South",
    "AL": "South", "KY": "South", "MS": "South", "TN": "South",
    "AR": "South", "LA": "South", "OK": "South", "TX": "South",

    # West
    "AZ": "West", "CO": "West", "ID": "West", "MT": "West", "NV": "West", "NM": "West",
    "UT": "West", "WY": "West",
    "AK": "West", "CA": "West", "HI": "West", "OR": "West", "WA": "West",
}

def fetch_text(url: str) -> str:
    r = requests.get(url, timeout=90)
    r.raise_for_status()
    return r.text

def build_geography(zip_csv_text: str):
    reader = csv.DictReader(io.StringIO(zip_csv_text))
    out = []

    for row in reader:
        zip_code = (row.get("zip") or "").strip().zfill(5)
        city = (row.get("city") or "").strip()
        state = (row.get("state") or "").strip()
        abbr = (row.get("state_abbr") or "").strip().upper()

        region = STATE_ABBR_TO_REGION.get(abbr, "")

        # only the 4 fields you asked for
        out.append({
            "Region": region,
            "State": state,
            "City": city,
            "Zip Code": zip_code
        })

    return out

def build_unique_area_codes(area_code_csv_text: str):
    # file has rows like: 201,Bayonne,"New Jersey",US,...
    reader = csv.reader(io.StringIO(area_code_csv_text))
    unique = set()

    for row in reader:
        if not row:
            continue
        area = (row[0] or "").strip().strip('"')
        if area.isdigit() and len(area) == 3:
            unique.add(area)

    return sorted(unique)

def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    try:
        zip_text = fetch_text(ZIP_CSV_URL)
        ac_text  = fetch_text(AREA_CODE_CSV_URL)
    except Exception as e:
        print(f"Download failed: {e}", file=sys.stderr)
        sys.exit(1)

    geography = build_geography(zip_text)
    area_codes = build_unique_area_codes(ac_text)

    payload = {
        "geography": geography,
        "area_codes": area_codes
    }

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"Wrote: {OUT_PATH}")
    print(f"Geography rows: {len(geography)}")
    print(f"Unique area codes: {len(area_codes)}")

if __name__ == "__main__":
    main()
