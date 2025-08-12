import re
import json

def fix_spacing(text):
    # Remove space between $...$ and comma
    text = re.sub(r'(\$[^$]+\$)\s+,', r'\1,', text)
    # Remove space between $...$ and period
    text = re.sub(r'(\$[^$]+\$)\s+\.', r'\1.', text)
    # Remove space between $...$ and question mark
    text = re.sub(r'(\$[^$]+\$)\s+\?', r'\1?', text)
    # Remove space between \(...\) and comma
    text = re.sub(r'(\\\([^\)]+\\\))\s+,', r'\1,', text)
    # Remove space between \(...\) and period
    text = re.sub(r'(\\\([^\)]+\\\))\s+\.', r'\1.', text)
    # Remove space between \(...\) and question mark
    text = re.sub(r'(\\\([^\)]+\\\))\s+\?', r'\1?', text)
    return text

def fix_spacing_execute():
    with open("./trainer/public/putnam_problems.json", "r", encoding="utf-8") as f:
        data = f.read()
    fixed = fix_spacing(data)
    with open("./trainer/public/putnam_problems.json", "w", encoding="utf-8") as f:
        f.write(fixed)
    print("Spaces after inline math and before commas have been removed.")

def data_analysis():
    with open("./trainer/public/putnam_problems.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    
    for i in data:
        for j in range(len(data[i])):
            if "Solution" in data[i][j]["problem"]:
                data[i][j]["problem"] = data[i][j]["problem"][:data[i][j]["problem"].index("Solution")]
                print(i, data[i][j]["question"])
    
    with open("./trainer/public/putnam_problems.json", "w") as f:
        json.dump(data, f)

data_analysis()