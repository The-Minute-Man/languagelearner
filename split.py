import os

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

tabs = ['flashcards', 'learn', 'practice', 'story', 'settings']
blocks = {}
for tab in tabs:
    start_str = f"{{activeTab === '{tab}' && ("
    start_idx = content.find(start_str)
    if start_idx == -1:
        print(f'Could not find start for {tab}')
        continue
    
    # find matching parenthesis
    paren_count = 0
    in_paren = False
    end_idx = -1
    for i in range(start_idx + len(start_str) - 1, len(content)):
        if content[i] == '(':
            paren_count += 1
            in_paren = True
        elif content[i] == ')':
            paren_count -= 1
            if in_paren and paren_count == 0:
                end_idx = i
                break
    
    if end_idx != -1:
        # include the closing curly brace
        close_brace = content.find('}', end_idx)
        blocks[tab] = (start_idx, close_brace + 1)
        print(f'Found {tab}: {start_idx} to {close_brace + 1}')

import json
print(json.dumps(blocks))
