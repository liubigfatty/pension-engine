"""
任务一：整理附件中的所有JSON案例文件到项目cases目录
同时生成案例索引清单
"""
import json
import os
import shutil
from pathlib import Path

OUTBOUND = Path(r"C:\Users\14041\AppData\Roaming\winclaw\.openclaw\media\outbound")
CASES_DIR = Path(r"C:\Users\14041\AppData\Roaming\winclaw\.openclaw\workspace\养老金计算平台\cases")
CASES_DIR.mkdir(parents=True, exist_ok=True)

# 已知省份目录
PROVINCES = ["jilin", "liaoning", "heilongjiang", "shandong", "henan", "hebei", "jiangsu", "anhui", "gansu", "hunan", "beijing", "guangdong", "other"]
for p in PROVINCES:
    (CASES_DIR / p).mkdir(exist_ok=True)

# 省份映射（中文→目录名）
province_map = {
    "吉林省": "jilin", "吉林": "jilin",
    "辽宁省": "liaoning", "辽宁": "liaoning",
    "黑龙江省": "heilongjiang", "黑龙江": "heilongjiang",
    "山东省": "shandong", "山东": "shandong", "济南市": "shandong", "青岛市": "shandong",
    "河南省": "henan", "河南": "henan",
    "河北省": "hebei", "河北": "hebei",
    "江苏省": "jiangsu", "江苏": "jiangsu",
    "安徽省": "anhui", "安徽": "anhui",
    "甘肃省": "gansu", "甘肃": "gansu",
    "湖南省": "hunan", "湖南": "hunan", "长沙市": "hunan", "雨花区": "hunan",
    "北京市": "beijing", "北京": "beijing", "大兴区": "beijing",
    "广东省": "guangdong", "广东": "guangdong", "深圳市": "guangdong",
}

all_cases = []
stats = {"copied": 0, "error": 0, "skipped": 0, "provinces": {}}

for f in sorted(OUTBOUND.glob("*.json")):
    try:
        with open(f, 'r', encoding='utf-8') as fp:
            data = json.load(fp)
    except Exception as e:
        stats["error"] += 1
        print(f"ERROR reading {f.name}: {e}")
        continue

    # Extract province info
    province = data.get("province", data.get("region", data.get("city", "other")))
    if isinstance(province, dict):
        province = province.get("province", province.get("region", "other"))
    
    # Try to match to known province
    matched_province = "other"
    for key, val in province_map.items():
        if key in str(province):
            matched_province = val
            break
    
    # For special cases like Beijing/Hunan/Shenzhen
    city = data.get("city", data.get("region", ""))
    if "北京" in str(city):
        matched_province = "beijing"
    elif "湖南" in str(province) or "长沙" in str(province):
        matched_province = "hunan"
    elif "深圳" in str(province) or "广东" in str(province):
        matched_province = "guangdong"
    elif "山东" in str(province):
        matched_province = "shandong"
    elif "甘肃" in str(province):
        matched_province = "gansu"
    elif "安徽" in str(province):
        matched_province = "anhui"

    target_dir = CASES_DIR / matched_province
    target_dir.mkdir(exist_ok=True)
    
    # Generate filename
    case_id = data.get("case_id", data.get("region", f"{f.stem}"))
    fname = f"{case_id}.json"
    target_path = target_dir / fname
    
    try:
        with open(target_path, 'w', encoding='utf-8') as out:
            json.dump(data, out, ensure_ascii=False, indent=2)
        stats["copied"] += 1
        stats["provinces"][matched_province] = stats["provinces"].get(matched_province, 0) + 1
        all_cases.append({
            "file": fname,
            "province": matched_province,
            "case_id": case_id,
            "original": f.name
        })
    except Exception as e:
        stats["error"] += 1
        print(f"ERROR writing {fname}: {e}")

# Write index
index = {
    "total_cases": stats["copied"],
    "by_province": stats["provinces"],
    "errors": stats["error"],
    "cases": all_cases
}

index_path = CASES_DIR / "index.json"
with open(index_path, 'w', encoding='utf-8') as fp:
    json.dump(index, fp, ensure_ascii=False, indent=2)

# Print summary
print("=" * 60)
print("CASE ORGANIZATION COMPLETE")
print("=" * 60)
print(f"Total cases copied: {stats['copied']}")
print(f"Errors: {stats['error']}")
print(f"By province:")
for prov, count in sorted(stats["provinces"].items()):
    print(f"  {prov}: {count}")
print(f"\nIndex written to: {index_path}")
print(f"First 20 cases:")
for c in all_cases[:20]:
    print(f"  [{c['province']}] {c['file']} (from {c['original']})")
