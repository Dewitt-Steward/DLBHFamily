import csv
import io
import json
import os
import sys
import requests

ZIP_CSV_URL = "https://gist.githubusercontent.com/Tucker-Eric/6a1a6b164726f21bb699623b06591389/raw/d87104248e4796f872412993a8b43d583c889176/us_zips.csv"
AREA_CODE_CSV_URL = "https://raw.githubusercontent.com/ravisorg/Area-Code-Geolocation-Database/refs/heads/master/us-area-code-cities.csv"

# geography.py lives in: DLBHFamily/src/python/geography.py
# Repo root is:           DLBHFamily/
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT  = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))

# Output: DLBHFamily/data/geography/geography.json
OUT_DIR  = os.path.join(REPO_ROOT, "data", "geography")
OUT_PATH = os.path.join(OUT_DIR, "geography.json")


# ---------------------------------------------------------
# Region/Division (US Census) + their numbers
# Region Number: 1=Northeast, 2=Midwest, 3=South, 4=West
# Division Number: 1..9 as below
# ---------------------------------------------------------
REGION_NUM = {
    "Northeast": "1",
    "Midwest": "2",
    "South": "3",
    "West": "4",
}

DIVISION_NUM = {
    "New England": "1",
    "Middle Atlantic": "2",
    "East North Central": "3",
    "West North Central": "4",
    "South Atlantic": "5",
    "East South Central": "6",
    "West South Central": "7",
    "Mountain": "8",
    "Pacific": "9",
}

STATE_TO_REGION_DIVISION = {
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

# State FIPS (2-digit strings) + DC
STATE_TO_FIPS = {
    "AL": "01", "AK": "02", "AZ": "04", "AR": "05", "CA": "06", "CO": "08",
    "CT": "09", "DE": "10", "DC": "11", "FL": "12", "GA": "13", "HI": "15",
    "ID": "16", "IL": "17", "IN": "18", "IA": "19", "KS": "20", "KY": "21",
    "LA": "22", "ME": "23", "MD": "24", "MA": "25", "MI": "26", "MN": "27",
    "MS": "28", "MO": "29", "MT": "30", "NE": "31", "NV": "32", "NH": "33",
    "NJ": "34", "NM": "35", "NY": "36", "NC": "37", "ND": "38", "OH": "39",
    "OK": "40", "OR": "41", "PA": "42", "RI": "44", "SC": "45", "SD": "46",
    "TN": "47", "TX": "48", "UT": "49", "VT": "50", "VA": "51", "WA": "53",
    "WV": "54", "WI": "55", "WY": "56"
}

STATE_NAME_TO_ABBR = {
    "ALABAMA": "AL", "ALASKA": "AK", "ARIZONA": "AZ", "ARKANSAS": "AR",
    "CALIFORNIA": "CA", "COLORADO": "CO", "CONNECTICUT": "CT", "DELAWARE": "DE",
    "FLORIDA": "FL", "GEORGIA": "GA", "HAWAII": "HI", "IDAHO": "ID",
    "ILLINOIS": "IL", "INDIANA": "IN", "IOWA": "IA", "KANSAS": "KS",
    "KENTUCKY": "KY", "LOUISIANA": "LA", "MAINE": "ME", "MARYLAND": "MD",
    "MASSACHUSETTS": "MA", "MICHIGAN": "MI", "MINNESOTA": "MN", "MISSISSIPPI": "MS",
    "MISSOURI": "MO", "MONTANA": "MT", "NEBRASKA": "NE", "NEVADA": "NV",
    "NEW HAMPSHIRE": "NH", "NEW JERSEY": "NJ", "NEW MEXICO": "NM", "NEW YORK": "NY",
    "NORTH CAROLINA": "NC", "NORTH DAKOTA": "ND", "OHIO": "OH", "OKLAHOMA": "OK",
    "OREGON": "OR", "PENNSYLVANIA": "PA", "RHODE ISLAND": "RI", "SOUTH CAROLINA": "SC",
    "SOUTH DAKOTA": "SD", "TENNESSEE": "TN", "TEXAS": "TX", "UTAH": "UT",
    "VERMONT": "VT", "VIRGINIA": "VA", "WASHINGTON": "WA", "WEST VIRGINIA": "WV",
    "WISCONSIN": "WI", "WYOMING": "WY", "DISTRICT OF COLUMBIA": "DC",
}


def normalize_state(value: str) -> str:
    v = (value or "").strip()
    if not v:
        return ""
    if len(v) == 2:
        return v.upper()
    return STATE_NAME_TO_ABBR.get(v.upper(), v)


def get_geo_fields(state_value: str):
    abbr = normalize_state(state_value)

    region, division = STATE_TO_REGION_DIVISION.get(abbr, ("", ""))
    region_num = REGION_NUM.get(region, "")
    division_num = DIVISION_NUM.get(division, "")
    fips = STATE_TO_FIPS.get(abbr, "")

    return region, division, abbr, region_num, division_num, fips


def build_unique_area_codes(area_code_csv_text: str):
    """
    Extract ONLY unique area codes (first column) from:
      https://raw.githubusercontent.com/ravisorg/Area-Code-Geolocation-Database/refs/heads/master/us-area-code-cities.csv

    Output shape (simple JSON list):
      ["201","202","203",...]
    """
    unique = set()
    reader = csv.reader(io.StringIO(area_code_csv_text))

    for i, row in enumerate(reader):
        if not row:
            continue

        first = (row[0] or "").strip().lower()

        # Skip header if present
        if i == 0 and first in {"area", "area_code", "npa"}:
            continue

        area = (row[0] or "").strip().strip('"')
        if area.isdigit() and len(area) == 3:
            unique.add(area)

    return sorted(unique)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    # 1) Load ZIP geography CSV (your original behavior)
    try:
        r = requests.get(ZIP_CSV_URL, timeout=60)
        r.raise_for_status()
    except Exception as e:
        print(e, file=sys.stderr)
        sys.exit(1)

    reader = csv.DictReader(io.StringIO(r.text))

    cleaned = []
    for row in reader:
        city = (row.get("city") or "").strip()
        zip_code = (row.get("zip") or "").strip().zfill(5)

        region, division, abbr, region_num, division_num, fips = get_geo_fields(row.get("state") or "")

        cleaned.append({
            "Region": region,
            "Division": division,
            "City": city,
            "State": abbr,            # 2-letter (kept for compatibility)
            "Zip Code": zip_code,
            "Abbreviation": abbr,
            "Region Number": region_num,
            "Division Number": division_num,
            "FIPS Code": fips
        })

    # 2) Load area code CSV and extract unique area codes (simple list)
    try:
        ac = requests.get(AREA_CODE_CSV_URL, timeout=60)
        ac.raise_for_status()
    except Exception as e:
        print(e, file=sys.stderr)
        sys.exit(1)

    area_codes = build_unique_area_codes(ac.text)

    # 3) Write one JSON object that contains your existing list + new area_codes section
    payload = {
        "geography": cleaned,
        "area_codes": area_codes
    }

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
