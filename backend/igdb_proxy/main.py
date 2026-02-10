import json
import os
from typing import Any
from urllib import request
from urllib.error import HTTPError, URLError

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

IGDB_BASE_URL = os.getenv("IGDB_BASE_URL", "https://api.igdb.com/v4")
IGDB_TIMEOUT_S = float(os.getenv("IGDB_TIMEOUT_S", "15"))
IGDB_CLIENT_ID = os.getenv("IGDB_CLIENT_ID")
IGDB_AUTH_TOKEN = os.getenv("IGDB_AUTH_TOKEN")

app = FastAPI()


def _igdb_headers() -> dict[str, str]:
	if not IGDB_CLIENT_ID or not IGDB_AUTH_TOKEN:
		raise HTTPException(status_code=500, detail="IGDB credentials not configured")
	return {
		"Client-ID": IGDB_CLIENT_ID,
		"Authorization": f"Bearer {IGDB_AUTH_TOKEN}",
		"Accept": "application/json",
		"Content-Type": "text/plain",
	}


def _igdb_post(path: str, body: str) -> list[dict[str, Any]]:
	url = f"{IGDB_BASE_URL}/{path.lstrip('/')}"
	req = request.Request(url, data=body.encode("utf-8"), headers=_igdb_headers(), method="POST")
	try:
		with request.urlopen(req, timeout=IGDB_TIMEOUT_S) as resp:
			return json.loads(resp.read().decode("utf-8"))
	except (HTTPError, URLError) as exc:
		raise HTTPException(status_code=502, detail=f"IGDB request failed: {exc}")


def _extract_steam_appids(external_games: list[dict[str, Any]]) -> list[int]:
	steam_appids: list[int] = []
	for entry in external_games:
		source = entry.get("external_game_source")
		category = entry.get("category")
		uid = entry.get("uid")
		if source is None and category is None:
			continue
		if str(source).lower() != "steam" and str(category) != "1":
			continue
		if isinstance(uid, str) and uid.isdigit():
			steam_appids.append(int(uid))
		elif isinstance(uid, int):
			steam_appids.append(uid)
	return steam_appids


@app.post("/search")
async def search(payload: dict[str, Any]) -> JSONResponse:
	title = payload.get("title")
	if not title:
		raise HTTPException(status_code=400, detail="Missing title")
	games = _igdb_post(
		"games",
		(
			"search \"{title}\"; fields name, summary, aggregated_rating, first_release_date, "
			"involved_companies.company.name, involved_companies.company.url, game_modes.slug, "
			"multiplayer_modes; limit 50;"
		).format(title=title),
	)
	for game in games:
		external_games = _igdb_post(
			"external_games",
			f"fields uid, external_game_source, category; where game = {game['id']};",
		)
		steam_appids = _extract_steam_appids(external_games)
		game["steam_appids"] = steam_appids
		game["steam_appid"] = steam_appids[0] if steam_appids else None
	return JSONResponse(games)