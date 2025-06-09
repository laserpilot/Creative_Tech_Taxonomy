#!/usr/bin/env python3
"""
Script to apply AI-generated enhancements to taxonomy nodes.
Uses Claude API to enhance nodes in batches and updates the JSON file.
"""

import json
import os
import sys
from pathlib import Path
import anthropic
from datetime import datetime

class TaxonomyEnhancer:
    def __init__(self, api_key=None):
        if api_key:
            self.client = anthropic.Anthropic(api_key=api_key)
        elif os.getenv('ANTHROPIC_API_KEY'):
            self.client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
        else:
            print("Error: Claude API key required. Set ANTHROPIC_API_KEY environment variable or pass as argument.")
            sys.exit(1)
    
    def enhance_batch(self, batch_data):
        """Enhance a batch of nodes using Claude API."""
        
        # Create the prompt
        node_list = []
        for node in batch_data['nodes_to_enhance']:
            current_desc = node['current_description'] or "No description"
            node_list.append(f"- {node['name']}: {current_desc}")
        
        prompt = f"""
Enhance these creative technology tools/concepts with concise, informative descriptions (50-150 characters each). 
Category: {batch_data['category']}

Tools to enhance:
{chr(10).join(node_list)}

For each tool, provide:
1. A clear, concise description (50-150 chars) explaining what it is and its primary use
2. 1-2 relevant links (official site, documentation, or authoritative source)

Focus on accuracy and usefulness for creative technologists.

Return in this JSON format:
{{
  "enhancements": [
    {{
      "name": "tool_name",
      "description": "enhanced description here",
      "links": {{"Official": "https://example.com", "Docs": "https://docs.example.com"}}
    }}
  ]
}}
"""
        
        try:
            response = self.client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=2000,
                temperature=0.3,
                system="You are an expert in creative technology tools and frameworks. Provide accurate, concise information about technical tools.",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            content = response.content[0].text
            
            # Try to parse the JSON response
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                # If direct JSON parsing fails, try to extract JSON from the response
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
                else:
                    print(f"Failed to parse API response: {content}")
                    return None
                    
        except Exception as e:
            print(f"API call failed: {e}")
            return None
    
    def update_node_in_tree(self, tree, target_path, enhancement):
        """Recursively find and update a node in the tree."""
        
        def update_recursive(node, current_path=""):
            name = node.get("name", {})
            if isinstance(name, dict):
                node_name = name.get("en", "")
            else:
                node_name = str(name)
            
            current_full_path = f"{current_path}/{node_name}" if current_path else node_name
            
            # Check if this matches our target (handle both full path and partial path matching)
            # Remove "Creative Tech Taxonomy" prefix if present for matching individual files
            normalized_target = target_path
            if target_path.startswith("Creative Tech Taxonomy/"):
                normalized_target = target_path[len("Creative Tech Taxonomy/"):]
            
            # Check exact match or end-of-path match
            if (current_full_path == target_path or 
                current_full_path == normalized_target or
                target_path.endswith(current_full_path) or
                normalized_target.endswith(current_full_path)):
                
                # Update description if provided and current is weak
                if enhancement.get("description"):
                    current_desc = node.get("description", "").strip()
                    if len(current_desc) < 50:
                        node["description"] = enhancement["description"]
                        print(f"  ✓ Updated description for: {node_name}")
                        return True
                
                # Update links if provided and current are weak
                if enhancement.get("links"):
                    current_links = node.get("links", {})
                    if not any(v.strip() for v in current_links.values() if v):
                        node["links"] = enhancement["links"]
                        print(f"  ✓ Updated links for: {node_name}")
                        return True
            
            # Recursively check children
            for child in node.get("children", []):
                if update_recursive(child, current_full_path):
                    return True
            
            return False
        
        return update_recursive(tree)
    
    def process_batch_file(self, batch_file, data_file):
        """Process a batch file and update the source taxonomy files."""
        
        # Load batch data
        with open(batch_file, 'r', encoding='utf-8') as f:
            batch_data = json.load(f)
        
        print(f"Processing batch: {batch_data['batch_id']}")
        print(f"Category: {batch_data['category']}")
        print(f"Nodes to enhance: {len(batch_data['nodes_to_enhance'])}")
        
        # Get enhancements from API
        print("Calling Claude API...")
        enhancements = self.enhance_batch(batch_data)
        
        if not enhancements:
            print("Failed to get enhancements from API")
            return False
        
        # Load all source files from taxonomy-data/
        taxonomy_files = {}
        taxonomy_data_dir = Path("taxonomy-data")
        
        for json_file in taxonomy_data_dir.glob("*.json"):
            if json_file.name.startswith("_"):  # Skip _index.json and _metadata.json
                continue
            
            with open(json_file, 'r', encoding='utf-8') as f:
                taxonomy_files[json_file.name] = {
                    "data": json.load(f),
                    "path": json_file,
                    "modified": False
                }
        
        print(f"Loaded {len(taxonomy_files)} source taxonomy files")
        
        # Apply enhancements to source files
        enhanced_count = 0
        for enhancement in enhancements.get("enhancements", []):
            # Find the corresponding node in our batch
            target_node = None
            for node in batch_data['nodes_to_enhance']:
                if node['name'] == enhancement['name']:
                    target_node = node
                    break
            
            if target_node:
                # Try to update in each source file
                for filename, file_info in taxonomy_files.items():
                    if self.update_node_in_tree(file_info["data"], target_node['path'], enhancement):
                        file_info["modified"] = True
                        enhanced_count += 1
                        break
        
        # Save modified source files
        saved_files = 0
        for filename, file_info in taxonomy_files.items():
            if file_info["modified"]:
                # Create single backup (overwrite previous backup)
                backup_file = file_info["path"].parent / f"{file_info['path'].stem}_backup.json"
                backup_file.write_text(file_info["path"].read_text(), encoding='utf-8')
                
                # Save updated file
                with open(file_info["path"], 'w', encoding='utf-8') as f:
                    json.dump(file_info["data"], f, indent=2, ensure_ascii=False)
                
                print(f"✓ Updated: {filename} (backup: {backup_file.name})")
                saved_files += 1
        
        if enhanced_count > 0:
            print(f"✓ Successfully enhanced {enhanced_count} nodes across {saved_files} files")
            print("\n🔄 Now rebuilding main taxonomy file...")
            
            # Rebuild the main taxonomy file
            import subprocess
            try:
                subprocess.run(["python", "build_taxonomy.py"], check=True)
                print("✓ Main taxonomy file rebuilt")
            except subprocess.CalledProcessError:
                print("❌ Failed to rebuild main taxonomy file - run 'python build_taxonomy.py' manually")
        else:
            print("No nodes were enhanced")
        
        return enhanced_count > 0

