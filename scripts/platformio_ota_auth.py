from pathlib import Path
import re

Import("env")


def read_define(secrets_text, name):
    pattern = r'^\s*#define\s+' + re.escape(name) + r'\s+"([^"]*)"\s*$'
    match = re.search(pattern, secrets_text, re.MULTILINE)
    if not match or not match.group(1).strip():
        raise RuntimeError(f"Missing {name} in include/secrets.h")
    return match.group(1)


project_dir = Path(env.subst("$PROJECT_DIR"))
secrets_path = project_dir / "include" / "secrets.h"
if not secrets_path.exists():
    raise RuntimeError("Missing include/secrets.h")

secrets_text = secrets_path.read_text(encoding="utf-8")
ota_password = read_define(secrets_text, "OTA_PASSWORD")

upload_flags = env.get("UPLOAD_FLAGS") or []
if isinstance(upload_flags, str):
    upload_flags = [upload_flags]

upload_flags = [flag for flag in upload_flags if not str(flag).startswith("--auth")]
upload_flags.append(f"--auth={ota_password}")

env.Replace(UPLOAD_FLAGS=upload_flags)
