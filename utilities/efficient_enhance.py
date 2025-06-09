#!/usr/bin/env python3
"""
Efficient API-based taxonomy enhancement strategies.
Minimizes API calls while maximizing content quality.
"""

import json
from pathlib import Path

def batch_nodes_by_category(data, max_batch_size=10):
    """Group related nodes for batch processing to save API calls."""
    batches = []
    
    def collect_nodes_by_parent(node, parent_name="", nodes_list=None):
        if nodes_list is None:
            nodes_list = []
        
        name = node.get("name", {}).get("en", "Unknown") if isinstance(node.get("name"), dict) else str(node.get("name", ""))
        current_path = f"{parent_name}/{name}" if parent_name else name
        
        # Add this node to the list
        nodes_list.append({
            "node": node,
            "path": current_path,
            "parent": parent_name
        })
        
        # Process children
        for child in node.get("children", []):
            collect_nodes_by_parent(child, current_path, nodes_list)
        
        return nodes_list
    
    all_nodes = collect_nodes_by_parent(data)
    
    # Group by parent category for batch processing
    categories = {}
    for node_info in all_nodes:
        parent = node_info["parent"].split("/")[0] if "/" in node_info["parent"] else "root"
        if parent not in categories:
            categories[parent] = []
        categories[parent].append(node_info)
    
    # Create batches within each category
    for category, nodes in categories.items():
        # Only process nodes that need enhancement
        low_quality_nodes = []
        for node_info in nodes:
            node = node_info["node"]
            desc_len = len(node.get("description", "").strip())
            has_links = bool(node.get("links", {}) and any(v.strip() for v in node.get("links", {}).values() if v))
            
            if desc_len < 50 or not has_links:
                low_quality_nodes.append(node_info)
        
        # Split into batches
        for i in range(0, len(low_quality_nodes), max_batch_size):
            batch = low_quality_nodes[i:i + max_batch_size]
            if batch:
                batches.append({
                    "category": category,
                    "nodes": batch,
                    "batch_id": f"{category}_{i//max_batch_size + 1}"
                })
    
    return batches

def create_enhancement_prompts():
    """Create efficient prompts for different types of enhancements."""
    
    prompts = {
        "batch_descriptions": """
Please enhance the following creative technology tools/concepts with concise, informative descriptions (50-150 characters each). Focus on what they are, primary use cases, and key distinguishing features:

{node_list}

Return JSON format:
{
  "enhancements": [
    {"name": "tool_name", "description": "enhanced description", "suggested_links": ["url1", "url2"]}
  ]
}
""",
        
        "category_context": """
Given this category: "{category_name}" in creative technology, provide enhanced descriptions for these tools. Consider their relationships and how they fit within this category:

{node_list}

Focus on:
- What each tool does specifically
- How it relates to others in this category  
- Primary creative use cases
- Key features that distinguish it

Return enhanced descriptions (50-150 chars each) and relevant links where possible.
""",
        
        "missing_links": """
For these creative technology tools, provide 1-2 relevant links each (official websites, documentation, or authoritative sources):

{tool_names}

Return JSON with tool names and their links.
"""
    }
    
    return prompts

def prioritize_nodes_by_impact(batches):
    """Prioritize which batches to process first based on impact."""
    
    # Priority categories (higher impact first)
    priority_categories = [
        "Creative Code Frameworks",
        "Game Engines", 
        "AI/Machine Learning",
        "Physical Computing",
        "Web Technologies"
    ]
    
    prioritized = []
    
    # First add high-priority categories
    for priority_cat in priority_categories:
        for batch in batches:
            if any(priority_cat.lower() in batch["category"].lower() for priority_cat in priority_categories):
                prioritized.append(batch)
                batch["priority"] = "high"
    
    # Then add remaining batches
    for batch in batches:
        if batch not in prioritized:
            prioritized.append(batch)
            batch["priority"] = "medium"
    
    return prioritized