def main():
    """Main function."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Apply AI enhancements to taxonomy nodes')
    parser.add_argument('batch_file', help='Batch file to process (e.g., sample_batch_for_api.json)')
    parser.add_argument('--api-key', help='Claude API key (or set ANTHROPIC_API_KEY env var)')
    parser.add_argument('--data-file', default='public/Creative_Tech_Taxonomy_data.json', 
                       help='Main taxonomy data file')
    
    args = parser.parse_args()
    
    # Check files exist
    batch_file = Path(args.batch_file)
    data_file = Path(args.data_file)
    
    if not batch_file.exists():
        print(f"Error: Batch file not found: {batch_file}")
        sys.exit(1)
    
    if not data_file.exists():
        print(f"Error: Data file not found: {data_file}")
        sys.exit(1)
    
    # Initialize enhancer
    enhancer = TaxonomyEnhancer(args.api_key)
    
    # Process the batch
    success = enhancer.process_batch_file(batch_file, data_file)
    
    if success:
        print("\n🎉 Enhancement complete!")
        print("\nNext steps:")
        print("1. Run 'python analyze_nodes.py' to see the improvement")
        print("2. Generate the next batch with 'python efficient_enhance.py'")
        print("3. Continue processing batches as needed")
    else:
        print("\n❌ Enhancement failed")

if __name__ == "__main__":
    main()