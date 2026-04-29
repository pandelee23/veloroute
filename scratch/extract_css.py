import json
import os

log_path = r'C:\Users\xdedu\.gemini\antigravity\brain\ae97245e-27b5-4854-a78b-90bd7af1d78e\.system_generated\logs\overview.txt'
output_path = r'c:\Users\xdedu\Documents\Codigo\planificadorderutas\scratch\user_css.txt'

if not os.path.exists(os.path.dirname(output_path)):
    os.makedirs(os.path.dirname(output_path))

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('step_index') == 42:
                content = data.get('content', '')
                # Extract the CSS part from the content
                # The content starts with "<USER_REQUEST>\nno se veningun fondo topografico. usa este codigo css..."
                with open(output_path, 'w', encoding='utf-8') as out:
                    out.write(content)
                print(f"Extracted content to {output_path}")
                break
        except Exception as e:
            continue
