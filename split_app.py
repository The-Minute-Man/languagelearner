import os, re, json

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all local variables in App.jsx
# Matches `const [var1, var2] = ...`
state_vars = re.findall(r'const\s+\[\s*(\w+)\s*,\s*(\w+)\s*\]\s*=', content)
local_vars = set()
for v1, v2 in state_vars:
    local_vars.add(v1)
    local_vars.add(v2)

# Matches `const someFunc = `
func_vars = re.findall(r'const\s+(\w+)\s*=', content)
for v in func_vars:
    local_vars.add(v)

# Add other known variables
known_vars = ['session', 'isAdmin', 'isInClass', 'activeClass', 'availableClasses', 'profileLoading', 'userProfile', 'DEFAULT_CLASS_SLUG', 'DEFAULT_CLASS_NAME']
for v in known_vars:
    local_vars.add(v)

# Exclude common react/js keywords
exclude = {'const', 'let', 'var', 'if', 'else', 'return', 'import', 'from', 'export', 'default', 'function', 'true', 'false', 'null', 'undefined', 'console', 'window', 'document', 'Math', 'Date', 'String', 'Array', 'Object', 'JSON', 'e', 'err', 'event'}
local_vars -= exclude

tabs = ['flashcards', 'learn', 'practice', 'story', 'settings']
blocks = {}
for tab in tabs:
    start_str = f"{{activeTab === '{tab}' && ("
    start_idx = content.find(start_str)
    if start_idx == -1:
        continue
    
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
        close_brace = content.find('}', end_idx)
        block_content = content[start_idx:close_brace + 1]
        blocks[tab] = {
            'start': start_idx,
            'end': close_brace + 1,
            'content': block_content
        }

new_content = content
components_to_create = {}

for tab in reversed(tabs):
    if tab not in blocks: continue
    
    block_info = blocks[tab]
    block_text = block_info['content']
    
    # Extract inner JSX
    # {activeTab === 'tab' && ( ... )}
    inner_jsx = block_text[block_text.find('(')+1 : block_text.rfind(')')].strip()
    
    # Find all words in inner_jsx
    words = set(re.findall(r'\b[a-zA-Z_]\w*\b', inner_jsx))
    
    # Props to pass are words that are in local_vars
    props_to_pass = sorted(list(words.intersection(local_vars)))
    
    # Create component name
    comp_name = tab.capitalize() + 'Tab'
    
    # Generate component text
    comp_text = f"""import React from 'react';
import {{ FolderIcon, UploadIcon, SettingsIcon, StarIcon, CheckIcon, XIcon, ArrowRightIcon, ArrowLeftIcon, CloudIcon, CopyIcon }} from './Icons';

export default function {comp_name}(props) {{
  const {{
    {', '.join(props_to_pass)}
  }} = props;

  return (
    {inner_jsx}
  );
}}
"""
    components_to_create[f'src/components/{comp_name}.jsx'] = comp_text
    
    # Replace in new_content
    props_str = ' '.join([f"{p}={{{p}}}" for p in props_to_pass])
    replacement = f"{{activeTab === '{tab}' && (\n          <{comp_name}\n            {props_str}\n          />\n        )}}"
    new_content = new_content[:block_info['start']] + replacement + new_content[block_info['end']:]

# Add imports to top of new_content
imports = "\n".join([f"import {t.capitalize()}Tab from './components/{t.capitalize()}Tab';" for t in tabs if t in blocks])
import_idx = new_content.find('export default function App()')
new_content = new_content[:import_idx] + imports + "\n\n" + new_content[import_idx:]

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

for path, text in components_to_create.items():
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

print("Split successful!")
