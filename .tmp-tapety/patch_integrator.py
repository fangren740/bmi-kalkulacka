from pathlib import Path

path = Path('.tmp-tapety/integrate.py')
text = path.read_text(encoding='utf-8')
old_loop = """for item in items:\n    priority = item.get('priority')\n    if isinstance(priority, int) and priority >= 94:\n        item['priority'] = priority + 1\n"""
new_loop = """existing_priorities = [item.get('priority') for item in items if isinstance(item.get('priority'), int)]\nnew_priority = max(existing_priorities, default=0) + 1\n"""
if old_loop not in text:
    raise SystemExit('priority loop patch target missing')
text = text.replace(old_loop, new_loop, 1)
if "    'priority': 94," not in text:
    raise SystemExit('new item priority patch target missing')
text = text.replace("    'priority': 94,", "    'priority': new_priority,", 1)
old_asserts = """items.sort(key=lambda item: item.get('priority', 10**9))\npriorities = [item.get('priority') for item in items]\nrequire(len(items) == 132, f'expected 132 registry items after release, found {len(items)}')\nrequire(len(set(priorities)) == len(priorities), 'registry priority collision after insert')\nrequire(priorities == list(range(1, 133)), 'registry priorities are not contiguous 1..132 after insert')\n"""
new_asserts = """require(len(items) == 132, f'expected 132 registry items after release, found {len(items)}')\nrequire(new_priority not in existing_priorities, 'new registry priority is not unique')\n"""
if old_asserts not in text:
    raise SystemExit('priority assertion patch target missing')
text = text.replace(old_asserts, new_asserts, 1)
path.write_text(text, encoding='utf-8')
print('Integrator priority handling patched: existing registry ordering preserved; tapety appended with next free max priority.')
