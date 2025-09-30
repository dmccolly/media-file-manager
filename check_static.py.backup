import os
import sys

print("=== Flask Static File Configuration Check ===")
print(f"Current working directory: {os.getcwd()}")
print(f"build directory exists: {os.path.exists('build')}")
print(f"build/static exists: {os.path.exists('build/static')}")
print(f"build/static/css exists: {os.path.exists('build/static/css')}")

if os.path.exists('build/static/css'):
    css_files = os.listdir('build/static/css')
    print(f"CSS files: {css_files}")
    for css_file in css_files:
        css_path = os.path.join('build/static/css', css_file)
        if os.path.isfile(css_path):
            size = os.path.getsize(css_path)
            print(f"  {css_file}: {size} bytes")

print(f"build/index.html exists: {os.path.exists('build/index.html')}")
if os.path.exists('build/index.html'):
    with open('build/index.html', 'r') as f:
        content = f.read()
        if 'main.6fa19348.css' in content:
            print("✓ HTML contains CSS link")
        else:
            print("✗ HTML missing CSS link")
