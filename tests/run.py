"""Uso: python3 tests/run.py [filtro ...]   (esegue tutti i test o quelli il cui nome contiene un filtro)"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import harness
for m in ['t_core', 't_reader', 't_sync', 't_screens', 't_backend', 't_pwa', 't_ascolta', 't_memoria', 't_progressi', 't_parole', 't_guida', 't_capitolo', 't_introduzioni', 't_mondo', 't_ios']:
    try: __import__(m)
    except ModuleNotFoundError as e:
        if e.name != m: raise
sys.exit(harness.run(sys.argv[1:] or None))
