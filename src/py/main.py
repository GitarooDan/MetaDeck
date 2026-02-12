import json
import os
import subprocess

from metadeck.NSL import NSL
from metadeck.Heroic import Heroic
from metadeck.Utils import read_file, file_size, file_date, directory_size

import decky


class Plugin:

	# -----------------------------
	# Settings + cache (hardened)
	# -----------------------------
	def _settings_path(self, filename: str) -> str:
		return os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, filename)

	async def read_config(self) -> dict:
		path = self._settings_path("settings.json")
		if not os.path.exists(path):
			return {}
		try:
			with open(path, "r") as f:
				return json.load(f)
		except Exception:
			return {}

	async def write_config(self, data: dict) -> None:
		os.makedirs(decky.DECKY_PLUGIN_SETTINGS_DIR, exist_ok=True)
		path = self._settings_path("settings.json")
		with open(path, "w") as f:
			json.dump(data, f, indent="\t")

	async def read_cache(self) -> dict:
		# NOTE: cache should be persistent; runtime dir can be volatile.
		path = self._settings_path("cache.json")
		if not os.path.exists(path):
			return {}
		try:
			with open(path, "r") as f:
				return json.load(f)
		except Exception:
			return {}

	async def write_cache(self, data: dict) -> None:
		os.makedirs(decky.DECKY_PLUGIN_SETTINGS_DIR, exist_ok=True)
		path = self._settings_path("cache.json")
		with open(path, "w") as f:
			json.dump(data, f, indent="\t")

	# -----------------------------
	# Simple backend logging hook
	# -----------------------------
	async def log(self, msg: str) -> None:
		decky.logger.info(f"[MetaDeck DIAG] {msg}")

	# -----------------------------
	# Utility passthroughs
	# -----------------------------
	async def read_file(self, path: str) -> str:
		return await read_file(path)

	async def file_size(self, path: str) -> int:
		return await file_size(path)

	async def file_date(self, path: str) -> int:
		return await file_date(path)

	async def directory_size(self, path: str) -> int:
		return await directory_size(path)

	# -----------------------------
	# Data lookups
	# -----------------------------
	async def nsl_egs_data(self, id: str) -> dict | None:
		if NSL.nsl_egs is not None and id in NSL.nsl_egs:
			return NSL.nsl_egs[id]

	async def nsl_gog_data(self, id: int) -> dict | None:
		if NSL.nsl_gog is not None and id in NSL.nsl_gog:
			return NSL.nsl_gog[id]

	async def heroic_egs_data(self, id: str) -> dict | None:
		if Heroic.heroic_egs is not None and id in Heroic.heroic_egs:
			return Heroic.heroic_egs[id]

	async def heroic_gog_data(self, id: int) -> dict | None:
		if Heroic.heroic_gog is not None and id in Heroic.heroic_gog:
			return Heroic.heroic_gog[id]

	# -----------------------------
	# Hash helper (fixed)
	# -----------------------------
	async def hash(self, path: str) -> str:
		exe = os.path.join(decky.DECKY_PLUGIN_DIR, "bin", "hash")
		return subprocess.check_output([exe, path], text=True).strip()

	# -----------------------------
	# Lifecycle
	# -----------------------------
	async def _main(self) -> None:
		"""
		Load function
		"""
		decky.logger.info("Starting MetaDeck")
		await NSL.init_nsl()
		await Heroic.init_heroic()

	async def _unload(self) -> None:
		"""
		Unload function
		"""
		decky.logger.info("Stopping MetaDeck")

	# await Plugin.commit(self)
	async def _migration(self):
		decky.migrate_settings(
			os.path.join(decky.DECKY_HOME, "settings", "metadeck.json"))
		if os.path.exists(os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "metadeck.json")):
			os.rename(
				os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "metadeck.json"),
				os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "settings.json")
			)
