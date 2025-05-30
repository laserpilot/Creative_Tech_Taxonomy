#!/usr/bin/env python3
"""
Build script to merge taxonomy categories into single file for d3
"""
import json
import os
from pathlib import Path

def build_taxonomy():
    """Merge all category files into main taxonomy file"""
    
    # Load metadata
    with open('taxonomy-data/_metadata.json', 'r') as f:
        taxonomy = json.load(f)
    
    # Load category index to get proper order
    with open('taxonomy-data/_index.json', 'r') as f:
        category_index = json.load(f)
    
    # Sort by order
    category_index.sort(key=lambda x: x['order'])
    
    # Load and merge categories in order
    children = []
    for category_info in category_index:
        filename = category_info['filename']
        filepath = f"taxonomy-data/{filename}"
        
        try:
            with open(filepath, 'r') as f:
                category_data = json.load(f)
                children.append(category_data)
                print(f"✅ Loaded: {category_info['name']}")
        except FileNotFoundError:
            print(f"❌ Missing: {filepath}")
            continue
    
    # Combine into final taxonomy
    taxonomy['children'] = children
    
    # Write to public directory
    output_path = 'public/Creative_Tech_Taxonomy_data.json'
    with open(output_path, 'w') as f:
        json.dump(taxonomy, f, indent=2, ensure_ascii=False)
    
    print(f"\n🎉 Built taxonomy with {len(children)} categories")
    print(f"📁 Output: {output_path}")
    print(f"📊 File size: {os.path.getsize(output_path):,} bytes")

if __name__ == "__main__":
    build_taxonomy()