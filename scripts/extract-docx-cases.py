"""
任务二：从DOCX文件中提取养老金案例数据
输出为结构化的JSON和Markdown格式
"""
import json
import os
import re
from pathlib import Path

# Try to use docx library, fall back to text extraction
try:
    import docx
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False
    print("WARNING: python-docx not installed, trying to extract text from .zip archive")

OUTBOUND = Path(r"C:\Users\14041\AppData\Roaming\winclaw\.openclaw\media\outbound")
OUTPUT_DIR = Path(r"C:\Users\14041\AppData\Roaming\winclaw\.openclaw\workspace\养老金计算平台\cases\extracted")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

DOCX_FILES = [
    "c9959c6e-c295-47ef-bc26-31f93f947c19.docx",
    "2640a169-7791-4abb-8d7d-fdb17cbf2e26.docx"
]

def extract_text_from_docx_simple(docx_path):
    """Simple text extraction - read .docx as ZIP and extract text"""
    import zipfile
    
    text_parts = []
    try:
        with zipfile.ZipFile(docx_path, 'r') as z:
            # Try word/document.xml first
            for name in z.namelist():
                if 'document.xml' in name:
                    content = z.read(name).decode('utf-8', errors='replace')
                    # Extract text from XML tags
                    text_content = re.sub(r'<[^>]+>', ' ', content)
                    text_content = re.sub(r'\s+', ' ', text_content).strip()
                    text_parts.append(text_content)
            if not text_parts:
                # Fallback: try all XML files
                for name in z.namelist():
                    if name.endswith('.xml'):
                        content = z.read(name).decode('utf-8', errors='replace')
                        text_content = re.sub(r'<[^>]+>', ' ', content)
                        text_content = re.sub(r'\s+', ' ', text_content).strip()
                        if len(text_content) > 100:
                            text_parts.append(text_content)
    except Exception as e:
        return f"ZIP extraction error: {e}"
    
    return "\n\n".join(text_parts)

def parse_case_from_text(text, docx_name):
    """Attempt to extract structured case data from raw text"""
    cases = []
    
    # Look for structured patterns (name, birth, retirement, etc.)
    patterns = [
        (r'(?:姓名|名字).{1,20}?:\s*([^\n]+)', 'name'),
        (r'(?:出生|出生日期|生).{0,10}?:\s*(\d{4}[-./年]?\d{1,2})', 'birth_date'),
        (r'(?:参加|参加工作|参加工作).{0,10}?:\s*(\d{4}[-./年]?\d{1,2})', 'work_start'),
        (r'(?:退休|退休日期|办理退休).{0,10}?:\s*(\d{4}[-./年]?\d{1,2})', 'retire_date'),
        (r'(?:养老金|待遇|月养老金).{0,10}?:\s*[\d,\.]+', 'pension_info'),
    ]
    
    # Try to find case blocks
    # Look for sections with known case patterns
    lines = text.split('\n')
    current_case = {}
    case_count = 0
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
            
        # Detect potential case headers (numbers, names with colons, etc.)
        if re.match(r'^[\d]+[.、]\s*.*[人者员]', line) or re.match(r'^[一二三四五六七八九十]+[.、]', line):
            if current_case and 'name' in current_case:
                cases.append(current_case)
                case_count += 1
            current_case = {'source': docx_name, 'case_number': line[:50]}
        
        if current_case:
            # Try to extract key-value pairs
            for pattern, key in patterns:
                match = re.search(pattern, line)
                if match and key not in current_case:
                    current_case[key] = match.group(1).strip()
            current_case['text_snippets'] = current_case.get('text_snippets', []) + [line[:200]] if line else current_case.get('text_snippets', [])
    
    if current_case and 'name' in current_case:
        cases.append(current_case)
        case_count += 1
    
    return cases

def main():
    results = []
    total_extracted = 0
    
    for docx_name in DOCX_FILES:
        docx_path = OUTBOUND / docx_name
        if not docx_path.exists():
            print(f"NOT FOUND: {docx_name}")
            continue
        
        print(f"\nProcessing: {docx_name} ({docx_path.stat().st_size / 1024 / 1024:.1f} MB)")
        
        # Extract text
        if HAS_DOCX:
            try:
                doc = docx.Document(str(docx_path))
                text = "\n".join([p.text for p in doc.paragraphs])
            except Exception as e:
                print(f"python-docx failed, falling back: {e}")
                text = extract_text_from_docx_simple(docx_path)
        else:
            text = extract_text_from_docx_simple(docx_path)
        
        # Save raw text
        raw_path = OUTPUT_DIR / f"{docx_name.replace('.docx', '')}_raw.txt"
        with open(raw_path, 'w', encoding='utf-8') as f:
            f.write(text[:50000])  # Limit to first 50K chars
        
        # Try to parse cases
        cases = parse_case_from_text(text, docx_name)
        results.extend(cases)
        total_extracted += len(cases)
        
        print(f"  Raw text saved: {raw_path.name} ({len(text)} chars)")
        print(f"  Parsed cases: {len(cases)}")
        
        # Save parsed cases
        case_path = OUTPUT_DIR / f"{docx_name.replace('.docx', '')}_cases.json"
        with open(case_path, 'w', encoding='utf-8') as f:
            json.dump(cases, f, ensure_ascii=False, indent=2)
        print(f"  Cases saved: {case_path.name}")
        
        # Show first few cases
        for i, c in enumerate(cases[:3]):
            print(f"    Case {i+1}: {c}")
    
    # Write summary
    summary = {
        "total_sources": len(DOCX_FILES),
        "total_extracted": total_extracted,
        "output_dir": str(OUTPUT_DIR),
        "files": [
            {"source": f, "cases_count": len([r for r in results if r.get('source') == f])}
            for f in DOCX_FILES
        ]
    }
    
    summary_path = OUTPUT_DIR / "extraction_summary.json"
    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*50}")
    print(f"EXTRACTION COMPLETE")
    print(f"Total cases extracted: {total_extracted}")
    print(f"Output: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