def generate_processing_plan(data_file):
    """Generate an efficient processing plan for API calls."""
    
    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Create batches
    batches = batch_nodes_by_category(data)
    prioritized_batches = prioritize_nodes_by_impact(batches)
    
    # Calculate costs and efficiency
    total_nodes_needing_work = sum(len(batch["nodes"]) for batch in batches)
    estimated_api_calls = len(batches)  # One call per batch vs one per node
    
    plan = {
        "summary": {
            "total_nodes_needing_enhancement": total_nodes_needing_work,
            "estimated_api_calls": estimated_api_calls,
            "efficiency_improvement": f"{total_nodes_needing_work/estimated_api_calls:.1f}x",
            "total_batches": len(batches)
        },
        "batches": prioritized_batches[:10],  # Show first 10 batches
        "processing_strategies": [
            "Process high-priority categories first",
            "Batch related nodes together for context",
            "Use category-specific prompts for better results",
            "Process incrementally to manage costs",
            "Focus on nodes with missing descriptions first"
        ],
        "sample_prompt": create_enhancement_prompts()["category_context"]
    }
    
    return plan

def export_batch_for_processing(batch_id, data_file):
    """Export a specific batch for API processing."""
    
    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    batches = batch_nodes_by_category(data)
    target_batch = None
    
    for batch in batches:
        if batch["batch_id"] == batch_id:
            target_batch = batch
            break
    
    if not target_batch:
        return None
    
    # Format for API processing
    formatted_batch = {
        "batch_id": batch_id,
        "category": target_batch["category"],
        "nodes_to_enhance": []
    }
    
    for node_info in target_batch["nodes"]:
        node = node_info["node"]
        name = node.get("name", {}).get("en", "Unknown") if isinstance(node.get("name"), dict) else str(node.get("name", ""))
        
        formatted_batch["nodes_to_enhance"].append({
            "name": name,
            "current_description": node.get("description", ""),
            "current_links": node.get("links", {}),
            "path": node_info["path"]
        })
    
    return formatted_batch

if __name__ == "__main__":
    data_file = Path("public/Creative_Tech_Taxonomy_data.json")
    
    if not data_file.exists():
        print("Error: Creative_Tech_Taxonomy_data.json not found")
        exit(1)
    
    print("Generating efficient enhancement plan...")
    plan = generate_processing_plan(data_file)
    
    print(f"\n=== EFFICIENCY ANALYSIS ===")
    print(f"Nodes needing enhancement: {plan['summary']['total_nodes_needing_enhancement']}")
    print(f"Estimated API calls needed: {plan['summary']['estimated_api_calls']}")
    print(f"Efficiency improvement: {plan['summary']['efficiency_improvement']} (vs individual calls)")
    
    print(f"\n=== PROCESSING BATCHES (showing first 10) ===")
    for i, batch in enumerate(plan['batches'], 1):
        node_count = len(batch['nodes'])
        print(f"{i:2d}. {batch['batch_id']} ({batch['priority']} priority) - {node_count} nodes")
        print(f"    Category: {batch['category']}")
        sample_names = [node['node'].get('name', {}).get('en', 'Unknown') for node in batch['nodes'][:3]]
        print(f"    Sample tools: {', '.join(sample_names)}")
        print()
    
    print("=== RECOMMENDED WORKFLOW ===")
    for i, strategy in enumerate(plan['processing_strategies'], 1):
        print(f"{i}. {strategy}")
    
    # Export first batch as example
    if plan['batches']:
        first_batch_id = plan['batches'][0]['batch_id']
        sample_batch = export_batch_for_processing(first_batch_id, data_file)
        
        with open('sample_batch_for_api.json', 'w', encoding='utf-8') as f:
            json.dump(sample_batch, f, indent=2, ensure_ascii=False)
        
        print(f"\nSample batch exported to: sample_batch_for_api.json")
        print("Use this format for API processing!")