import os

replacements = [
  ('text-slate-100', 'text-slate-800'),
  ('text-slate-200', 'text-slate-700'),
  ('text-slate-300', 'text-slate-600'),
  ('text-slate-400', 'text-slate-500'),
  ('bg-slate-800/30', 'bg-white/60'),
  ('bg-slate-800/40', 'bg-white/70'),
  ('bg-slate-800/50', 'bg-white/80'),
  ('bg-slate-800', 'bg-white'),
  ('bg-slate-900/50', 'bg-slate-50/50'),
  ('bg-slate-900', 'bg-slate-50'),
  ('border-slate-700/30', 'border-slate-200/50'),
  ('border-slate-700/50', 'border-slate-200/50'),
  ('border-slate-700', 'border-slate-200'),
  ('text-white', 'text-slate-900'),
]

def process_dir(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                full_path = os.path.join(root, file)
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content
                for old, new in replacements:
                    new_content = new_content.replace(old, new)
                
                # Exceptions for buttons
                new_content = new_content.replace('text-slate-900 flex items-center justify-center', 'text-white flex items-center justify-center')
                new_content = new_content.replace('bg-indigo-600 hover:bg-indigo-500 text-slate-900', 'bg-indigo-600 hover:bg-indigo-500 text-white')
                new_content = new_content.replace('bg-blue-600 text-slate-900', 'bg-blue-600 text-white')
                new_content = new_content.replace('className="text-slate-900"', 'className="text-white"')
                
                if content != new_content:
                    with open(full_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print('Updated', full_path)

process_dir('src/pages/student')
process_dir('src/components/dashboard/widgets')
process_dir('src/pages/system')
print('Done')
