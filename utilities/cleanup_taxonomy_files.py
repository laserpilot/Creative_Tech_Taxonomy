#!/usr/bin/env python3
"""
Clean up taxonomy-data folder by keeping only the most recent version of each category file.
"""

import os
import json
from pathlib import Path
from datetime import datetime

def cleanup_taxonomy_files():
    """Clean up backup files and keep only the most recent version of each category."""
    
    taxonomy_dir = Path("taxonomy-data")
    
    # Get all JSON files (excluding _index.json and _metadata.json)
    all_files = [f for f in taxonomy_dir.glob("*.json") if not f.name.startswith("_")]
    
    # Group files by base category name
    categories = {}
    
    for file_path in all_files:
        # Extract base category name (everything before first underscore or the whole name)
        base_name = file_path.name.split('_backup')[0]
        
        if base_name not in categories:
            categories[base_name] = []
        
        categories[base_name].append({
            'path': file_path,
            'mtime': file_path.stat().st_mtime,
            'size': file_path.stat().st_size
        })
    
    print("Found the following categories:")
    for base_name, files in categories.items():
        print(f"\n📁 {base_name}:")
        for file_info in sorted(files, key=lambda x: x['mtime'], reverse=True):
            mtime = datetime.fromtimestamp(file_info['mtime']).strftime('%Y-%m-%d %H:%M:%S')
            size = file_info['size']
            print(f"   {file_info['path'].name} - {mtime} ({size:,} bytes)")
    
    print(f"\n{'='*60}")
    print("CLEANUP PLAN:")
    print(f"{'='*60}")
    
    files_to_keep = []
    files_to_remove = []
    
    for base_name, files in categories.items():
        # Sort by modification time (newest first)
        sorted_files = sorted(files, key=lambda x: x['mtime'], reverse=True)
        
        # Keep the most recent file
        most_recent = sorted_files[0]
        
        # Determine the target filename (should be the base category name)
        target_filename = f"{base_name}.json"
        target_path = taxonomy_dir / target_filename
        
        if most_recent['path'].name == target_filename:
            # Already has correct name
            files_to_keep.append(most_recent['path'])
            print(f"✅ KEEP: {most_recent['path'].name} (already correct name)")
        else:
            # Need to rename to correct name
            files_to_keep.append({
                'source': most_recent['path'],
                'target': target_path,
                'action': 'rename'
            })
            print(f"🔄 RENAME: {most_recent['path'].name} → {target_filename}")
        
        # Mark older files for removal
        for old_file in sorted_files[1:]:
            files_to_remove.append(old_file['path'])
            print(f"🗑️  REMOVE: {old_file['path'].name}")
    
    print(f"\nSummary:")
    print(f"Files to keep/rename: {len(files_to_keep)}")
    print(f"Files to remove: {len(files_to_remove)}")
    
    # Ask for confirmation
    response = input(f"\nProceed with cleanup? (y/N): ").lower().strip()
    
    if response != 'y':
        print("❌ Cleanup cancelled")
        return
    
    # Perform cleanup
    print(f"\n{'='*40}")
    print("PERFORMING CLEANUP...")
    print(f"{'='*40}")
    
    # First, handle renames
    for item in files_to_keep:
        if isinstance(item, dict) and item.get('action') == 'rename':
            source = item['source']
            target = item['target']
            
            # Read content and write to target
            with open(source, 'r', encoding='utf-8') as f:
                content = f.read()
            
            with open(target, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"✅ Renamed: {source.name} → {target.name}")
            
            # Add source to removal list (will be removed in next step)
            files_to_remove.append(source)
    
    # Remove old files
    for file_path in files_to_remove:
        try:
            file_path.unlink()
            print(f"🗑️  Removed: {file_path.name}")
        except FileNotFoundError:
            print(f"⚠️  Already removed: {file_path.name}")
    
    print(f"\n🎉 Cleanup complete!")
    
    # Show final state
    print(f"\n{'='*40}")
    print("FINAL STATE:")
    print(f"{'='*40}")
    
    remaining_files = [f for f in taxonomy_dir.glob("*.json") if not f.name.startswith("_")]
    remaining_files.sort()
    
    for file_path in remaining_files:
        mtime = datetime.fromtimestamp(file_path.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')
        size = file_path.stat().st_size
        print(f"📄 {file_path.name} - {mtime} ({size:,} bytes)")

if __name__ == "__main__":
    cleanup_taxonomy_files()