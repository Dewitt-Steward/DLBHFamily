name: Append Schema to Geography JSON

on:
  workflow_dispatch:
  push:
    paths:
      - "src/python/append_schema_to_geography.py"
      - "data/geography/geography.json"

permissions:
  contents: write

jobs:
  append_schema:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      # Optional: helps confirm paths if something ever breaks again
      - name: Show repo layout
        run: |
          pwd
          ls -la
          ls -la src/python || true
          ls -la data/geography || true

      - name: Run script (append schema)
        run: |
          python -m pip install --upgrade pip
          python src/python/append_schema_to_geography.py

      - name: Commit changes (if any)
        run: |
          if [ -n "$(git status --porcelain)" ]; then
            git config user.name "github-actions[bot]"
            git config user.email "github-actions[bot]@users.noreply.github.com"
            git add data/geography/geography.json
            git commit -m "Append membership schema to geography.json"
            git push
          else
            echo "No changes to commit."
          fi
