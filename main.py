"""
concert-tracker — fetch today's music events in a city via Ticketmaster API.

Author: digif33ls
Created: 2026-05-10
"""

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()

TICKETMASTER_API_KEY = os.getenv("TICKETMASTER_API_KEY")
TM_BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json"
OUTPUT_FILE = Path("events.json")


def fetch_events(city: str, api_key: str) -> list[dict]:
    """Fetch today's music events in the given city from Ticketmaster."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%dT00:00:00Z")
    today_end = datetime.now(timezone.utc).strftime("%Y-%m-%dT23:59:59Z")

    params = {
        "apikey": api_key,
        "city": city,
        "classificationName": "music",
        "startDateTime": today,
        "endDateTime": today_end,
        "size": 50,
        "sort": "date,asc",
    }

    response = requests.get(TM_BASE_URL, params=params, timeout=10)
    response.raise_for_status()

    data = response.json()
    raw_events = data.get("_embedded", {}).get("events", [])

    events = []
    for e in raw_events:
        venue = e.get("_embedded", {}).get("venues", [{}])[0]
        price_ranges = e.get("priceRanges", [{}])
        price = price_ranges[0] if price_ranges else {}

        events.append({
            "name": e.get("name"),
            "date": e.get("dates", {}).get("start", {}).get("localDate"),
            "time": e.get("dates", {}).get("start", {}).get("localTime"),
            "venue": venue.get("name"),
            "address": venue.get("address", {}).get("line1"),
            "city": venue.get("city", {}).get("name"),
            "country": venue.get("country", {}).get("name"),
            "url": e.get("url"),
            "price_min": price.get("min"),
            "price_max": price.get("max"),
            "currency": price.get("currency"),
        })

    return events


def print_events(events: list[dict], city: str) -> None:
    """Pretty-print events to terminal."""
    today_str = datetime.now().strftime("%A, %B %d %Y")
    print(f"\n🎵 Music events in {city} — {today_str}\n")
    print(f"{'─' * 60}")

    if not events:
        print("  No events found today.")
        return

    for i, e in enumerate(events, 1):
        time_str = e["time"][:5] if e["time"] else "TBA"
        price_str = ""
        if e["price_min"] is not None:
            price_str = f"  💰 ${e['price_min']:.0f}–${e['price_max']:.0f} {e['currency']}"

        print(f"  {i:2}. {e['name']}")
        print(f"      📍 {e['venue']}, {e['city']}")
        print(f"      🕐 {time_str}{price_str}")
        print(f"      🔗 {e['url']}")
        print()

    print(f"{'─' * 60}")
    print(f"  {len(events)} event(s) found\n")


def save_events(events: list[dict]) -> None:
    """Save events to events.json."""
    output = {
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "count": len(events),
        "events": events,
    }
    OUTPUT_FILE.write_text(json.dumps(output, indent=2))
    print(f"  💾 Saved to {OUTPUT_FILE}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fetch today's music events in a city via Ticketmaster."
    )
    parser.add_argument("--city", required=True, help="City name (e.g. 'San Francisco')")
    args = parser.parse_args()

    if not TICKETMASTER_API_KEY:
        raise SystemExit("❌ TICKETMASTER_API_KEY not set. Copy .env.example to .env and add your key.")

    events = fetch_events(args.city, TICKETMASTER_API_KEY)
    print_events(events, args.city)
    save_events(events)


if __name__ == "__main__":
    main()
