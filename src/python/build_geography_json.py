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

# ---------------------------------------------------------
# Census Region + Division mapping by state abbreviation
# ---------------------------------------------------------
STATE_ABBR_TO_REGION_DIVISION = {
    # NORTHEAST — New England
    "CT": ("Northeast", "New England"),
    "ME": ("Northeast", "New England"),
    "MA": ("Northeast", "New England"),
    "NH": ("Northeast", "New England"),
    "RI": ("Northeast", "New England"),
    "VT": ("Northeast", "New England"),

    # NORTHEAST — Middle Atlantic
    "NJ": ("Northeast", "Middle Atlantic"),
    "NY": ("Northeast", "Middle Atlantic"),
    "PA": ("Northeast", "Middle Atlantic"),

    # MIDWEST — East North Central
    "IL": ("Midwest", "East North Central"),
    "IN": ("Midwest", "East North Central"),
    "MI": ("Midwest", "East North Central"),
    "OH": ("Midwest", "East North Central"),
    "WI": ("Midwest", "East North Central"),

    # MIDWEST — West North Central
    "IA": ("Midwest", "West North Central"),
    "KS": ("Midwest", "West North Central"),
    "MN": ("Midwest", "West North Central"),
    "MO": ("Midwest", "West North Central"),
    "NE": ("Midwest", "West North Central"),
    "ND": ("Midwest", "West North Central"),
    "SD": ("Midwest", "West North Central"),

    # SOUTH — South Atlantic
    "DE": ("South", "South Atlantic"),
    "FL": ("South", "South Atlantic"),
    "GA": ("South", "South Atlantic"),
    "MD": ("South", "South Atlantic"),
    "NC": ("South", "South Atlantic"),
    "SC": ("South", "South Atlantic"),
    "VA": ("South", "South Atlantic"),
    "WV": ("South", "South Atlantic"),
    "DC": ("South", "South Atlantic"),

    # SOUTH — East South Central
    "AL": ("South", "East South Central"),
    "KY": ("South", "East South Central"),
    "MS": ("South", "East South Central"),
    "TN": ("South", "East South Central"),

    # SOUTH — West South Central
    "AR": ("South", "West South Central"),
    "LA": ("South", "West South Central"),
    "OK": ("South", "West South Central"),
    "TX": ("South", "West South Central"),

    # WEST — Mountain
    "AZ": ("West", "Mountain"),
    "CO": ("West", "Mountain"),
    "ID": ("West", "Mountain"),
    "MT": ("West", "Mountain"),
    "NV": ("West", "Mountain"),
    "NM": ("West", "Mountain"),
    "UT": ("West", "Mountain"),
    "WY": ("West", "Mountain"),

    # WEST — Pacific
    "AK": ("West", "Pacific"),
    "CA": ("West", "Pacific"),
    "HI": ("West", "Pacific"),
    "OR": ("West", "Pacific"),
    "WA": ("West", "Pacific"),
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

        region, division = STATE_ABBR_TO_REGION_DIVISION.get(abbr, ("", ""))

        out.append({
            "Region": region,
            "Division": division,
            "State": state,
            "City": city,
            "Zip Code": zip_code
        })

    return out

def build_unique_area_codes(area_code_csv_text: str):
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
