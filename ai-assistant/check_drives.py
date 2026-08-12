import shutil
import string

for d in string.ascii_uppercase:
    try:
        du = shutil.disk_usage(f"{d}:")
        if du.total > 0:
            print(f"{d}: total={du.total//(2**30)}GB free={du.free//(2**30)}GB")
    except Exception:
        pass
