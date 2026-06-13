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

files = [
    'src/pages/InstructorDashboard.tsx',
    'src/pages/NotificationsPage.tsx',
    'src/pages/UserProfile.tsx',
]

for file in files:
    if os.path.exists(file):
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = content
        for old, new in replacements:
            new_content = new_content.replace(old, new)
        
        if content != new_content:
            with open(file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print('Updated', file)

print('Done')
