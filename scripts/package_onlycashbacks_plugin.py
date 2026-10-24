"""Build the public plugin bundle without private ChatGPT app bindings or credentials."""
import json
import re
import struct
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SOURCE = REPO / 'plugin' / 'onlycashbacks-india'
OUTPUT = REPO / 'artifacts'


def build():
    manifest = json.loads((SOURCE / 'plugin.json').read_text(encoding='utf-8'))
    assert manifest['name'] == 'onlycashbacks-india'
    assert re.fullmatch(r'\d+\.\d+\.\d+', manifest['version'])
    interface = manifest['extensions']['com.openai']['interface']
    assert len(interface['displayName']) <= 30
    assert len(interface['shortDescription']) <= 30
    assert manifest['extensions']['com.openai']['publication']['countries'] == ['IN']
    assert 'apps' not in manifest and 'apps' not in manifest['extensions']['com.openai']
    assert not (SOURCE / '.app.json').exists()
    mcp = json.loads((SOURCE / 'mcp.json').read_text(encoding='utf-8'))
    server = mcp['mcpServers']['onlycashbacks']
    assert server['url'] == 'https://only-cashbacks.up.railway.app/mcp'
    auth = server['extensions']['com.openai']['auth']
    assert auth['type'] == 'oauth' and auth['client']['mode'] == 'dcr'
    assert auth['baseScopes'] == ['wallet']
    cases = manifest['extensions']['com.openai']['review']['test_cases']
    assert len(cases['positive']) == 5 and len(cases['negative']) == 3

    files = sorted(path for path in SOURCE.rglob('*') if path.is_file())
    for path in files:
        assert not path.is_symlink(), f'Symlink not allowed: {path.name}'
        if path.suffix in {'.json', '.yaml', '.md'}:
            text = path.read_text(encoding='utf-8')
            assert not re.search(r'asdk_app_|plugin_asdk_|oc_access_|oc_refresh_|BEGIN PRIVATE KEY|sk-or-', text), f'Private connection data in {path.name}'
    for field in ['logo', 'composerIcon']:
        icon = SOURCE / interface[field].removeprefix('./')
        png = icon.read_bytes()
        assert png[:8] == b'\x89PNG\r\n\x1a\n'
        width, height = struct.unpack('>II', png[16:24])
        minimum = 256 if field == 'logo' else 48
        assert width == height and minimum <= width <= 4096
        assert len(png) <= 5 * 1024 * 1024

    OUTPUT.mkdir(exist_ok=True)
    archive = OUTPUT / f"onlycashbacks-india-{manifest['version']}.zip"
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as bundle:
        for path in files:
            bundle.write(path, path.relative_to(SOURCE).as_posix())
    with zipfile.ZipFile(archive) as bundle:
        assert bundle.testzip() is None
        assert '.app.json' not in bundle.namelist()
        assert len(bundle.namelist()) == len(files)
    print(f'Validated public plugin bundle: {archive}')
    print('Package validation does not establish submission readiness; see plugin-submission/README.md.')


if __name__ == '__main__':
    build()
