import json
import os
import sys
from tempfile import NamedTemporaryFile

# append_schema_to_geography.py lives in: DLBHFamily/src/python/append_schema_to_geography.py
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT  = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))

# Update IN PLACE: DLBHFamily/data/geography/geography.json
GEO_PATH = os.path.join(REPO_ROOT, "data", "geography", "geography.json")


MEMBERSHIP_ENROLLMENT_SCHEMA = {
  "form_name": "Membership Enrollment",
  "datasets": {
    "title_options": [
      { "value": "Mr", "label": "Mr." },
      { "value": "Miss", "label": "Miss" },
      { "value": "Ms", "label": "Ms." },
      { "value": "Mrs", "label": "Mrs." }
    ],
    "suffix_options": [
      { "value": "Jr", "label": "Jr." },
      { "value": "Sr", "label": "Sr." },
      { "value": "II", "label": "II" },
      { "value": "III", "label": "III" },
      { "value": "IV", "label": "IV" }
    ],
    "relationship_options": [
      { "value": "self", "label": "Self" },
      { "value": "spouse_partner", "label": "Spouse/Partner" },
      { "value": "dependent", "label": "Dependent" }
    ],
    "yes_no": [
      { "value": "yes", "label": "Yes" },
      { "value": "no", "label": "No" }
    ],
    "tshirt_sizes": [
      { "value": "YS", "label": "Youth Small" },
      { "value": "YM", "label": "Youth Medium" },
      { "value": "YL", "label": "Youth Large" },
      { "value": "S", "label": "Small" },
      { "value": "M", "label": "Medium" },
      { "value": "L", "label": "Large" },
      { "value": "XL", "label": "XL" },
      { "value": "2XL", "label": "2XL" },
      { "value": "3XL", "label": "3XL" }
    ],
    "tshirt_prices": [
      { "value": "10.00", "label": "$10.00" }
    ]
  },
  "steps": [
    { "index": 1, "id": "step_zip", "title": "Zip Code" },
    { "index": 2, "id": "step_personal", "title": "Personal Information" },
    { "index": 3, "id": "step_contact", "title": "Contact Information" },
    { "index": 4, "id": "step_household", "title": "Household" },
    { "index": 5, "id": "step_collection", "title": "Family Collection" },
    { "index": 6, "id": "step_summary", "title": "Order Summary" }
  ],
  "fields": [
    { "id": "zip_entry", "name": "zip_entry", "label": "Zip Code", "type": "text", "steps": [1], "required": True },

    { "id": "title", "name": "title", "label": "Title", "type": "select", "options_dataset": "title_options", "steps": [2] },
    { "id": "first_name", "name": "first_name", "label": "First Name", "type": "text", "steps": [2], "required": True },
    { "id": "middle_name", "name": "middle_name", "label": "Middle Name", "type": "text", "steps": [2] },
    { "id": "last_name", "name": "last_name", "label": "Last Name", "type": "text", "steps": [2], "required": True },
    { "id": "suffix", "name": "suffix", "label": "Suffix", "type": "select", "options_dataset": "suffix_options", "steps": [2] },

    { "id": "relationship", "name": "relationship", "label": "Relationship", "type": "select", "options_dataset": "relationship_options", "steps": [2], "required": True },
    { "id": "dob", "name": "dob", "label": "Date of Birth", "type": "date", "steps": [2], "required": True },

    { "id": "food_allergies", "name": "food_allergies", "label": "Food Allergies", "type": "select", "options_dataset": "yes_no", "steps": [2], "required": True },
    { "id": "food_allergies_details", "name": "food_allergies_details", "label": "If Yes, list allergies (optional)", "type": "text", "steps": [2] },

    { "id": "address_line_1", "name": "address_line_1", "label": "Address", "type": "text", "steps": [3], "required": True },

    { "id": "city", "name": "city", "label": "City", "type": "text", "steps": [3], "required": True, "readonly": True },
    { "id": "state", "name": "state", "label": "State", "type": "text", "steps": [3], "required": True, "readonly": True },
    { "id": "zip_confirm", "name": "zip_confirm", "label": "Zip Code", "type": "text", "steps": [3], "required": True, "readonly": True },

    { "id": "email", "name": "email", "label": "Email Address", "type": "email", "steps": [3], "required": True },
    { "id": "phone", "name": "phone", "label": "Phone Number", "type": "tel", "steps": [3], "required": True },

    { "id": "region", "name": "region", "label": "Region", "type": "text", "steps": [6], "readonly": True },
    { "id": "division", "name": "division", "label": "Division", "type": "text", "steps": [6], "readonly": True },
    { "id": "fips_code", "name": "fips_code", "label": "FIPS Code", "type": "text", "steps": [6], "readonly": True },

    { "id": "household_first_name", "name": "household_first_name", "label": "First Name", "type": "text", "steps": [4] },
    { "id": "household_last_name", "name": "household_last_name", "label": "Last Name", "type": "text", "steps": [4] },
    { "id": "household_dob", "name": "household_dob", "label": "Date of Birth", "type": "date", "steps": [4] },
    { "id": "household_relationship", "name": "household_relationship", "label": "Relationship", "type": "select", "options_dataset": "relationship_options", "steps": [4] },
    { "id": "household_food_allergies", "name": "household_food_allergies", "label": "Food Allergies", "type": "select", "options_dataset": "yes_no", "steps": [4] },

    { "id": "tshirt_size", "name": "tshirt_size", "label": "T-Shirt Size", "type": "select", "options_dataset": "tshirt_sizes", "steps": [5], "required": True },
    { "id": "tshirt_price", "name": "tshirt_price", "label": "T-Shirt Price", "type": "select", "options_dataset": "tshirt_prices", "steps": [5], "required": True },

    { "id": "order_summary", "name": "order_summary", "label": "Order Summary", "type": "summary", "steps": [6] }
  ]
}


def main():
    if not os.path.exists(GEO_PATH):
        print(f"Missing file: {GEO_PATH}", file=sys.stderr)
        sys.exit(1)

    with open(GEO_PATH, "r", encoding="utf-8") as f:
        base = json.load(f)

    # Normalize older formats:
    # - if it's a list, assume it's the geography array
    if isinstance(base, list):
        geography = base
        area_codes = []
        existing = {}
    elif isinstance(base, dict):
        geography = base.get("geography", [])
        area_codes = base.get("area_codes", [])
        # preserve any other existing keys except ones we rebuild
        existing = {k: v for k, v in base.items() if k not in {"geography", "area_codes", "schema"}}
    else:
        print("Unexpected JSON structure in geography.json", file=sys.stderr)
        sys.exit(1)

    # Rebuild object with schema LAST
    updated = {
        "geography": geography,
        "area_codes": area_codes,
        **existing,
        "schema": MEMBERSHIP_ENROLLMENT_SCHEMA
    }

    # Atomic write (prevents partial files)
    os.makedirs(os.path.dirname(GEO_PATH), exist_ok=True)
    with NamedTemporaryFile("w", encoding="utf-8", delete=False, dir=os.path.dirname(GEO_PATH)) as tmp:
        json.dump(updated, tmp, ensure_ascii=False, indent=2)
        tmp_path = tmp.name

    os.replace(tmp_path, GEO_PATH)
    print(f"Appended schema to: {GEO_PATH}")


if __name__ == "__main__":
    main()
