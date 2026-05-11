# concert-tracker

CLI tool to find today's music events in any city, powered by the Ticketmaster API.

## Overview

Search for live music events happening today in a given city. Results are printed to the terminal and saved to `events.json`.

## Roadmap

- [ ] Check Ticketmaster Discovery API docs + get API key
- [ ] Prototype city-based event fetch with Ticketmaster
- [ ] Filter by music category only
- [ ] Pretty terminal output
- [ ] Save results to `events.json`
- [ ] Add date range support (beyond just today)

## Usage

```bash
python main.py --city "San Francisco"
```

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
# Add your Ticketmaster API key to .env
```

## Output

Events are printed to terminal and saved to `events.json`.
