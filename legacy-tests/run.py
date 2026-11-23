import sys
sys.path.insert(0,'/tmp/audit1')
import harness
for m in ['t1','t2','t3']:
    try:__import__(m)
    except ModuleNotFoundError as e:
        if e.name!=m:raise
only=sys.argv[1:] or None
sys.exit(harness.run(only))
