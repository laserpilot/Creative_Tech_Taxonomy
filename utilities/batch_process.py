#!/usr/bin/env python3
"""
Process multiple batches automatically with rate limiting.
"""

import json
import time
import sys
from pathlib import Path

# Add parent directory to path to import other utilities
sys.path.append(str(Path(__file__).parent))

from apply_enhancements import TaxonomyEnhancer
from efficient_enhance import batch_nodes_by_category, prioritize_nodes_by_impact

def process_multiple_batches(max_batches=5, delay_between_calls=2):
    """Process multiple batches with rate limiting."""
    
    # Load main data (go up one directory from utilities/)
    data_file = Path("../public/Creative_Tech_Taxonomy_data.json")
    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Generate all batches
    batches = batch_nodes_by_category(data, max_batch_size=10)
    prioritized_batches = prioritize_nodes_by_impact(batches)
    
    print(f"Found {len(prioritized_batches)} total batches")
    print(f"Processing first {max_batches} batches...")
    
    # Initialize enhancer
    enhancer = TaxonomyEnhancer()
    
    total_enhanced = 0
    
    for i, batch in enumerate(prioritized_batches[:max_batches], 1):
        print(f"\n{'='*50}")
        print(f"PROCESSING BATCH {i}/{max_batches}")
        print(f"Category: {batch['category']}")
        print(f"Nodes: {len(batch['nodes'])}")
        print(f"{'='*50}")
        
        # Create temporary batch file
        batch_data = {
            "batch_id": batch["batch_id"],
            "category": batch["category"],
            "nodes_to_enhance": []
        }
        
        for node_info in batch["nodes"]:
            node = node_info["node"]
            name = node.get("name", {}).get("en", "Unknown") if isinstance(node.get("name"), dict) else str(node.get("name", ""))
            
            batch_data["nodes_to_enhance"].append({
                "name": name,
                "current_description": node.get("description", ""),
                "current_links": node.get("links", {}),
                "path": node_info["path"]
            })
        
        # Save temp batch file
        temp_batch_file = Path(f"temp_batch_{i}.json")
        with open(temp_batch_file, 'w', encoding='utf-8') as f:
            json.dump(batch_data, f, indent=2, ensure_ascii=False)
        
        try:
            # Process the batch
            success = enhancer.process_batch_file(temp_batch_file, data_file)
            
            if success:
                total_enhanced += len(batch_data["nodes_to_enhance"])
                print(f"✅ Batch {i} completed successfully")
            else:
                print(f"❌ Batch {i} failed")
            
            # Clean up temp file
            temp_batch_file.unlink()
            
            # Rate limiting
            if i < max_batches:
                print(f"⏱️  Waiting {delay_between_calls} seconds before next batch...")
                time.sleep(delay_between_calls)
                
        except Exception as e:
            print(f"❌ Error processing batch {i}: {e}")
            if temp_batch_file.exists():
                temp_batch_file.unlink()
            continue
    
    print(f"\n🎉 BATCH PROCESSING COMPLETE!")
    print(f"Total batches processed: {max_batches}")
    print(f"Total nodes enhanced: {total_enhanced}")
    print(f"Remaining batches: {len(prioritized_batches) - max_batches}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Process multiple enhancement batches')
    parser.add_argument('--max-batches', type=int, default=5, 
                       help='Maximum number of batches to process (default: 5)')
    parser.add_argument('--delay', type=int, default=2,
                       help='Delay between API calls in seconds (default: 2)')
    
    args = parser.parse_args()
    
    process_multiple_batches(args.max_batches, args.delay)