#!/usr/bin/env python3
"""
Automatically clean up taxonomy-data folder by keeping only the most recent version.
"""

import os
import shutil
from pathlib import Path
from datetime import datetime

def auto_cleanup():
    """Automatically clean up backup files."""
    
    taxonomy_dir = Path("taxonomy-data")
    
    # Expected base category files
    expected_files = {
        "ai-machine-learning.json",
        "asset-creation.json", 
        "creative-code-frameworks.json",
        "display-tech-and-video.json",
        "game-engines-and-real-time-3d.json",
        "mobile-technology.json",
        "physical-computing.json",
        "physical-output-and-digital-fabrication.json",
        "professional-av-tools.json",
        "sensors-and-interaction-methods.json",
        "uncategorized-tools-and-utilities.json",
        "web-and-networking-tools.json"
    }
    
    # Get all JSON files (excluding _index.json and _metadata.json)
    all_files = [f for f in taxonomy_dir.glob("*.json") if not f.name.startswith("_")]
    
    print(f"Found {len(all_files)} files in taxonomy-data/")
    
    # Find the best version for each expected file
    for expected_file in expected_files:
        base_name = expected_file.replace('.json', '')
        
        # Find all files that match this category
        matching_files = []
        for file_path in all_files:
            if (file_path.name == expected_file or 
                file_path.name.startswith(f"{base_name}_backup") or
                file_path.name.startswith(f"{base_name}.json")):
                matching_files.append({
                    'path': file_path,
                    'mtime': file_path.stat().st_mtime,
                    'size': file_path.stat().st_size
                })
        
        if not matching_files:
            print(f"⚠️  No files found for {expected_file}")
            continue
            
        # Sort by modification time (newest first) and file size (larger first as tiebreaker)
        matching_files.sort(key=lambda x: (x['mtime'], x['size']), reverse=True)
        
        # The best file is the most recently modified (and largest if same time)
        best_file = matching_files[0]
        target_path = taxonomy_dir / expected_file
        
        if best_file['path'] == target_path:
            print(f"✅ {expected_file} is already correct")
        else:
            # Copy the best file to the correct name
            shutil.copy2(best_file['path'], target_path)
            mtime = datetime.fromtimestamp(best_file['mtime']).strftime('%Y-%m-%d %H:%M:%S')
            print(f"✅ Updated {expected_file} from {best_file['path'].name} ({mtime})")
        
        # Remove all other versions
        for file_info in matching_files:
            if file_info['path'] != target_path:
                try:
                    file_info['path'].unlink()
                    print(f"🗑️  Removed {file_info['path'].name}")
                except FileNotFoundError:
                    pass
    
    print(f"\n🎉 Cleanup complete!")
    
    # Show final state
    print(f"\nFinal files in taxonomy-data/:")
    remaining_files = sorted([f for f in taxonomy_dir.glob("*.json")])
    for file_path in remaining_files:
        if file_path.name.startswith("_"):
            print(f"📋 {file_path.name} (metadata)")
        else:
            mtime = datetime.fromtimestamp(file_path.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')
            size = file_path.stat().st_size
            print(f"📄 {file_path.name} - {mtime} ({size:,} bytes)")

if __name__ == "__main__":
    auto_cleanup()